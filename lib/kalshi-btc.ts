export type SignalSide = "up" | "down" | "pass";
export type SignalStrength = "high" | "medium" | "low" | "none";

type KalshiMarket = {
  ticker: string;
  event_ticker: string;
  title?: string;
  yes_sub_title?: string;
  no_sub_title?: string;
  open_time: string;
  close_time: string;
  expected_expiration_time?: string;
  floor_strike?: number;
  yes_bid_dollars: string;
  yes_ask_dollars: string;
  no_bid_dollars: string;
  no_ask_dollars: string;
  last_price_dollars: string;
  volume_fp: string;
  open_interest_fp: string;
  rules_primary?: string;
  rules_secondary?: string;
};

type CoinbaseSpotResponse = {
  data: {
    amount: string;
    base: string;
    currency: string;
  };
};

type Candle = [time: number, low: number, high: number, open: number, close: number, volume: number];

export type BtcSignal = {
  generatedAt: string;
  market: {
    ticker: string;
    eventTicker: string;
    title: string;
    targetPrice: number;
    openTime: string;
    closeTime: string;
    secondsToClose: number;
    rulesPrimary: string;
    rulesSecondary: string;
  };
  spot: {
    price: number;
    source: string;
  };
  orderbook: {
    yesBidCents: number;
    yesAskCents: number;
    noBidCents: number;
    noAskCents: number;
    lastCents: number;
    spreadCents: number;
    volume: number;
    openInterest: number;
  };
  model: {
    fairUpProbability: number;
    fairUpCents: number;
    fairDownCents: number;
    yesEdgeCents: number;
    noEdgeCents: number;
    distanceFromTarget: number;
    oneMinuteMove: number;
    fiveMinuteMove: number;
    estimatedMoveToClose: number;
  };
  recommendation: {
    side: SignalSide;
    label: string;
    strength: SignalStrength;
    edgeCents: number;
    maxEntryCents: number | null;
    stakeGuidance: string;
    reasons: string[];
    warnings: string[];
  };
};

const KALSHI_MARKETS_URL =
  "https://external-api.kalshi.com/trade-api/v2/markets?series_ticker=KXBTC15M&status=open&limit=12";
const COINBASE_SPOT_URL = "https://api.coinbase.com/v2/prices/BTC-USD/spot";
const COINBASE_CANDLES_URL = "https://api.exchange.coinbase.com/products/BTC-USD/candles?granularity=60&limit=15";
const EDGE_THRESHOLD_CENTS = 5;
const STALE_MARKET_SECONDS = 20;

function dollarsToCents(value: string | number | undefined) {
  const parsed = typeof value === "number" ? value : Number(value ?? 0);
  return Math.round(parsed * 1000) / 10;
}

function parseFixedPoint(value: string | undefined) {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function erf(value: number) {
  const sign = value >= 0 ? 1 : -1;
  const x = Math.abs(value);
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;
  const t = 1 / (1 + p * x);
  const y = 1 - (((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t * Math.exp(-x * x));

  return sign * y;
}

function normalCdf(value: number) {
  return 0.5 * (1 + erf(value / Math.SQRT2));
}

function standardDeviation(values: number[]) {
  if (values.length < 2) {
    return 0;
  }

  const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
  const variance =
    values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / (values.length - 1);

  return Math.sqrt(variance);
}

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url, {
    headers: {
      accept: "application/json",
      "user-agent": "KalshiBtcSignal/1.0",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Request failed: ${response.status} ${url}`);
  }

  return response.json() as Promise<T>;
}

function selectCurrentMarket(markets: KalshiMarket[]) {
  const now = Date.now();
  const openMarkets = markets
    .filter((market) => new Date(market.close_time).getTime() > now)
    .sort((left, right) => new Date(left.close_time).getTime() - new Date(right.close_time).getTime());

  return openMarkets[0] ?? markets[0];
}

function buildReasons(signal: {
  side: SignalSide;
  distanceFromTarget: number;
  yesEdgeCents: number;
  noEdgeCents: number;
  oneMinuteMove: number;
  fiveMinuteMove: number;
  fairUpProbability: number;
  secondsToClose: number;
}) {
  const reasons: string[] = [];
  const distanceLabel = `$${Math.abs(signal.distanceFromTarget).toFixed(2)}`;
  const targetPosition = signal.distanceFromTarget >= 0 ? "above" : "below";

  if (signal.side === "up") {
    reasons.push(
      `BTC is ${distanceLabel} ${targetPosition} the target with ${Math.round(signal.yesEdgeCents)}c estimated Up edge.`,
    );
  } else if (signal.side === "down") {
    reasons.push(
      `BTC is ${distanceLabel} ${targetPosition} the target, while Down shows ${Math.round(signal.noEdgeCents)}c estimated edge.`,
    );
  } else {
    reasons.push("No side clears the 5c edge filter after current market pricing.");
  }

  if (Math.abs(signal.fiveMinuteMove) > Math.abs(signal.oneMinuteMove)) {
    reasons.push(`Five-minute momentum is ${signal.fiveMinuteMove >= 0 ? "positive" : "negative"} at $${signal.fiveMinuteMove.toFixed(2)}.`);
  } else {
    reasons.push(`One-minute momentum is ${signal.oneMinuteMove >= 0 ? "positive" : "negative"} at $${signal.oneMinuteMove.toFixed(2)}.`);
  }

  reasons.push(`Model fair Up probability is ${(signal.fairUpProbability * 100).toFixed(1)}% with ${Math.floor(signal.secondsToClose / 60)}m ${signal.secondsToClose % 60}s left.`);

  return reasons;
}

function buildWarnings(secondsToClose: number, spreadCents: number, targetPrice: number | undefined) {
  const warnings = [
    "Coinbase spot is a proxy; Kalshi resolves from CF Benchmarks BRTI, so small differences can matter near the target.",
  ];

  if (!targetPrice) {
    warnings.push("Kalshi did not return a target price for this market.");
  }

  if (secondsToClose < STALE_MARKET_SECONDS) {
    warnings.push("Very close to the close; avoid new entries unless you already planned the trade.");
  }

  if (spreadCents > 8) {
    warnings.push("The spread is wide enough to make the signal less reliable.");
  }

  return warnings;
}

function buildRecommendation(input: {
  fairUpCents: number;
  yesAskCents: number;
  noAskCents: number;
  yesEdgeCents: number;
  noEdgeCents: number;
  distanceFromTarget: number;
  oneMinuteMove: number;
  fiveMinuteMove: number;
  fairUpProbability: number;
  secondsToClose: number;
  spreadCents: number;
  targetPrice: number | undefined;
}) {
  const eligible = input.secondsToClose >= STALE_MARKET_SECONDS && input.spreadCents <= 8;
  const bestEdgeCents = Math.max(input.yesEdgeCents, input.noEdgeCents);
  const side: SignalSide =
    eligible && bestEdgeCents >= EDGE_THRESHOLD_CENTS
      ? input.yesEdgeCents >= input.noEdgeCents
        ? "up"
        : "down"
      : "pass";
  const edgeCents = side === "up" ? input.yesEdgeCents : side === "down" ? input.noEdgeCents : bestEdgeCents;
  const strength: SignalStrength =
    side === "pass" ? "none" : edgeCents >= 12 ? "high" : edgeCents >= 8 ? "medium" : "low";
  const label = side === "up" ? "Bet Up" : side === "down" ? "Bet Down" : "Pass";
  const maxEntryCents =
    side === "up"
      ? Math.max(1, Math.floor(input.fairUpCents - EDGE_THRESHOLD_CENTS))
      : side === "down"
        ? Math.max(1, Math.floor(100 - input.fairUpCents - EDGE_THRESHOLD_CENTS))
        : null;
  const stakeGuidance =
    side === "pass"
      ? "No bet"
      : strength === "high"
        ? "Max 1% bankroll"
        : strength === "medium"
          ? "Max 0.5% bankroll"
          : "Tiny only: max 0.25% bankroll";

  return {
    side,
    label,
    strength,
    edgeCents: Math.round(edgeCents * 10) / 10,
    maxEntryCents,
    stakeGuidance,
    reasons: buildReasons({
      side,
      distanceFromTarget: input.distanceFromTarget,
      yesEdgeCents: input.yesEdgeCents,
      noEdgeCents: input.noEdgeCents,
      oneMinuteMove: input.oneMinuteMove,
      fiveMinuteMove: input.fiveMinuteMove,
      fairUpProbability: input.fairUpProbability,
      secondsToClose: input.secondsToClose,
    }),
    warnings: buildWarnings(input.secondsToClose, input.spreadCents, input.targetPrice),
  };
}

export async function getBtcSignal(): Promise<BtcSignal> {
  const [marketsResponse, spotResponse, rawCandles] = await Promise.all([
    fetchJson<{ markets: KalshiMarket[] }>(KALSHI_MARKETS_URL),
    fetchJson<CoinbaseSpotResponse>(COINBASE_SPOT_URL),
    fetchJson<Candle[]>(COINBASE_CANDLES_URL),
  ]);
  const market = selectCurrentMarket(marketsResponse.markets);

  if (!market) {
    throw new Error("No open Kalshi BTC 15-minute market is available.");
  }

  const spotPrice = Number(spotResponse.data.amount);
  const targetPrice = market.floor_strike;
  const secondsToClose = Math.max(0, Math.floor((new Date(market.close_time).getTime() - Date.now()) / 1000));
  const candles = rawCandles
    .slice()
    .sort((left, right) => left[0] - right[0])
    .filter((candle) => candle.every((value) => Number.isFinite(value)));
  const closes = candles.map((candle) => candle[4]);
  const minuteMoves = closes.slice(1).map((close, index) => close - closes[index]);
  const minuteVolatility = Math.max(12, standardDeviation(minuteMoves));
  const minutesToClose = Math.max(secondsToClose / 60, 0.5);
  const estimatedMoveToClose = Math.max(18, minuteVolatility * Math.sqrt(minutesToClose) * 1.15);
  const distanceFromTarget = targetPrice ? spotPrice - targetPrice : 0;
  const oneMinuteMove = closes.length >= 2 ? closes[closes.length - 1] - closes[closes.length - 2] : 0;
  const fiveMinuteMove = closes.length >= 6 ? closes[closes.length - 1] - closes[closes.length - 6] : oneMinuteMove;
  const momentumAdjustment = clamp(fiveMinuteMove / Math.max(minuteVolatility * Math.sqrt(5), 1), -1, 1) * 0.055;
  const fairUpProbability = clamp(
    normalCdf(distanceFromTarget / estimatedMoveToClose) + momentumAdjustment,
    0.04,
    0.96,
  );
  const fairUpCents = Math.round(fairUpProbability * 1000) / 10;
  const fairDownCents = Math.round((100 - fairUpCents) * 10) / 10;
  const yesBidCents = dollarsToCents(market.yes_bid_dollars);
  const yesAskCents = dollarsToCents(market.yes_ask_dollars);
  const noBidCents = dollarsToCents(market.no_bid_dollars);
  const noAskCents = dollarsToCents(market.no_ask_dollars);
  const spreadCents = Math.max(yesAskCents - yesBidCents, noAskCents - noBidCents);
  const yesEdgeCents = fairUpCents - yesAskCents;
  const noEdgeCents = fairDownCents - noAskCents;

  return {
    generatedAt: new Date().toISOString(),
    market: {
      ticker: market.ticker,
      eventTicker: market.event_ticker,
      title: market.title ?? "BTC 15 min",
      targetPrice: targetPrice ?? 0,
      openTime: market.open_time,
      closeTime: market.close_time,
      secondsToClose,
      rulesPrimary: market.rules_primary ?? "",
      rulesSecondary: market.rules_secondary ?? "",
    },
    spot: {
      price: spotPrice,
      source: "Coinbase BTC-USD spot",
    },
    orderbook: {
      yesBidCents,
      yesAskCents,
      noBidCents,
      noAskCents,
      lastCents: dollarsToCents(market.last_price_dollars),
      spreadCents: Math.round(spreadCents * 10) / 10,
      volume: parseFixedPoint(market.volume_fp),
      openInterest: parseFixedPoint(market.open_interest_fp),
    },
    model: {
      fairUpProbability,
      fairUpCents,
      fairDownCents,
      yesEdgeCents: Math.round(yesEdgeCents * 10) / 10,
      noEdgeCents: Math.round(noEdgeCents * 10) / 10,
      distanceFromTarget: Math.round(distanceFromTarget * 100) / 100,
      oneMinuteMove: Math.round(oneMinuteMove * 100) / 100,
      fiveMinuteMove: Math.round(fiveMinuteMove * 100) / 100,
      estimatedMoveToClose: Math.round(estimatedMoveToClose * 100) / 100,
    },
    recommendation: buildRecommendation({
      fairUpCents,
      yesAskCents,
      noAskCents,
      yesEdgeCents,
      noEdgeCents,
      distanceFromTarget,
      oneMinuteMove,
      fiveMinuteMove,
      fairUpProbability,
      secondsToClose,
      spreadCents,
      targetPrice,
    }),
  };
}
