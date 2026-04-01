import { createHash } from "node:crypto";
import { spawn } from "node:child_process";
import type { NewsStory } from "@/lib/news";

export type PolymarketOutcome = {
  label: string;
  price: number | null;
};

export type PolymarketMarketStatus = "open" | "closed" | "resolved" | "unknown";

export type PolymarketMarket = {
  id: string;
  question: string;
  slug: string | null;
  url: string | null;
  status: PolymarketMarketStatus;
  yesPrice: number | null;
  noPrice: number | null;
  volume: number | null;
  liquidity: number | null;
  endDate: string | null;
  outcomes: PolymarketOutcome[];
};

export type PolymarketSnapshot = {
  generatedAt: string;
  status: "ready" | "disabled" | "error";
  message: string;
  markets: PolymarketMarket[];
  summary: {
    totalMarkets: number;
    openMarkets: number;
    pricedMarkets: number;
    totalVolume: number | null;
  };
};

export type StoryMarketMatch = {
  storyId: string;
  markets: PolymarketMarket[];
};

type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };
type JsonRecord = { [key: string]: JsonValue };

type CliConfig = {
  bin: string;
  args: string[];
  timeoutMs: number;
  limit: number;
};

const DEFAULT_TIMEOUT_MS = 8_000;
const DEFAULT_MARKET_LIMIT = 6;
const DISABLED_MESSAGE =
  "Polymarket CLI is not configured. Set POLYMARKET_CLI_BIN and POLYMARKET_CLI_ARGS_JSON to enable live market data.";

function isJsonRecord(value: JsonValue | unknown): value is JsonRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function buildMarketId(question: string, slug: string | null, index: number) {
  const raw = `${slug ?? "market"}:${question}:${index}`;
  return createHash("sha256").update(raw).digest("hex").slice(0, 20);
}

function readString(record: JsonRecord, keys: string[]) {
  for (const key of keys) {
    const value = record[key];

    if (typeof value === "string" && value.trim().length > 0) {
      return value.trim();
    }
  }

  return null;
}

function readNumber(record: JsonRecord, keys: string[]) {
  for (const key of keys) {
    const value = record[key];

    if (typeof value === "number" && Number.isFinite(value)) {
      return value;
    }

    if (typeof value === "string") {
      const parsed = Number(value);

      if (Number.isFinite(parsed)) {
        return parsed;
      }
    }
  }

  return null;
}

function readBoolean(record: JsonRecord, keys: string[]) {
  for (const key of keys) {
    const value = record[key];

    if (typeof value === "boolean") {
      return value;
    }

    if (typeof value === "string") {
      if (value === "true") {
        return true;
      }

      if (value === "false") {
        return false;
      }
    }
  }

  return null;
}

export function normalizeStatus(record: JsonRecord): PolymarketMarketStatus {
  const rawStatus = readString(record, ["status", "marketStatus", "state"])?.toLowerCase();

  if (rawStatus) {
    if (["open", "active", "live"].includes(rawStatus)) {
      return "open";
    }

    if (["resolved", "settled"].includes(rawStatus)) {
      return "resolved";
    }

    if (["closed", "ended", "inactive"].includes(rawStatus)) {
      return "closed";
    }
  }

  const isClosed = readBoolean(record, ["closed", "isClosed"]);
  if (isClosed === true) {
    return "closed";
  }

  const isActive = readBoolean(record, ["active", "isActive"]);
  if (isActive === true) {
    return "open";
  }

  if (isActive === false) {
    return "closed";
  }

  return "unknown";
}

export function normalizeProbability(value: number | null) {
  if (value === null) {
    return null;
  }

  if (value > 1) {
    return Math.max(0, Math.min(1, value / 100));
  }

  return Math.max(0, Math.min(1, value));
}

function normalizeOutcomeRecord(record: JsonRecord) {
  const label = readString(record, ["label", "name", "outcome", "title"]);
  const rawPrice = readNumber(record, ["price", "probability", "value", "lastPrice"]);

  if (!label) {
    return null;
  }

  return {
    label,
    price: normalizeProbability(rawPrice),
  } satisfies PolymarketOutcome;
}

function normalizeOutcomes(record: JsonRecord) {
  const source =
    record.outcomes ??
    record.prices ??
    record.outcomePrices ??
    record.outcome_prices ??
    record.tokens;

  if (Array.isArray(source)) {
    return source
      .map((entry) => {
        if (isJsonRecord(entry)) {
          return normalizeOutcomeRecord(entry);
        }

        return null;
      })
      .filter((entry): entry is PolymarketOutcome => Boolean(entry));
  }

  if (isJsonRecord(source)) {
    return Object.entries(source)
      .map(([label, value]) => {
        if (typeof value === "number") {
          return { label, price: normalizeProbability(value) };
        }

        if (typeof value === "string") {
          const parsed = Number(value);

          if (Number.isFinite(parsed)) {
            return { label, price: normalizeProbability(parsed) };
          }
        }

        return null;
      })
      .filter((entry): entry is PolymarketOutcome => Boolean(entry));
  }

  return [];
}

function selectOutcomePrice(outcomes: PolymarketOutcome[], label: string) {
  const outcome = outcomes.find((entry) => entry.label.toLowerCase() === label);
  return outcome?.price ?? null;
}

export function normalizeMarket(record: JsonRecord, index: number): PolymarketMarket | null {
  const question = readString(record, ["question", "title", "name"]);

  if (!question) {
    return null;
  }

  const slug = readString(record, ["slug", "marketSlug"]);
  const outcomes = normalizeOutcomes(record);
  const yesPrice =
    normalizeProbability(readNumber(record, ["yesPrice", "bestAskYes", "lastYesPrice"])) ??
    selectOutcomePrice(outcomes, "yes");
  const noPrice =
    normalizeProbability(readNumber(record, ["noPrice", "bestAskNo", "lastNoPrice"])) ??
    selectOutcomePrice(outcomes, "no");

  return {
    id: readString(record, ["id", "marketId", "conditionId"]) ?? buildMarketId(question, slug, index),
    question,
    slug,
    url: readString(record, ["url", "link"]),
    status: normalizeStatus(record),
    yesPrice,
    noPrice,
    volume: readNumber(record, ["volume", "volume24hr", "volumeNum"]),
    liquidity: readNumber(record, ["liquidity", "liquidityNum"]),
    endDate: readString(record, ["endDate", "end_date", "closeTime", "closeDate", "resolutionDate"]),
    outcomes,
  } satisfies PolymarketMarket;
}

function parseArgsJson(value: string | undefined) {
  if (!value) {
    return [];
  }

  let parsed: unknown;

  try {
    parsed = JSON.parse(value);
  } catch {
    throw new Error("POLYMARKET_CLI_ARGS_JSON must be valid JSON.");
  }

  if (!Array.isArray(parsed) || parsed.some((entry) => typeof entry !== "string")) {
    throw new Error("POLYMARKET_CLI_ARGS_JSON must be a JSON array of strings.");
  }

  return parsed;
}

function readConfig(): CliConfig | null {
  const bin = process.env.POLYMARKET_CLI_BIN?.trim();

  if (!bin) {
    return null;
  }

  const args = parseArgsJson(process.env.POLYMARKET_CLI_ARGS_JSON);
  const timeoutValue = Number(process.env.POLYMARKET_CLI_TIMEOUT_MS);
  const limitValue = Number(process.env.POLYMARKET_CLI_MARKET_LIMIT);

  return {
    bin,
    args,
    timeoutMs:
      Number.isFinite(timeoutValue) && timeoutValue >= 1_000
        ? Math.min(timeoutValue, 30_000)
        : DEFAULT_TIMEOUT_MS,
    limit:
      Number.isFinite(limitValue) && limitValue >= 1
        ? Math.min(Math.floor(limitValue), 24)
        : DEFAULT_MARKET_LIMIT,
  };
}

async function runCli(config: CliConfig) {
  return await new Promise<{ stdout: string; stderr: string }>((resolve, reject) => {
    const child = spawn(config.bin, config.args, {
      cwd: process.cwd(),
      env: process.env,
      stdio: ["ignore", "pipe", "pipe"],
    });

    let stdout = "";
    let stderr = "";
    let didTimeout = false;

    const timer = setTimeout(() => {
      didTimeout = true;
      child.kill("SIGTERM");
    }, config.timeoutMs);

    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });

    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });

    child.on("error", (error) => {
      clearTimeout(timer);
      reject(error);
    });

    child.on("close", (code) => {
      clearTimeout(timer);

      if (didTimeout) {
        reject(new Error(`Polymarket CLI timed out after ${config.timeoutMs}ms.`));
        return;
      }

      if (code !== 0) {
        reject(
          new Error(
            `Polymarket CLI exited with code ${code}.${stderr.trim() ? ` ${stderr.trim()}` : ""}`,
          ),
        );
        return;
      }

      resolve({ stdout, stderr });
    });
  });
}

export function parsePayload(stdout: string) {
  const trimmed = stdout.trim();

  if (!trimmed) {
    throw new Error("Polymarket CLI returned empty stdout.");
  }

  try {
    return JSON.parse(trimmed) as JsonValue;
  } catch {
    const entries = trimmed
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => JSON.parse(line) as JsonValue);

    return entries as JsonValue;
  }
}

export function extractMarketRecords(payload: JsonValue) {
  if (Array.isArray(payload)) {
    return payload.filter((entry): entry is JsonRecord => isJsonRecord(entry));
  }

  if (isJsonRecord(payload)) {
    if (Array.isArray(payload.markets)) {
      return payload.markets.filter((entry): entry is JsonRecord => isJsonRecord(entry));
    }

    if (Array.isArray(payload.data)) {
      return payload.data.filter((entry): entry is JsonRecord => isJsonRecord(entry));
    }

    if (isJsonRecord(payload.data) && Array.isArray(payload.data.markets)) {
      return payload.data.markets.filter((entry): entry is JsonRecord => isJsonRecord(entry));
    }
  }

  throw new Error("Polymarket CLI output must be a JSON array or an object with a markets array.");
}

export function buildSummary(markets: PolymarketMarket[]) {
  const volumes = markets.map((market) => market.volume).filter((value): value is number => value !== null);

  return {
    totalMarkets: markets.length,
    openMarkets: markets.filter((market) => market.status === "open").length,
    pricedMarkets: markets.filter((market) => market.yesPrice !== null || market.noPrice !== null).length,
    totalVolume: volumes.length > 0 ? volumes.reduce((sum, value) => sum + value, 0) : null,
  };
}

export async function getPolymarketSnapshot(): Promise<PolymarketSnapshot> {
  const generatedAt = new Date().toISOString();
  const config = readConfig();

  if (!config) {
    return {
      generatedAt,
      status: "disabled",
      message: DISABLED_MESSAGE,
      markets: [],
      summary: buildSummary([]),
    };
  }

  try {
    const { stdout } = await runCli(config);
    const payload = parsePayload(stdout);
    const markets = extractMarketRecords(payload)
      .map((entry, index) => normalizeMarket(entry, index))
      .filter((entry): entry is PolymarketMarket => Boolean(entry))
      .sort((left, right) => (right.volume ?? 0) - (left.volume ?? 0))
      .slice(0, config.limit);

    return {
      generatedAt,
      status: "ready",
      message: `Loaded ${markets.length} markets from the configured Polymarket CLI.`,
      markets,
      summary: buildSummary(markets),
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown Polymarket CLI error.";

    return {
      generatedAt,
      status: "error",
      message,
      markets: [],
      summary: buildSummary([]),
    };
  }
}

function tokenize(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((token) => token.length >= 3);
}

function extractStoryKeywords(story: NewsStory) {
  return new Set([
    ...tokenize(story.title),
    ...tokenize(story.description),
    ...story.signals.map((signal) => signal.toLowerCase()),
    ...story.categories,
    story.regionLabel.toLowerCase(),
  ]);
}

function extractMarketKeywords(market: PolymarketMarket) {
  return new Set([
    ...tokenize(market.question),
    ...(market.slug ? tokenize(market.slug.replace(/-/g, " ")) : []),
    ...market.outcomes.map((outcome) => outcome.label.toLowerCase()),
  ]);
}

function scoreStoryMarketMatch(story: NewsStory, market: PolymarketMarket) {
  const storyKeywords = extractStoryKeywords(story);
  const marketKeywords = extractMarketKeywords(market);

  let score = 0;

  storyKeywords.forEach((keyword) => {
    if (marketKeywords.has(keyword)) {
      score += keyword.length >= 6 ? 3 : 2;
    }
  });

  if (story.categories.includes("economics")) {
    if (market.question.toLowerCase().includes("fed") || market.question.toLowerCase().includes("bitcoin")) {
      score += 2;
    }
  }

  if (story.categories.includes("geopolitics")) {
    if (
      market.question.toLowerCase().includes("ukraine") ||
      market.question.toLowerCase().includes("ceasefire") ||
      market.question.toLowerCase().includes("war")
    ) {
      score += 2;
    }
  }

  if (story.categories.includes("politics")) {
    if (
      market.question.toLowerCase().includes("election") ||
      market.question.toLowerCase().includes("vote") ||
      market.question.toLowerCase().includes("president")
    ) {
      score += 2;
    }
  }

  return score;
}

export function matchMarketsToStories(
  stories: NewsStory[],
  markets: PolymarketMarket[],
  limitPerStory = 2,
): StoryMarketMatch[] {
  return stories.map((story) => {
    const matches = markets
      .map((market) => ({
        market,
        score: scoreStoryMarketMatch(story, market),
      }))
      .filter((entry) => entry.score > 0)
      .sort((left, right) => {
        if (right.score !== left.score) {
          return right.score - left.score;
        }

        return (right.market.volume ?? 0) - (left.market.volume ?? 0);
      })
      .slice(0, limitPerStory)
      .map((entry) => entry.market);

    return {
      storyId: story.id,
      markets: matches,
    };
  });
}
