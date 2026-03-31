const ACCESS_COOKIE_NAME = "site_access_session";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7;

type AccessConfig = {
  username: string;
  password: string;
  secret: string;
};

type SessionPayload = {
  u: string;
  exp: number;
};

const encoder = new TextEncoder();
const decoder = new TextDecoder();

function base64UrlEncode(bytes: Uint8Array) {
  let binary = "";

  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });

  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function base64UrlDecode(value: string) {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(value.length / 4) * 4, "=");
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return bytes;
}

async function signValue(value: string, secret: string) {
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    {
      name: "HMAC",
      hash: "SHA-256",
    },
    false,
    ["sign"],
  );

  const signature = await crypto.subtle.sign("HMAC", cryptoKey, encoder.encode(value));
  return base64UrlEncode(new Uint8Array(signature));
}

function parsePayload(value: string): SessionPayload | null {
  try {
    const payload = JSON.parse(decoder.decode(base64UrlDecode(value))) as SessionPayload;

    if (typeof payload.u !== "string" || typeof payload.exp !== "number") {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

export function getAccessConfig(): AccessConfig | null {
  const username = process.env.SITE_ACCESS_USERNAME?.trim();
  const password = process.env.SITE_ACCESS_PASSWORD;
  const secret = process.env.SITE_ACCESS_SECRET?.trim();

  if (!username || !password || !secret) {
    return null;
  }

  return { username, password, secret };
}

export function isAccessConfigured() {
  return getAccessConfig() !== null;
}

export function getAccessCookieName() {
  return ACCESS_COOKIE_NAME;
}

export function getSessionTtlSeconds() {
  return SESSION_TTL_SECONDS;
}

export async function createAccessSession(username: string) {
  const config = getAccessConfig();

  if (!config) {
    throw new Error("Access control is not configured.");
  }

  const payload = base64UrlEncode(
    encoder.encode(
      JSON.stringify({
        u: username,
        exp: Date.now() + SESSION_TTL_SECONDS * 1000,
      } satisfies SessionPayload),
    ),
  );
  const signature = await signValue(payload, config.secret);

  return `${payload}.${signature}`;
}

export async function verifyAccessSession(token: string | undefined | null) {
  const config = getAccessConfig();

  if (!config || !token) {
    return false;
  }

  const [payloadValue, signature] = token.split(".");

  if (!payloadValue || !signature) {
    return false;
  }

  const expectedSignature = await signValue(payloadValue, config.secret);

  if (signature !== expectedSignature) {
    return false;
  }

  const payload = parsePayload(payloadValue);

  if (!payload || payload.exp <= Date.now()) {
    return false;
  }

  return payload.u === config.username;
}
