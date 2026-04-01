#!/usr/bin/env node

const markets = [
  {
    id: "fed-cut-june",
    question: "Will the Fed cut rates by June 2026?",
    slug: "fed-cut-june-2026",
    url: "https://polymarket.com/event/fed-cut-june-2026",
    token: "FEDCUT",
    status: "open",
    yesPrice: 0.62,
    noPrice: 0.38,
    volume: 2840000,
    liquidity: 615000,
    endDate: "2026-06-30T20:00:00.000Z",
    traders: [
      {
        name: "MacroMaven",
        platform: "Polymarket leaderboard",
        winRate: 0.67,
        roi: 18.4,
        position: "yes",
        confidence: 0.74
      },
      {
        name: "RateWatcher",
        platform: "Polymarket leaderboard",
        winRate: 0.63,
        roi: 12.1,
        position: "yes",
        confidence: 0.69
      },
      {
        name: "CPIBear",
        platform: "Polymarket leaderboard",
        winRate: 0.58,
        roi: 7.2,
        position: "no",
        confidence: 0.55
      }
    ],
    kalshi: {
      marketTitle: "Fed cut by June 2026",
      yesPrice: 0.66,
      noPrice: 0.34
    },
    outcomes: [
      { label: "Yes", price: 0.62 },
      { label: "No", price: 0.38 }
    ]
  },
  {
    id: "ukraine-ceasefire",
    question: "Will Russia and Ukraine announce a ceasefire this quarter?",
    slug: "ukraine-ceasefire-q2-2026",
    url: "https://polymarket.com/event/ukraine-ceasefire-q2-2026",
    token: "CEASE",
    status: "open",
    yesPrice: 0.27,
    noPrice: 0.73,
    volume: 1715000,
    liquidity: 410000,
    endDate: "2026-06-30T23:59:00.000Z",
    traders: [
      {
        name: "ConflictDesk",
        platform: "Polymarket leaderboard",
        winRate: 0.71,
        roi: 23.9,
        position: "no",
        confidence: 0.81
      },
      {
        name: "GeoSignal",
        platform: "Polymarket leaderboard",
        winRate: 0.66,
        roi: 15.8,
        position: "no",
        confidence: 0.72
      },
      {
        name: "DiplomacyAlpha",
        platform: "Polymarket leaderboard",
        winRate: 0.61,
        roi: 10.6,
        position: "yes",
        confidence: 0.49
      }
    ],
    kalshi: {
      marketTitle: "Ukraine ceasefire this quarter",
      yesPrice: 0.32,
      noPrice: 0.68
    },
    outcomes: [
      { label: "Yes", price: 0.27 },
      { label: "No", price: 0.73 }
    ]
  },
  {
    id: "btc-ath-2026",
    question: "Will Bitcoin make a new all-time high before July 2026?",
    slug: "bitcoin-ath-before-july-2026",
    url: "https://polymarket.com/event/bitcoin-ath-before-july-2026",
    token: "BTCATH",
    status: "open",
    yesPrice: 0.58,
    noPrice: 0.42,
    volume: 3295000,
    liquidity: 880000,
    endDate: "2026-07-01T00:00:00.000Z",
    traders: [
      {
        name: "CryptoPilot",
        platform: "Polymarket leaderboard",
        winRate: 0.69,
        roi: 31.2,
        position: "yes",
        confidence: 0.77
      },
      {
        name: "ETFTracker",
        platform: "Polymarket leaderboard",
        winRate: 0.64,
        roi: 16.4,
        position: "yes",
        confidence: 0.68
      },
      {
        name: "VolGuard",
        platform: "Polymarket leaderboard",
        winRate: 0.57,
        roi: 8.7,
        position: "neutral",
        confidence: 0.44
      }
    ],
    kalshi: {
      marketTitle: "Bitcoin ATH before July 2026",
      yesPrice: 0.61,
      noPrice: 0.39
    },
    outcomes: [
      { label: "Yes", price: 0.58 },
      { label: "No", price: 0.42 }
    ]
  }
];

process.stdout.write(JSON.stringify({ markets }, null, 2));
