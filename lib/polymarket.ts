import { createHash } from "node:crypto";
import { spawn } from "node:child_process";
import type { NewsStory } from "@/lib/news";

export type PolymarketOutcome = {
  label: string;
  price: number | null;
};

export type PolymarketMarketStatus = "open" | "closed" | "resolved" | "unknown";

export type TraderLeaderboardEntry = {
  name: string;
  platform: string;
  winRate: number | null;
  roi: number | null;
  position: "yes" | "no" | "neutral";
  confidence: number | null;
};

export type VenueLeaderboards = {
  polymarket: TraderLeaderboardEntry[];
  kalshi: TraderLeaderboardEntry[];
};

export type KalshiComparison = {
  yesPrice: number | null;
  noPrice: number | null;
  spread: number | null;
  marketTitle: string | null;
};

export type KalshiTradeInstruction = {
  action: "buy_yes" | "buy_no" | "wait";
  marketTitle: string;
  entryPrice: number | null;
  alternatePrice: number | null;
  edgeVsPolymarket: number | null;
  recommendedBudgetShare: number;
  title: string;
  rationale: string;
  confidence: "high" | "medium" | "low";
};

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
  token: string | null;
  leaderboards: VenueLeaderboards;
  kalshi: KalshiComparison | null;
  kalshiTrade: KalshiTradeInstruction;
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

export type AiTrade = {
  marketId: string;
  marketQuestion: string;
  token: string | null;
  side: "yes" | "no";
  amount: number;
  entryPrice: number;
  shares: number;
  confidence: KalshiTradeInstruction["confidence"];
  rationale: string;
};

export type TradeAccuracyBucket = "high" | "medium" | "low";

export type AccuracyScoredMarket = {
  market: PolymarketMarket;
  score: number;
  bucket: TradeAccuracyBucket;
  rationale: string;
};

export type AccuracyBand = "high" | "medium" | "low";

export type MarketAccuracyProfile = {
  marketId: string;
  marketQuestion: string;
  token: string | null;
  band: AccuracyBand;
  score: number;
  rationale: string;
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
const DEFAULT_MARKET_LIMIT = 12;
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

function readRecord(record: JsonRecord, keys: string[]) {
  for (const key of keys) {
    const value = record[key];

    if (isJsonRecord(value)) {
      return value;
    }
  }

  return null;
}

function readArray(record: JsonRecord, keys: string[]) {
  for (const key of keys) {
    const value = record[key];

    if (Array.isArray(value)) {
      return value;
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

function normalizePosition(value: string | null): TraderLeaderboardEntry["position"] {
  if (!value) {
    return "neutral";
  }

  const normalized = value.toLowerCase();

  if (["yes", "long", "buy_yes", "bullish"].includes(normalized)) {
    return "yes";
  }

  if (["no", "short", "buy_no", "bearish"].includes(normalized)) {
    return "no";
  }

  return "neutral";
}

function normalizeTrader(record: JsonRecord) {
  const name = readString(record, ["name", "username", "displayName", "trader"]);

  if (!name) {
    return null;
  }

  return {
    name,
    platform: readString(record, ["platform", "exchange", "venue"]) ?? "Polymarket",
    winRate: normalizeProbability(readNumber(record, ["winRate", "win_rate", "accuracy"])),
    roi: readNumber(record, ["roi", "return", "pnlPercent"]),
    position: normalizePosition(readString(record, ["position", "side", "stance"])),
    confidence: normalizeProbability(readNumber(record, ["confidence", "conviction"])),
  } satisfies TraderLeaderboardEntry;
}

function normalizeTraders(record: JsonRecord) {
  const source = readArray(record, ["traders", "leaderboard", "leaderboardTraders", "topTraders"]);

  if (!source) {
    return [];
  }

  return source
    .map((entry) => {
      if (isJsonRecord(entry)) {
        return normalizeTrader(entry);
      }

      return null;
    })
    .filter((entry): entry is TraderLeaderboardEntry => Boolean(entry));
}

function normalizeKalshi(record: JsonRecord): KalshiComparison | null {
  const source = readRecord(record, ["kalshi", "kalshiComparison", "comparisonKalshi"]);

  if (!source) {
    const yesPrice = normalizeProbability(readNumber(record, ["kalshiYesPrice", "kalshi_yes_price"]));
    const noPrice = normalizeProbability(readNumber(record, ["kalshiNoPrice", "kalshi_no_price"]));

    if (yesPrice === null && noPrice === null) {
      return null;
    }

    const spread = yesPrice !== null && readNumber(record, ["yesPrice", "bestAskYes", "lastYesPrice"]) !== null
      ? Number((yesPrice - normalizeProbability(readNumber(record, ["yesPrice", "bestAskYes", "lastYesPrice"]))!).toFixed(4))
      : null;

    return {
      yesPrice,
      noPrice,
      spread,
      marketTitle: readString(record, ["kalshiMarketTitle", "kalshi_title"]),
    };
  }

  const yesPrice = normalizeProbability(readNumber(source, ["yesPrice", "yes", "bestYesPrice"]));
  const noPrice = normalizeProbability(readNumber(source, ["noPrice", "no", "bestNoPrice"]));

  return {
    yesPrice,
    noPrice,
    spread:
      yesPrice !== null && readNumber(record, ["yesPrice", "bestAskYes", "lastYesPrice"]) !== null
        ? Number((yesPrice - normalizeProbability(readNumber(record, ["yesPrice", "bestAskYes", "lastYesPrice"]))!).toFixed(4))
        : null,
    marketTitle: readString(source, ["marketTitle", "title", "question"]),
  };
}

function summarizeTraderConsensus(traders: TraderLeaderboardEntry[]) {
  let yesVotes = 0;
  let noVotes = 0;
  let neutralVotes = 0;
  let cumulativeConfidence = 0;
  let confidenceSamples = 0;

  traders.forEach((trader) => {
    if (trader.position === "yes") {
      yesVotes += 1;
    } else if (trader.position === "no") {
      noVotes += 1;
    } else {
      neutralVotes += 1;
    }

    if (trader.confidence !== null) {
      cumulativeConfidence += trader.confidence;
      confidenceSamples += 1;
    }
  });

  return {
    yesVotes,
    noVotes,
    neutralVotes,
    averageConfidence:
      confidenceSamples > 0 ? cumulativeConfidence / confidenceSamples : null,
  };
}

function calculateAlignmentScore(
  yesPrice: number | null,
  traders: TraderLeaderboardEntry[],
  kalshi: KalshiComparison | null,
) {
  const consensus = summarizeTraderConsensus(traders);
  const marketLean =
    yesPrice === null ? "balanced" : yesPrice >= 0.55 ? "yes" : yesPrice <= 0.45 ? "no" : "balanced";

  const alignedVotes = traders.filter((trader) => {
    if (marketLean === "balanced") {
      return trader.position === "neutral";
    }

    return trader.position === marketLean;
  }).length;

  const traderAlignment = traders.length > 0 ? alignedVotes / traders.length : 0.5;
  const averageWinRate =
    traders.length > 0
      ? traders.reduce((sum, trader) => sum + (trader.winRate ?? 0.5), 0) / traders.length
      : 0.5;
  const averageConfidence = consensus.averageConfidence ?? 0.5;
  const venueSpread =
    yesPrice !== null && kalshi !== null && kalshi.yesPrice !== null
      ? Math.abs(yesPrice - kalshi.yesPrice)
      : 0.15;
  const venueAgreement = 1 - Math.min(1, venueSpread / 0.25);

  return {
    traderAlignment,
    averageWinRate,
    averageConfidence,
    venueAgreement,
  };
}

export function scoreMarketAccuracy(market: PolymarketMarket): AccuracyScoredMarket {
  const components = calculateAlignmentScore(market.yesPrice, market.traders, market.kalshi);
  const score = Math.round(
    (components.traderAlignment * 0.35 +
      components.averageWinRate * 0.25 +
      components.averageConfidence * 0.2 +
      components.venueAgreement * 0.2) *
      100,
  );

  const bucket: TradeAccuracyBucket = score >= 75 ? "high" : score >= 55 ? "medium" : "low";
  const rationale =
    bucket === "high"
      ? "Both venues and the strongest leaderboard traders are telling a similar story, so this setup looks comparatively reliable."
      : bucket === "medium"
        ? "The market has some support from venue pricing and trader consensus, but the signal is mixed enough to warrant caution."
        : "The two venues and the trader leaderboards are not aligned enough yet, so this market is less likely to be an accurate signal.";

  return {
    market,
    score,
    bucket,
    rationale,
  };
}

export function getMarketsByAccuracyBucket(
  markets: PolymarketMarket[],
  bucket: TradeAccuracyBucket,
): AccuracyScoredMarket[] {
  return markets
    .map((market) => scoreMarketAccuracy(market))
    .filter((entry) => entry.bucket === bucket)
    .sort((left, right) => {
      if (right.score !== left.score) {
        return right.score - left.score;
      }

      return (right.market.volume ?? 0) - (left.market.volume ?? 0);
    });
}

export function buildTradePrompt(
  question: string,
  yesPrice: number | null,
  traders: TraderLeaderboardEntry[],
  kalshi: KalshiComparison | null,
): TradePrompt {
  const consensus = summarizeTraderConsensus(traders);
  const yesVotes = consensus.yesVotes;
  const noVotes = consensus.noVotes;
  const marketLean =
    yesPrice === null ? "unknown" : yesPrice >= 0.55 ? "yes" : yesPrice <= 0.45 ? "no" : "balanced";
  const kalshiSpread = kalshi?.spread ?? null;
  const alignedWithYes = yesVotes > noVotes;
  const alignedWithNo = noVotes > yesVotes;

  if (alignedWithYes && marketLean === "yes" && (kalshiSpread === null || kalshiSpread >= 0.03)) {
    return {
      action: "buy_yes",
      title: `Buy YES on ${question}`,
      rationale:
        kalshiSpread !== null
          ? `Reliable traders lean YES and Polymarket is pricing below Kalshi by ${Math.round(Math.abs(kalshiSpread) * 100)} points, suggesting better upside on Polymarket.`
          : "Reliable traders lean YES and Polymarket is still pricing the market at a favorable entry versus trader consensus.",
      confidence:
        yesVotes >= 2 && (consensus.averageConfidence ?? 0) >= 0.6 ? "high" : "medium",
    };
  }

  if (alignedWithNo && marketLean === "no" && (kalshiSpread === null || kalshiSpread <= -0.03)) {
    return {
      action: "buy_no",
      title: `Buy NO on ${question}`,
      rationale:
        kalshiSpread !== null
          ? `Leaderboard traders lean NO and Polymarket YES is richer than Kalshi by ${Math.round(Math.abs(kalshiSpread) * 100)} points, which strengthens the NO case on Polymarket.`
          : "Leaderboard traders lean NO and the current Polymarket pricing still leaves room for a contrarian NO entry.",
      confidence:
        noVotes >= 2 && (consensus.averageConfidence ?? 0) >= 0.6 ? "high" : "medium",
    };
  }

  return {
    action: "wait",
    title: `Wait for a cleaner entry on ${question}`,
    rationale:
      "Trader consensus and venue pricing are not giving a strong enough edge yet, so the best prompt is to monitor liquidity, spreads, and confirmation from Kalshi before putting money in.",
    confidence: "low",
  };
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
  const traders = normalizeTraders(record);
  const token = readString(record, ["token", "ticker", "symbol", "asset"]);
  const yesPrice =
    normalizeProbability(readNumber(record, ["yesPrice", "bestAskYes", "lastYesPrice"])) ??
    selectOutcomePrice(outcomes, "yes");
  const noPrice =
    normalizeProbability(readNumber(record, ["noPrice", "bestAskNo", "lastNoPrice"])) ??
    selectOutcomePrice(outcomes, "no");
  const kalshi = normalizeKalshi(record);

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
    token,
    traders,
    kalshi,
    tradePrompt: buildTradePrompt(question, yesPrice, traders, kalshi),
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

function confidenceWeight(confidence: TradePrompt["confidence"]) {
  if (confidence === "high") {
    return 3;
  }

  if (confidence === "medium") {
    return 2;
  }

  return 1;
}

export function buildAiTrades(markets: PolymarketMarket[], budget = 100): AiTrade[] {
  const tradable = markets
    .filter((market) => market.tradePrompt.action !== "wait")
    .map((market) => ({
      market,
      side: market.tradePrompt.action === "buy_yes" ? "yes" : "no",
      price: market.tradePrompt.action === "buy_yes" ? market.yesPrice : market.noPrice,
      weight: confidenceWeight(market.tradePrompt.confidence),
    }))
    .filter(
      (
        entry,
      ): entry is {
        market: PolymarketMarket;
        side: "yes" | "no";
        price: number;
        weight: number;
      } => entry.price !== null && entry.price > 0,
    )
    .sort((left, right) => {
      if (right.weight !== left.weight) {
        return right.weight - left.weight;
      }

      return (right.market.volume ?? 0) - (left.market.volume ?? 0);
    });

  if (tradable.length === 0 || budget <= 0) {
    return [];
  }

  const totalWeight = tradable.reduce((sum, entry) => sum + entry.weight, 0);
  let allocated = 0;

  return tradable.map((entry, index) => {
    const isLast = index === tradable.length - 1;
    const rawAmount = isLast
      ? budget - allocated
      : Math.max(0, Math.round((budget * entry.weight) / totalWeight));
    const amount = Math.max(0, Math.min(budget - allocated, rawAmount));
    allocated += amount;

    return {
      marketId: entry.market.id,
      marketQuestion: entry.market.question,
      token: entry.market.token,
      side: entry.side,
      amount,
      entryPrice: entry.price,
      shares: amount / entry.price,
      confidence: entry.market.tradePrompt.confidence,
      rationale: entry.market.tradePrompt.rationale,
    } satisfies AiTrade;
  });
}

function average(values: number[]) {
  if (values.length === 0) {
    return null;
  }

  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function buildAccuracyRationale(
  market: PolymarketMarket,
  score: number,
  venueAlignment: number,
  traderConfidence: number,
  traderAgreement: number,
) {
  const reasons = [
    `Pricing alignment contributes ${Math.round(venueAlignment * 100)} points.`,
    `Trader confidence contributes ${Math.round(traderConfidence * 100)} points.`,
    `Leaderboard agreement contributes ${Math.round(traderAgreement * 100)} points.`,
  ];

  if (market.kalshi?.marketTitle) {
    reasons.unshift(`Kalshi comparison uses ${market.kalshi.marketTitle}.`);
  }

  return `Accuracy score ${score}/100. ${reasons.join(" ")}`;
}

export function buildAccuracyProfile(market: PolymarketMarket): MarketAccuracyProfile {
  const kalshiYesPrice = market.kalshi?.yesPrice ?? null;
  const kalshiAlignment =
    kalshiYesPrice !== null && market.yesPrice !== null
      ? 1 - Math.min(1, Math.abs(kalshiYesPrice - market.yesPrice))
      : 0.45;
  const traderConfidences = market.traders
    .map((trader) => trader.confidence)
    .filter((value): value is number => value !== null);
  const traderWinRates = market.traders
    .map((trader) => trader.winRate)
    .filter((value): value is number => value !== null);
  const confidenceSignal = average([...traderConfidences, ...traderWinRates]) ?? 0.45;
  const yesVotes = market.traders.filter((trader) => trader.position === "yes").length;
  const noVotes = market.traders.filter((trader) => trader.position === "no").length;
  const decisiveVotes = yesVotes + noVotes;
  const agreementSignal =
    decisiveVotes > 0 ? Math.max(yesVotes, noVotes) / decisiveVotes : 0.45;
  const score = Math.round(
    Math.min(
      100,
      Math.max(
        0,
        kalshiAlignment * 35 + confidenceSignal * 35 + agreementSignal * 20 + (market.volume ? 10 : 0),
      ),
    ),
  );

  return {
    marketId: market.id,
    marketQuestion: market.question,
    token: market.token,
    band: score >= 75 ? "high" : score >= 55 ? "medium" : "low",
    score,
    rationale: buildAccuracyRationale(
      market,
      score,
      kalshiAlignment,
      confidenceSignal,
      agreementSignal,
    ),
  };
}

export function groupMarketsByAccuracy(markets: PolymarketMarket[]) {
  const profiles = markets.map((market) => ({
    market,
    profile: buildAccuracyProfile(market),
  }));

  return {
    high: profiles.filter((entry) => entry.profile.band === "high"),
    medium: profiles.filter((entry) => entry.profile.band === "medium"),
    low: profiles.filter((entry) => entry.profile.band === "low"),
  };
}
