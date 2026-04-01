#!/usr/bin/env node

const markets = [
  {
    id: "fed-cut-june",
    question: "Will the Fed cut rates by June 2026?",
    slug: "fed-cut-june-2026",
    url: "https://polymarket.com/event/fed-cut-june-2026",
    status: "open",
    yesPrice: 0.62,
    noPrice: 0.38,
    volume: 2840000,
    liquidity: 615000,
    endDate: "2026-06-30T20:00:00.000Z",
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
    status: "open",
    yesPrice: 0.27,
    noPrice: 0.73,
    volume: 1715000,
    liquidity: 410000,
    endDate: "2026-06-30T23:59:00.000Z",
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
    status: "open",
    yesPrice: 0.58,
    noPrice: 0.42,
    volume: 3295000,
    liquidity: 880000,
    endDate: "2026-07-01T00:00:00.000Z",
    outcomes: [
      { label: "Yes", price: 0.58 },
      { label: "No", price: 0.42 }
    ]
  }
];

process.stdout.write(JSON.stringify({ markets }, null, 2));
