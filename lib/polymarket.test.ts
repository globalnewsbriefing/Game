import test from "node:test";
import assert from "node:assert/strict";
import type { NewsStory } from "./news.ts";
import {
  buildAiTrades,
  buildAccuracyProfile,
  buildKalshiExecutionPlan,
  buildSummary,
  extractMarketRecords,
  getMarketsByAccuracyBucket,
  matchMarketsToStories,
  normalizeMarket,
  normalizeProbability,
  normalizeStatus,
  parsePayload,
} from "./polymarket.ts";

test("parsePayload parses a JSON array payload", () => {
  const payload = parsePayload('[{"question":"Will BTC rise?","volume":42}]');
  const records = extractMarketRecords(payload);

  assert.equal(records.length, 1);
  assert.equal(records[0]?.question, "Will BTC rise?");
});

test("parsePayload parses newline-delimited JSON payload", () => {
  const payload = parsePayload('{"question":"First market"}\n{"question":"Second market"}');
  const records = extractMarketRecords(payload);

  assert.equal(records.length, 2);
  assert.equal(records[1]?.question, "Second market");
});

test("extractMarketRecords reads nested markets arrays", () => {
  const payload = {
    data: {
      markets: [{ question: "Nested market", volume: 123 }],
    },
  };

  const records = extractMarketRecords(payload);

  assert.equal(records.length, 1);
  assert.equal(records[0]?.volume, 123);
});

test("normalizeProbability handles percentages and clamps values", () => {
  assert.equal(normalizeProbability(62), 0.62);
  assert.equal(normalizeProbability(0.27), 0.27);
  assert.equal(normalizeProbability(500), 1);
  assert.equal(normalizeProbability(-2), 0);
  assert.equal(normalizeProbability(null), null);
});

test("normalizeStatus reads status strings and booleans", () => {
  assert.equal(normalizeStatus({ status: "active" }), "open");
  assert.equal(normalizeStatus({ state: "settled" }), "resolved");
  assert.equal(normalizeStatus({ isClosed: true }), "closed");
  assert.equal(normalizeStatus({ isActive: false }), "closed");
  assert.equal(normalizeStatus({}), "unknown");
});

test("normalizeMarket maps alternate field names and outcome-derived prices", () => {
  const market = normalizeMarket(
    {
      marketId: "market-1",
      title: "Will the Fed cut rates by June 2026?",
      link: "https://example.com/fed",
      marketStatus: "live",
      symbol: "FEDJUN26",
      volumeNum: "2840000",
      liquidityNum: 615000,
      closeTime: "2026-06-30T20:00:00.000Z",
      leaderboard: [
        {
          name: "MacroMike",
          platform: "Polymarket",
          accuracy: 0.68,
          roi: 24,
          stance: "yes",
          confidence: 0.74,
        },
      ],
      kalshiLeaderboard: [
        {
          name: "KalshiMacro",
          platform: "Kalshi",
          accuracy: 0.71,
          roi: 18,
          stance: "yes",
          confidence: 0.76,
        },
      ],
      kalshi: {
        marketTitle: "Fed June 2026 rate-cut contract",
        yesPrice: 0.67,
        noPrice: 0.33,
      },
      outcome_prices: {
        Yes: "62",
        No: 38,
      },
    },
    0,
  );

  assert.ok(market);
  assert.equal(market.id, "market-1");
  assert.equal(market.status, "open");
  assert.equal(market.yesPrice, 0.62);
  assert.equal(market.noPrice, 0.38);
  assert.equal(market.volume, 2_840_000);
  assert.equal(market.liquidity, 615_000);
  assert.equal(market.endDate, "2026-06-30T20:00:00.000Z");
  assert.equal(market.token, "FEDJUN26");
  assert.equal(market.leaderboards.polymarket.length, 1);
  assert.equal(market.leaderboards.kalshi.length, 1);
  assert.equal(market.leaderboards.polymarket[0]?.name, "MacroMike");
  assert.equal(market.kalshi?.yesPrice, 0.67);
  assert.equal(market.kalshiTrade.action, "buy_yes");
  assert.equal(market.kalshiTrade.entryPrice, 0.67);
  assert.deepEqual(market.outcomes, [
    { label: "Yes", price: 0.62 },
    { label: "No", price: 0.38 },
  ]);
});

test("buildKalshiExecutionPlan recommends waiting when venue and leaderboard consensus is weak", () => {
  const prompt = buildKalshiExecutionPlan(
    "Will a compromise budget pass this month?",
    0.51,
    {
      polymarket: [
        { name: "Alpha", platform: "Polymarket", winRate: 0.59, roi: 8, position: "yes", confidence: 0.54 },
      ],
      kalshi: [
        { name: "Beta", platform: "Kalshi", winRate: 0.57, roi: 6, position: "no", confidence: 0.52 },
      ],
    },
    {
      marketTitle: "Kalshi budget contract",
      yesPrice: 0.52,
      noPrice: 0.48,
      spread: 0.01,
    },
  );

  assert.equal(prompt.action, "wait");
  assert.equal(prompt.confidence, "low");
});

test("buildSummary aggregates market stats", () => {
  const summary = buildSummary([
    {
      id: "one",
      question: "Open market",
      slug: null,
      url: null,
      status: "open",
      yesPrice: 0.6,
      noPrice: 0.4,
      volume: 10,
      liquidity: 3,
      endDate: null,
      outcomes: [],
      token: "OPEN1",
      leaderboards: { polymarket: [], kalshi: [] },
      kalshi: null,
      kalshiTrade: {
        action: "wait",
        title: "Wait",
        rationale: "No edge.",
        confidence: "low",
        marketTitle: "Kalshi open market",
        entryPrice: null,
        alternatePrice: null,
        edgeVsPolymarket: null,
        recommendedBudgetShare: 0,
      },
    },
    {
      id: "two",
      question: "Closed market",
      slug: null,
      url: null,
      status: "closed",
      yesPrice: null,
      noPrice: null,
      volume: 5,
      liquidity: 2,
      endDate: null,
      outcomes: [],
      token: "CLOSE2",
      leaderboards: { polymarket: [], kalshi: [] },
      kalshi: null,
      kalshiTrade: {
        action: "wait",
        title: "Wait",
        rationale: "No edge.",
        confidence: "low",
        marketTitle: "Kalshi closed market",
        entryPrice: null,
        alternatePrice: null,
        edgeVsPolymarket: null,
        recommendedBudgetShare: 0,
      },
    },
  ]);

  assert.deepEqual(summary, {
    totalMarkets: 2,
    openMarkets: 1,
    pricedMarkets: 1,
    totalVolume: 15,
  });
});

test("buildAiTrades allocates budget to highest-confidence prompts", () => {
  const trades = buildAiTrades(
    [
      {
        id: "yes-high",
        question: "Will Bitcoin make a new high?",
        slug: null,
        url: null,
        status: "open",
        yesPrice: 0.58,
        noPrice: 0.42,
        volume: 100,
        liquidity: 50,
        endDate: null,
        outcomes: [],
        token: "BTC",
        leaderboards: { polymarket: [], kalshi: [] },
        kalshi: null,
        kalshiTrade: {
          action: "buy_yes",
          title: "Buy YES",
          rationale: "Edge exists.",
          confidence: "high",
          marketTitle: "Kalshi BTC",
          entryPrice: 0.61,
          alternatePrice: 0.39,
          edgeVsPolymarket: 0.03,
          recommendedBudgetShare: 0.6,
        },
      },
      {
        id: "no-medium",
        question: "Will Brent go above 100?",
        slug: null,
        url: null,
        status: "open",
        yesPrice: 0.31,
        noPrice: 0.69,
        volume: 100,
        liquidity: 50,
        endDate: null,
        outcomes: [],
        token: "OIL",
        leaderboards: { polymarket: [], kalshi: [] },
        kalshi: null,
        kalshiTrade: {
          action: "buy_no",
          title: "Buy NO",
          rationale: "Some edge exists.",
          confidence: "medium",
          marketTitle: "Kalshi OIL",
          entryPrice: 0.69,
          alternatePrice: 0.31,
          edgeVsPolymarket: -0.04,
          recommendedBudgetShare: 0.4,
        },
      },
      {
        id: "wait",
        question: "Balanced market",
        slug: null,
        url: null,
        status: "open",
        yesPrice: 0.5,
        noPrice: 0.5,
        volume: 100,
        liquidity: 50,
        endDate: null,
        outcomes: [],
        token: "WAIT",
        leaderboards: { polymarket: [], kalshi: [] },
        kalshi: null,
        kalshiTrade: {
          action: "wait",
          title: "Wait",
          rationale: "No edge.",
          confidence: "low",
          marketTitle: "Kalshi WAIT",
          entryPrice: null,
          alternatePrice: null,
          edgeVsPolymarket: null,
          recommendedBudgetShare: 0,
        },
      },
    ],
    100,
  );

  assert.equal(trades.length, 2);
  assert.equal(trades[0]?.marketId, "yes-high");
  assert.equal(trades[0]?.amount, 60);
  assert.equal(trades[0]?.confidence, "high");
  assert.equal(trades[1]?.marketId, "no-medium");
  assert.equal(trades[1]?.amount, 40);
  assert.equal(trades[1]?.confidence, "medium");
});

test("accuracy profile uses prices and both leaderboards", () => {
  const highBucket = buildAccuracyProfile({
    id: "high",
    question: "High accuracy market",
    slug: null,
    url: null,
    status: "open",
    yesPrice: 0.3,
    noPrice: 0.7,
    volume: 100,
    liquidity: 50,
    endDate: null,
    outcomes: [],
    token: "HIGH",
    leaderboards: {
      polymarket: [
        { name: "PolyOne", platform: "Polymarket leaderboard", winRate: 0.7, roi: 10, position: "no", confidence: 0.8 },
      ],
      kalshi: [
        { name: "KalshiOne", platform: "Kalshi leaderboard", winRate: 0.72, roi: 11, position: "no", confidence: 0.78 },
      ],
    },
    kalshi: {
      marketTitle: "High market",
      yesPrice: 0.28,
      noPrice: 0.72,
      spread: -0.02,
    },
    kalshiTrade: {
      action: "buy_no",
      title: "Buy NO on Kalshi",
      rationale: "Strong consensus.",
      confidence: "high",
      marketTitle: "High market",
      entryPrice: 0.72,
      alternatePrice: 0.28,
      edgeVsPolymarket: -0.02,
      recommendedBudgetShare: 0.7,
    },
  });

  const lowBucket = buildAccuracyProfile({
    id: "low",
    question: "Low accuracy market",
    slug: null,
    url: null,
    status: "open",
    yesPrice: 0.49,
    noPrice: 0.51,
    volume: 100,
    liquidity: 50,
    endDate: null,
    outcomes: [],
    token: "LOW",
    leaderboards: {
      polymarket: [
        { name: "PolyTwo", platform: "Polymarket leaderboard", winRate: 0.34, roi: -3, position: "yes", confidence: 0.22 },
      ],
      kalshi: [
        { name: "KalshiTwo", platform: "Kalshi leaderboard", winRate: 0.36, roi: -2, position: "no", confidence: 0.24 },
      ],
    },
    kalshi: {
      marketTitle: "Low market",
      yesPrice: 0.79,
      noPrice: 0.21,
      spread: 0.3,
    },
    kalshiTrade: {
      action: "wait",
      title: "Wait on Kalshi",
      rationale: "Weak setup.",
      confidence: "low",
      marketTitle: "Low market",
      entryPrice: null,
      alternatePrice: null,
      edgeVsPolymarket: 0.3,
      recommendedBudgetShare: 0,
    },
  });

  assert.equal(highBucket.band, "high");
  assert.ok(lowBucket.score < highBucket.score);
  assert.notEqual(lowBucket.band, "high");
});

test("getMarketsByAccuracyBucket returns matching markets", () => {
  const markets = [
    {
      id: "high",
      question: "High market",
      slug: null,
      url: null,
      status: "open",
      yesPrice: 0.2,
      noPrice: 0.8,
      volume: 100,
      liquidity: 50,
      endDate: null,
      outcomes: [],
      token: "HIGH",
      leaderboards: {
        polymarket: [
          { name: "PolyHigh", platform: "Polymarket leaderboard", winRate: 0.72, roi: 15, position: "no", confidence: 0.79 },
        ],
        kalshi: [
          { name: "KalshiHigh", platform: "Kalshi leaderboard", winRate: 0.71, roi: 14, position: "no", confidence: 0.77 },
        ],
      },
      kalshi: { marketTitle: "High", yesPrice: 0.22, noPrice: 0.78, spread: 0.02 },
      kalshiTrade: {
        action: "buy_no",
        title: "Buy NO on Kalshi",
        rationale: "Strong setup",
        confidence: "high",
        marketTitle: "High",
        entryPrice: 0.78,
        alternatePrice: 0.22,
        edgeVsPolymarket: 0.02,
        recommendedBudgetShare: 0.7,
      },
    },
    {
      id: "low",
      question: "Low market",
      slug: null,
      url: null,
      status: "open",
      yesPrice: 0.5,
      noPrice: 0.5,
      volume: 100,
      liquidity: 50,
      endDate: null,
      outcomes: [],
      token: "LOW",
      leaderboards: {
        polymarket: [
          { name: "PolyLow", platform: "Polymarket leaderboard", winRate: 0.5, roi: 0, position: "yes", confidence: 0.4 },
        ],
        kalshi: [
          { name: "KalshiLow", platform: "Kalshi leaderboard", winRate: 0.51, roi: 1, position: "no", confidence: 0.42 },
        ],
      },
      kalshi: { marketTitle: "Low", yesPrice: 0.63, noPrice: 0.37, spread: 0.13 },
      kalshiTrade: {
        action: "wait",
        title: "Wait on Kalshi",
        rationale: "Weak setup",
        confidence: "low",
        marketTitle: "Low",
        entryPrice: null,
        alternatePrice: null,
        edgeVsPolymarket: 0.13,
        recommendedBudgetShare: 0,
      },
    },
  ];

  const high = getMarketsByAccuracyBucket(markets, "high");
  const low = getMarketsByAccuracyBucket(markets, "low");

  assert.equal(high.length, 1);
  assert.equal(high[0]?.market.id, "high");
  assert.equal(low.length, 1);
  assert.equal(low[0]?.market.id, "low");
});

test("matchMarketsToStories returns the most relevant markets per story", () => {
  const stories: NewsStory[] = [
    {
      id: "story-fed",
      title: "Fed signals rate cut as inflation cools",
      description: "Central bank officials hint at an earlier policy shift.",
      whyItMatters: "Markets react to a possible rate cut.",
      source: "Example",
      link: "https://example.com/fed-story",
      publishedAt: "2026-04-01T00:00:00.000Z",
      categories: ["economics"],
      regionLabel: "North America",
      relevanceScore: 88,
      signals: ["fed", "inflation", "central bank"],
    },
    {
      id: "story-war",
      title: "Ukraine ceasefire talks resume after summit",
      description: "Diplomats push for a new ceasefire proposal.",
      whyItMatters: "A truce could shift conflict risk.",
      source: "Example",
      link: "https://example.com/ukraine-story",
      publishedAt: "2026-04-01T00:00:00.000Z",
      categories: ["geopolitics"],
      regionLabel: "Europe",
      relevanceScore: 91,
      signals: ["ukraine", "ceasefire", "summit"],
    },
  ];

  const matches = matchMarketsToStories(stories, [
    {
      id: "fed-market",
      question: "Will the Fed cut rates by June 2026?",
      slug: "fed-cut-rates-june-2026",
      url: null,
      status: "open",
      yesPrice: 0.62,
      noPrice: 0.38,
      volume: 100,
      liquidity: 25,
      endDate: null,
      outcomes: [],
      token: "FED",
      leaderboards: { polymarket: [], kalshi: [] },
      kalshi: null,
      kalshiTrade: {
        action: "wait",
        title: "Wait on Kalshi",
        rationale: "No edge.",
        confidence: "low",
        marketTitle: "FED",
        entryPrice: null,
        alternatePrice: null,
        edgeVsPolymarket: null,
        recommendedBudgetShare: 0,
      },
    },
    {
      id: "war-market",
      question: "Will Russia and Ukraine announce a ceasefire this quarter?",
      slug: "ukraine-ceasefire-quarter",
      url: null,
      status: "open",
      yesPrice: 0.27,
      noPrice: 0.73,
      volume: 200,
      liquidity: 50,
      endDate: null,
      outcomes: [],
      token: "WAR",
      leaderboards: { polymarket: [], kalshi: [] },
      kalshi: null,
      kalshiTrade: {
        action: "wait",
        title: "Wait on Kalshi",
        rationale: "No edge.",
        confidence: "low",
        marketTitle: "WAR",
        entryPrice: null,
        alternatePrice: null,
        edgeVsPolymarket: null,
        recommendedBudgetShare: 0,
      },
    },
    {
      id: "other-market",
      question: "Will Bitcoin make a new all-time high before July 2026?",
      slug: "bitcoin-ath",
      url: null,
      status: "open",
      yesPrice: 0.58,
      noPrice: 0.42,
      volume: 300,
      liquidity: 60,
      endDate: null,
      outcomes: [],
      token: "BTC",
      leaderboards: { polymarket: [], kalshi: [] },
      kalshi: null,
      kalshiTrade: {
        action: "wait",
        title: "Wait on Kalshi",
        rationale: "No edge.",
        confidence: "low",
        marketTitle: "BTC",
        entryPrice: null,
        alternatePrice: null,
        edgeVsPolymarket: null,
        recommendedBudgetShare: 0,
      },
    },
  ]);

  assert.equal(matches.length, 2);
  assert.equal(matches[0]?.storyId, "story-fed");
  assert.equal(matches[0]?.markets[0]?.id, "fed-market");
  assert.equal(matches[1]?.storyId, "story-war");
  assert.equal(matches[1]?.markets[0]?.id, "war-market");
});
