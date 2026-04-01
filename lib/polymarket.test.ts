import test from "node:test";
import assert from "node:assert/strict";
import type { NewsStory } from "./news.ts";
import {
  buildSummary,
  extractMarketRecords,
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
      volumeNum: "2840000",
      liquidityNum: 615000,
      closeTime: "2026-06-30T20:00:00.000Z",
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
  assert.deepEqual(market.outcomes, [
    { label: "Yes", price: 0.62 },
    { label: "No", price: 0.38 },
  ]);
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
    },
  ]);

  assert.deepEqual(summary, {
    totalMarkets: 2,
    openMarkets: 1,
    pricedMarkets: 1,
    totalVolume: 15,
  });
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
    },
  ]);

  assert.equal(matches.length, 2);
  assert.equal(matches[0]?.storyId, "story-fed");
  assert.equal(matches[0]?.markets[0]?.id, "fed-market");
  assert.equal(matches[1]?.storyId, "story-war");
  assert.equal(matches[1]?.markets[0]?.id, "war-market");
});
