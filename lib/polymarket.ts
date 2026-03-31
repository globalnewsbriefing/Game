export type PromptRecipe = {
  id: string;
  title: string;
  prompt: string;
  goal: string;
};

export type AuthenticatedWorkflow = {
  id: string;
  title: string;
  summary: string;
  commands: string[];
};

export type LeaderboardEntry = {
  rank: number;
  wallet: string;
  userName: string;
  volume: number;
  pnl: number;
  profileImage: string;
};

export type LiveMarket = {
  id: string;
  question: string;
  slug: string;
  eventTitle: string;
  endDate: string;
  volume: number;
  liquidity: number;
  lastTradePrice: number | null;
  bestBid: number | null;
  bestAsk: number | null;
  spread: number | null;
  oneDayPriceChange: number | null;
  outcomes: Array<{
    label: string;
    price: number | null;
  }>;
  primaryTokenId: string | null;
};

export type LiveEvent = {
  id: string;
  title: string;
  slug: string;
  volume: number;
  liquidity: number;
  openInterest: number;
  endDate: string;
  tags: string[];
};

export type MarketBookSnapshot = {
  question: string;
  slug: string;
  tokenId: string | null;
  lastTradePrice: number | null;
  midpoint: number | null;
  spread: number | null;
  topBids: Array<{
    price: number | null;
    size: number | null;
  }>;
  topAsks: Array<{
    price: number | null;
    size: number | null;
  }>;
};

export type WalletPosition = {
  conditionId: string;
  title: string;
  slug: string;
  outcome: string;
  size: number;
  avgPrice: number;
  currentValue: number;
  cashPnl: number;
  redeemable: boolean;
  mergeable: boolean;
  endDate: string;
};

export type WalletView = {
  requestedWallet: string | null;
  activeWallet: string | null;
  sourceLabel: string;
  totalValue: number | null;
  positions: WalletPosition[];
  error: string | null;
};

export type PolymarketWorkspace = {
  generatedAt: string;
  title: string;
  sourceUrl: string;
  warning: string;
  overview: string;
  leaderboards: {
    monthlyPnl: LeaderboardEntry[];
  };
  featuredMarkets: LiveMarket[];
  politicsEvents: LiveEvent[];
  bookSnapshot: MarketBookSnapshot | null;
  walletView: WalletView;
  authenticatedWorkflows: AuthenticatedWorkflow[];
  promptRecipes: PromptRecipe[];
  stats: {
    leaderboardEntries: number;
    featuredMarkets: number;
    politicsEvents: number;
    walletPositions: number;
  };
};

type LeaderboardApiEntry = {
  rank?: string | number;
  proxyWallet?: string;
  userName?: string;
  vol?: number;
  pnl?: number;
  profileImage?: string;
};

type GammaMarketResponse = {
  id?: string | number;
  question?: string;
  slug?: string;
  endDate?: string;
  volumeNum?: number;
  liquidityNum?: number;
  lastTradePrice?: number;
  bestBid?: number;
  bestAsk?: number;
  spread?: number;
  oneDayPriceChange?: number;
  outcomes?: string;
  outcomePrices?: string;
  clobTokenIds?: string;
  events?: Array<{
    title?: string;
  }>;
};

type GammaEventResponse = {
  id?: string | number;
  title?: string;
  slug?: string;
  volume?: number;
  liquidity?: number;
  openInterest?: number;
  endDate?: string;
  tags?: Array<{
    label?: string;
  }>;
};

type MidpointResponse = {
  mid?: string;
  mid_price?: string;
};

type SpreadResponse = {
  spread?: string;
};

type OrderBookLevel = {
  price?: string;
  size?: string;
};

type OrderBookResponse = {
  bids?: OrderBookLevel[];
  asks?: OrderBookLevel[];
  last_trade_price?: string;
};

type WalletValueResponse = Array<{
  value?: number;
}>;

type WalletPositionResponse = {
  conditionId?: string;
  title?: string;
  slug?: string;
  outcome?: string;
  size?: number;
  avgPrice?: number;
  currentValue?: number;
  cashPnl?: number;
  redeemable?: boolean;
  mergeable?: boolean;
  endDate?: string;
};

const GAMMA_API = "https://gamma-api.polymarket.com";
const DATA_API = "https://data-api.polymarket.com";
const CLOB_API = "https://clob.polymarket.com";
const DEFAULT_TOP_MARKET_LIMIT = 6;
const DEFAULT_EVENTS_LIMIT = 4;
const DEFAULT_WALLET_POSITION_LIMIT = 5;
const walletAddressPattern = /^0x[a-fA-F0-9]{40}$/;

const authenticatedWorkflows: AuthenticatedWorkflow[] = [
  {
    id: "workflow-orders",
    title: "Place orders from the terminal",
    summary:
      "Set up a wallet, approve contracts, then place either a limit or market order with the Polymarket CLI.",
    commands: [
      "polymarket wallet create",
      "polymarket approve set",
      "polymarket clob create-order --token TOKEN_ID --side buy --price 0.45 --size 20",
      "polymarket clob market-order --token TOKEN_ID --side buy --amount 5",
    ],
  },
  {
    id: "workflow-risk",
    title: "Manage account risk",
    summary:
      "Inspect collateral, open orders, and private fills once your Polymarket wallet is configured.",
    commands: [
      "polymarket clob balance --asset-type collateral",
      "polymarket clob orders",
      "polymarket clob trades",
      "polymarket clob cancel-all",
    ],
  },
  {
    id: "workflow-onchain",
    title: "Interact with onchain contracts",
    summary:
      "Approve spending, split collateral into YES/NO tokens, merge paired positions, and redeem winners.",
    commands: [
      "polymarket approve check",
      "polymarket ctf split --condition 0xCONDITION_ID --amount 10",
      "polymarket ctf merge --condition 0xCONDITION_ID --amount 10",
      "polymarket ctf redeem --condition 0xCONDITION_ID",
    ],
  },
];

const promptRecipes: PromptRecipe[] = [
  {
    id: "prompt-leaderboard",
    title: "Leaderboard scan",
    prompt:
      "Show me the live Polymarket monthly leaderboard by pnl and identify the top wallet to inspect further.",
    goal: "Move from live rankings into a public wallet investigation.",
  },
  {
    id: "prompt-politics",
    title: "Politics market browse",
    prompt:
      "Browse the most active live politics events and summarize the highest-volume markets worth researching.",
    goal: "Use live event and market data for a Kalshi-style topic sweep.",
  },
  {
    id: "prompt-market-book",
    title: "Order-book research",
    prompt:
      "Take the highest-volume active market, show the latest book snapshot, midpoint, spread, and current yes/no prices.",
    goal: "Bridge discovery into executable market research.",
  },
  {
    id: "prompt-wallet",
    title: "Public wallet monitor",
    prompt:
      "Load a public wallet, show its total value and largest open positions, then summarize redeemable or mergeable exposure.",
    goal: "Track a wallet's visible positions without authenticated access.",
  },
];

function parseNumber(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string" && value.length > 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

function parseStringArray(value: unknown) {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === "string");
  }

  if (typeof value !== "string" || value.length === 0) {
    return [] as string[];
  }

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed)
      ? parsed.filter((item): item is string => typeof item === "string")
      : [];
  } catch {
    return [];
  }
}

async function fetchJson<T>(url: string): Promise<T | null> {
  try {
    const response = await fetch(url, {
      headers: {
        accept: "application/json",
        "user-agent": "PolymarketCliWorkspace/1.0",
      },
      next: { revalidate: 60 },
    });

    if (!response.ok) {
      return null;
    }

    return (await response.json()) as T;
  } catch {
    return null;
  }
}

async function fetchMonthlyLeaderboard(limit = 5) {
  const data = await fetchJson<LeaderboardApiEntry[]>(
    `${DATA_API}/v1/leaderboard?timePeriod=MONTH&orderBy=PNL&limit=${limit}`,
  );

  return (data ?? []).map((entry) => ({
    rank: parseNumber(entry.rank) ?? 0,
    wallet: entry.proxyWallet ?? "",
    userName: entry.userName || entry.proxyWallet || "Anonymous",
    volume: entry.vol ?? 0,
    pnl: entry.pnl ?? 0,
    profileImage: entry.profileImage ?? "",
  }));
}

async function fetchFeaturedMarkets(limit = DEFAULT_TOP_MARKET_LIMIT) {
  const data = await fetchJson<GammaMarketResponse[]>(
    `${GAMMA_API}/markets?limit=18&closed=false`,
  );

  return (data ?? [])
    .sort((left, right) => (right.volumeNum ?? 0) - (left.volumeNum ?? 0))
    .slice(0, limit)
    .map((market) => {
      const outcomes = parseStringArray(market.outcomes);
      const prices = parseStringArray(market.outcomePrices).map((price) => parseNumber(price));
      const tokenIds = parseStringArray(market.clobTokenIds);

      return {
        id: String(market.id ?? market.slug ?? ""),
        question: market.question ?? "Untitled market",
        slug: market.slug ?? "",
        eventTitle: market.events?.[0]?.title ?? "Polymarket",
        endDate: market.endDate ?? "",
        volume: market.volumeNum ?? 0,
        liquidity: market.liquidityNum ?? 0,
        lastTradePrice: parseNumber(market.lastTradePrice),
        bestBid: parseNumber(market.bestBid),
        bestAsk: parseNumber(market.bestAsk),
        spread: parseNumber(market.spread),
        oneDayPriceChange: parseNumber(market.oneDayPriceChange),
        outcomes: outcomes.map((label, index) => ({
          label,
          price: prices[index] ?? null,
        })),
        primaryTokenId: tokenIds[0] ?? null,
      } satisfies LiveMarket;
    });
}

async function fetchPoliticsEvents(limit = DEFAULT_EVENTS_LIMIT) {
  const data = await fetchJson<GammaEventResponse[]>(
    `${GAMMA_API}/events?limit=12&closed=false&tag_slug=politics`,
  );

  return (data ?? [])
    .sort((left, right) => (right.volume ?? 0) - (left.volume ?? 0))
    .slice(0, limit)
    .map((event) => ({
      id: String(event.id ?? event.slug ?? ""),
      title: event.title ?? "Untitled event",
      slug: event.slug ?? "",
      volume: event.volume ?? 0,
      liquidity: event.liquidity ?? 0,
      openInterest: event.openInterest ?? 0,
      endDate: event.endDate ?? "",
      tags: (event.tags ?? [])
        .map((tag) => tag.label)
        .filter((tag): tag is string => Boolean(tag)),
    }));
}

async function fetchBookSnapshot(market: LiveMarket | undefined) {
  if (!market?.primaryTokenId) {
    return null;
  }

  const [midpoint, spread, book] = await Promise.all([
    fetchJson<MidpointResponse>(`${CLOB_API}/midpoint?token_id=${market.primaryTokenId}`),
    fetchJson<SpreadResponse>(`${CLOB_API}/spread?token_id=${market.primaryTokenId}`),
    fetchJson<OrderBookResponse>(`${CLOB_API}/book?token_id=${market.primaryTokenId}`),
  ]);

  return {
    question: market.question,
    slug: market.slug,
    tokenId: market.primaryTokenId,
    lastTradePrice: parseNumber(book?.last_trade_price) ?? market.lastTradePrice,
    midpoint: parseNumber(midpoint?.mid ?? midpoint?.mid_price),
    spread: parseNumber(spread?.spread) ?? market.spread,
    topBids: (book?.bids ?? []).slice(0, 3).map((level) => ({
      price: parseNumber(level.price),
      size: parseNumber(level.size),
    })),
    topAsks: (book?.asks ?? []).slice(0, 3).map((level) => ({
      price: parseNumber(level.price),
      size: parseNumber(level.size),
    })),
  } satisfies MarketBookSnapshot;
}

async function fetchWalletView(requestedWallet: string | undefined, fallbackWallet: string | null) {
  const normalizedRequestedWallet = requestedWallet?.trim() || null;
  const requestedWalletIsValid =
    normalizedRequestedWallet !== null && walletAddressPattern.test(normalizedRequestedWallet);
  const activeWallet = requestedWalletIsValid
    ? normalizedRequestedWallet
    : fallbackWallet && walletAddressPattern.test(fallbackWallet)
      ? fallbackWallet
      : null;

  if (!activeWallet) {
    return {
      requestedWallet: normalizedRequestedWallet,
      activeWallet: null,
      sourceLabel: "No public wallet available",
      totalValue: null,
      positions: [],
      error: normalizedRequestedWallet
        ? "The requested wallet address is invalid."
        : "No default wallet was available from the live leaderboard.",
    } satisfies WalletView;
  }

  const [valueResponse, positionsResponse] = await Promise.all([
    fetchJson<WalletValueResponse>(`${DATA_API}/value?user=${activeWallet}`),
    fetchJson<WalletPositionResponse[]>(
      `${DATA_API}/positions?user=${activeWallet}&limit=${DEFAULT_WALLET_POSITION_LIMIT}`,
    ),
  ]);

  const positions = (positionsResponse ?? [])
    .map((position) => ({
      conditionId: position.conditionId ?? "",
      title: position.title ?? "Untitled position",
      slug: position.slug ?? "",
      outcome: position.outcome ?? "",
      size: position.size ?? 0,
      avgPrice: position.avgPrice ?? 0,
      currentValue: position.currentValue ?? 0,
      cashPnl: position.cashPnl ?? 0,
      redeemable: Boolean(position.redeemable),
      mergeable: Boolean(position.mergeable),
      endDate: position.endDate ?? "",
    }))
    .sort((left, right) => right.size - left.size);

  const totalValue = valueResponse?.[0]?.value ?? null;
  const sourceLabel = requestedWalletIsValid
    ? "Showing the requested public wallet"
    : "Showing the top live leaderboard wallet";

  return {
    requestedWallet: normalizedRequestedWallet,
    activeWallet,
    sourceLabel,
    totalValue,
    positions,
    error:
      normalizedRequestedWallet && !requestedWalletIsValid
        ? "The requested wallet address was invalid, so the view fell back to the top live leaderboard wallet."
        : null,
  } satisfies WalletView;
}

function buildOverview(leaderboard: LeaderboardEntry[], markets: LiveMarket[], events: LiveEvent[]) {
  const leader = leaderboard[0];
  const topMarket = markets[0];
  const topEvent = events[0];

  if (!leader || !topMarket || !topEvent) {
    return "Live Polymarket public APIs are connected, but one or more data sections are temporarily unavailable.";
  }

  return `Live data is now powering this workspace. ${leader.userName} leads the monthly pnl leaderboard, ${topMarket.question} is the highest-volume active market in this snapshot, and ${topEvent.title} is the most active politics event currently surfaced.`;
}

export async function getPolymarketWorkspace(wallet?: string): Promise<PolymarketWorkspace> {
  const [leaderboard, featuredMarkets, politicsEvents] = await Promise.all([
    fetchMonthlyLeaderboard(),
    fetchFeaturedMarkets(),
    fetchPoliticsEvents(),
  ]);

  const [bookSnapshot, walletView] = await Promise.all([
    fetchBookSnapshot(featuredMarkets[0]),
    fetchWalletView(wallet, leaderboard[0]?.wallet ?? null),
  ]);

  return {
    generatedAt: new Date().toISOString(),
    title: "Polymarket live workspace",
    sourceUrl: "https://github.com/Polymarket/polymarket-cli",
    warning:
      "Live data below comes from Polymarket's public APIs. Trading and onchain write actions still require your own configured wallet and explicit transaction approval.",
    overview: buildOverview(leaderboard, featuredMarkets, politicsEvents),
    leaderboards: {
      monthlyPnl: leaderboard,
    },
    featuredMarkets,
    politicsEvents,
    bookSnapshot,
    walletView,
    authenticatedWorkflows,
    promptRecipes,
    stats: {
      leaderboardEntries: leaderboard.length,
      featuredMarkets: featuredMarkets.length,
      politicsEvents: politicsEvents.length,
      walletPositions: walletView.positions.length,
    },
  };
}
