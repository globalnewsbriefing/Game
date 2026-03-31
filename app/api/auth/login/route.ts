import { NextResponse } from "next/server";
import {
  createAccessSession,
  getAccessConfig,
  getAccessCookieName,
  getSessionTtlSeconds,
} from "@/lib/access";

export async function POST(request: Request) {
  const config = getAccessConfig();

  if (!config) {
    return NextResponse.json(
      {
        error:
          "Private site access is not configured. Set SITE_ACCESS_USERNAME, SITE_ACCESS_PASSWORD, and SITE_ACCESS_SECRET.",
      },
      { status: 500 },
    );
  }

  const formData = await request.formData();
  const username = String(formData.get("username") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const next = String(formData.get("next") ?? "/");

  if (username !== config.username || password !== config.password) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("error", "invalid");
    if (next.startsWith("/")) {
      loginUrl.searchParams.set("next", next);
    }

    return NextResponse.redirect(loginUrl, { status: 303 });
  }

  const response = NextResponse.redirect(new URL(next.startsWith("/") ? next : "/", request.url), {
    status: 303,
  });
  response.cookies.set(getAccessCookieName(), await createAccessSession(username), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: getSessionTtlSeconds(),
  });
  return response;
}
