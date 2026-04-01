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
    kalshiLeaderboard: [
      {
        name: "KalshiMacro",
        platform: "Kalshi leaderboard",
        winRate: 0.7,
        roi: 19.1,
        position: "yes",
        confidence: 0.76
      },
      {
        name: "BondDesk",
        platform: "Kalshi leaderboard",
        winRate: 0.64,
        roi: 12.9,
        position: "yes",
        confidence: 0.67
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
    kalshiLeaderboard: [
      {
        name: "FrontlineFlow",
        platform: "Kalshi leaderboard",
        winRate: 0.69,
        roi: 20.4,
        position: "no",
        confidence: 0.78
      },
      {
        name: "StateRisk",
        platform: "Kalshi leaderboard",
        winRate: 0.63,
        roi: 13.2,
        position: "no",
        confidence: 0.7
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
    kalshiLeaderboard: [
      {
        name: "OptionsTape",
        platform: "Kalshi leaderboard",
        winRate: 0.66,
        roi: 22.4,
        position: "yes",
        confidence: 0.71
      },
      {
        name: "MacroCycle",
        platform: "Kalshi leaderboard",
        winRate: 0.61,
        roi: 12.7,
        position: "yes",
        confidence: 0.63
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
  },
  {
    id: "sol-etf-2026",
    question: "Will a spot Solana ETF be approved before September 2026?",
    slug: "solana-etf-september-2026",
    url: "https://polymarket.com/event/solana-etf-september-2026",
    token: "SOLETF",
    status: "open",
    yesPrice: 0.44,
    noPrice: 0.56,
    volume: 1285000,
    liquidity: 305000,
    endDate: "2026-09-01T00:00:00.000Z",
    traders: [
      {
        name: "AltBeta",
        platform: "Polymarket leaderboard",
        winRate: 0.62,
        roi: 13.7,
        position: "yes",
        confidence: 0.58
      },
      {
        name: "RegWatcher",
        platform: "Polymarket leaderboard",
        winRate: 0.66,
        roi: 17.4,
        position: "no",
        confidence: 0.71
      }
    ],
    kalshiLeaderboard: [
      {
        name: "ETFSignal",
        platform: "Kalshi leaderboard",
        winRate: 0.6,
        roi: 11.4,
        position: "no",
        confidence: 0.67
      }
    ],
    kalshi: {
      marketTitle: "Solana ETF by September 2026",
      yesPrice: 0.47,
      noPrice: 0.53
    },
    outcomes: [
      { label: "Yes", price: 0.44 },
      { label: "No", price: 0.56 }
    ]
  },
  {
    id: "oil-100-2026",
    question: "Will Brent crude trade above $100 before August 2026?",
    slug: "brent-oil-100-august-2026",
    url: "https://polymarket.com/event/brent-oil-100-august-2026",
    token: "OIL100",
    status: "open",
    yesPrice: 0.31,
    noPrice: 0.69,
    volume: 980000,
    liquidity: 212000,
    endDate: "2026-08-01T00:00:00.000Z",
    traders: [
      {
        name: "EnergyTape",
        platform: "Polymarket leaderboard",
        winRate: 0.65,
        roi: 14.1,
        position: "no",
        confidence: 0.73
      },
      {
        name: "MacroBarrel",
        platform: "Polymarket leaderboard",
        winRate: 0.59,
        roi: 9.8,
        position: "no",
        confidence: 0.64
      }
    ],
    kalshiLeaderboard: [
      {
        name: "CrudeCurve",
        platform: "Kalshi leaderboard",
        winRate: 0.67,
        roi: 16.8,
        position: "no",
        confidence: 0.75
      }
    ],
    kalshi: {
      marketTitle: "Brent above 100 before August 2026",
      yesPrice: 0.35,
      noPrice: 0.65
    },
    outcomes: [
      { label: "Yes", price: 0.31 },
      { label: "No", price: 0.69 }
    ]
  },
  {
    id: "taiwan-election-2026",
    question: "Will Taiwan hold a snap election before December 2026?",
    slug: "taiwan-snap-election-2026",
    url: "https://polymarket.com/event/taiwan-snap-election-2026",
    token: "TWELEX",
    status: "open",
    yesPrice: 0.22,
    noPrice: 0.78,
    volume: 860000,
    liquidity: 190000,
    endDate: "2026-12-01T00:00:00.000Z",
    traders: [
      {
        name: "AsiaRisk",
        platform: "Polymarket leaderboard",
        winRate: 0.68,
        roi: 19.9,
        position: "no",
        confidence: 0.76
      },
      {
        name: "ElectionWire",
        platform: "Polymarket leaderboard",
        winRate: 0.61,
        roi: 11.1,
        position: "no",
        confidence: 0.62
      }
    ],
    kalshiLeaderboard: [
      {
        name: "CrossStrait",
        platform: "Kalshi leaderboard",
        winRate: 0.7,
        roi: 18.6,
        position: "no",
        confidence: 0.77
      }
    ],
    kalshi: {
      marketTitle: "Taiwan snap election before December 2026",
      yesPrice: 0.26,
      noPrice: 0.74
    },
    outcomes: [
      { label: "Yes", price: 0.22 },
      { label: "No", price: 0.78 }
    ]
  },
  {
    id: "spx-7000-2026",
    question: "Will the S&P 500 close above 7000 before year-end 2026?",
    slug: "sp500-7000-before-2026-end",
    url: "https://polymarket.com/event/sp500-7000-before-2026-end",
    token: "SPX7K",
    status: "open",
    yesPrice: 0.49,
    noPrice: 0.51,
    volume: 1490000,
    liquidity: 344000,
    endDate: "2026-12-31T21:00:00.000Z",
    traders: [
      {
        name: "IndexFlow",
        platform: "Polymarket leaderboard",
        winRate: 0.53,
        roi: 5.2,
        position: "yes",
        confidence: 0.41
      },
      {
        name: "MacroHedge",
        platform: "Polymarket leaderboard",
        winRate: 0.51,
        roi: 3.9,
        position: "yes",
        confidence: 0.38
      }
    ],
    kalshiLeaderboard: [
      {
        name: "SPMacro",
        platform: "Kalshi leaderboard",
        winRate: 0.49,
        roi: 2.1,
        position: "no",
        confidence: 0.35
      }
    ],
    kalshi: {
      marketTitle: "S&P 500 above 7000 by year-end 2026",
      yesPrice: 0.61,
      noPrice: 0.39
    },
    outcomes: [
      { label: "Yes", price: 0.49 },
      { label: "No", price: 0.51 }
    ]
  }
];

process.stdout.write(JSON.stringify({ markets }, null, 2));
