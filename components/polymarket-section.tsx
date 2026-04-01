"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { NewsStory } from "@/lib/news";
import type { PolymarketMarket, PolymarketSnapshot, StoryMarketMatch } from "@/lib/polymarket";

type PolymarketSectionProps = {
  snapshot: PolymarketSnapshot;
  title?: string;
  eyebrow?: string;
  description?: string;
  emptyHeading?: string;
  compact?: boolean;
};

type PaperTradePosition = {
  marketId: string;
  marketQuestion: string;
  side: "yes" | "no";
  token: string | null;
  amount: number;
  entryPrice: number;
  shares: number;
};

const STARTING_BALANCE = 100;
const PAPER_TRADE_AMOUNT = 10;
const PAPER_WALLET_STORAGE_KEY = "polymarket-paper-wallet";

function isPaperTradePosition(entry: unknown): entry is PaperTradePosition {
  return (
    typeof entry === "object" &&
    entry !== null &&
    typeof (entry as PaperTradePosition).marketId === "string" &&
    typeof (entry as PaperTradePosition).marketQuestion === "string" &&
    ((entry as PaperTradePosition).side === "yes" || (entry as PaperTradePosition).side === "no") &&
    typeof (entry as PaperTradePosition).amount === "number" &&
    typeof (entry as PaperTradePosition).entryPrice === "number" &&
    typeof (entry as PaperTradePosition).shares === "number"
  );
}

function readStoredPaperWallet() {
  if (typeof window === "undefined") {
    return [] as PaperTradePosition[];
  }

  try {
    const raw = window.localStorage.getItem(PAPER_WALLET_STORAGE_KEY);

    if (!raw) {
      return [] as PaperTradePosition[];
    }

    const parsed = JSON.parse(raw) as unknown;

    if (!Array.isArray(parsed)) {
      return [] as PaperTradePosition[];
    }

    return parsed.filter(isPaperTradePosition);
  } catch {
    return [] as PaperTradePosition[];
  }
}

function formatPublishedAt(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Recently";
  }

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  }).format(date);
}

function formatProbability(value: number | null) {
  if (value === null) {
    return "--";
  }

  return `${Math.round(value * 100)}%`;
}

function formatCompactNumber(value: number | null) {
  if (value === null) {
    return "--";
  }

  return new Intl.NumberFormat("en", {
    notation: "compact",
    maximumFractionDigits: value >= 100 ? 1 : 2,
  }).format(value);
}

function formatPercent(value: number | null) {
  if (value === null) {
    return "--";
  }

  return `${Math.round(value * 100)}%`;
}

function formatSignedSpread(value: number | null) {
  if (value === null) {
    return "--";
  }

  const points = Math.round(value * 100);
  return `${points > 0 ? "+" : ""}${points} pts`;
}

function formatMarketDate(value: string | null) {
  if (!value) {
    return "TBD";
  }

  return formatPublishedAt(value);
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(value);
}

function formatShares(value: number) {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 2,
  }).format(value);
}

function calculatePaperTrade(price: number | null, amount: number) {
  if (price === null || price <= 0) {
    return null;
  }

  return {
    amount,
    shares: amount / price,
    entryPrice: price,
  };
}

function PaperWallet({
  positions,
  remainingBalance,
}: {
  positions: PaperTradePosition[];
  remainingBalance: number;
}) {
  return (
    <section className="paper-wallet">
      <div className="paper-wallet__summary">
        <div>
          <span>Paper wallet</span>
          <strong>{formatCurrency(remainingBalance)}</strong>
        </div>
        <div>
          <span>Starting balance</span>
          <strong>{formatCurrency(STARTING_BALANCE)}</strong>
        </div>
        <div>
          <span>Open positions</span>
          <strong>{positions.length}</strong>
        </div>
        <div>
          <span>Per trade</span>
          <strong>{formatCurrency(PAPER_TRADE_AMOUNT)}</strong>
        </div>
      </div>
      {positions.length > 0 ? (
        <div className="paper-wallet__positions">
          {positions.map((position, index) => (
            <article key={`${position.marketId}-${position.side}-${index}`} className="paper-position">
              <p className="eyebrow">Paper trade</p>
              <h3>{position.marketQuestion}</h3>
              <p>
                {position.token ? `${position.token} · ` : ""}
                {position.side.toUpperCase()} with {formatCurrency(position.amount)} at{" "}
                {formatPercent(position.entryPrice)} for {formatShares(position.shares)} shares.
              </p>
            </article>
          ))}
        </div>
      ) : (
        <div className="paper-wallet__empty">
          No paper trades yet. Use the YES/NO buttons on a prompt card to test the predictions with
          your in-app $100.
        </div>
      )}
    </section>
  );
}

export function MarketCard({
  market,
  disabled,
  onPaperTrade,
}: {
  market: PolymarketMarket;
  disabled: boolean;
  onPaperTrade: (market: PolymarketMarket, side: "yes" | "no") => void;
}) {
  const yesSimulation = calculatePaperTrade(market.kalshi?.yesPrice ?? null, PAPER_TRADE_AMOUNT);
  const noSimulation = calculatePaperTrade(market.kalshi?.noPrice ?? null, PAPER_TRADE_AMOUNT);
  const kalshiActionSide = market.kalshiTrade.action === "buy_no" ? "no" : "yes";

  return (
    <article className="market-card">
      <div className="market-card__header">
        <div>
          <p className="eyebrow">Kalshi trade</p>
          {market.token ? <p className="market-token">{market.token}</p> : null}
        </div>
        <span className={`market-status market-status--${market.status}`}>{market.status}</span>
      </div>
      <h3>{market.question}</h3>
      <div className="market-prices">
        <div>
          <span>Yes</span>
          <strong>{formatProbability(market.yesPrice)}</strong>
        </div>
        <div>
          <span>No</span>
          <strong>{formatProbability(market.noPrice)}</strong>
        </div>
      </div>
      <p className="market-card__meta">
        Polymarket volume {formatCompactNumber(market.volume)} · Kalshi market{" "}
        {market.kalshi?.marketTitle ?? "comparison unavailable"}
      </p>
      <div className={`trade-prompt trade-prompt--${market.kalshiTrade.action}`}>
        <p className="trade-prompt__label">Kalshi execution</p>
        <h4>{market.kalshiTrade.title}</h4>
        <p>{market.kalshiTrade.rationale}</p>
        <span className="trade-prompt__confidence">
          Confidence {market.kalshiTrade.confidence}
        </span>
        <div className="trade-actions">
          <button
            type="button"
            className="trade-button trade-button--yes"
            onClick={() => onPaperTrade(market, "yes")}
            disabled={disabled || market.kalshi?.yesPrice === null}
          >
            Buy YES on Kalshi
            {yesSimulation ? ` · ${formatShares(yesSimulation.shares)} shares` : ""}
          </button>
          <button
            type="button"
            className="trade-button trade-button--no"
            onClick={() => onPaperTrade(market, "no")}
            disabled={disabled || market.kalshi?.noPrice === null}
          >
            Buy NO on Kalshi
            {noSimulation ? ` · ${formatShares(noSimulation.shares)} shares` : ""}
          </button>
        </div>
      </div>
      <div className="market-compare-grid">
        <div className="market-compare-card">
          <p className="market-compare-card__label">Kalshi comparison</p>
          <strong>{formatPercent(market.kalshi?.yesPrice ?? null)} yes on Kalshi</strong>
          <p>
            Edge vs Polymarket: {formatSignedSpread(market.kalshiTrade.edgeVsPolymarket)}
          </p>
          <span>
            Execute {kalshiActionSide.toUpperCase()} at{" "}
            {formatPercent(market.kalshiTrade.entryPrice ?? null)} with a suggested{" "}
            {Math.round(market.kalshiTrade.recommendedBudgetShare * 100)}% budget share.
          </span>
        </div>
        <div className="market-compare-card">
          <p className="market-compare-card__label">Kalshi leaderboard</p>
          {market.leaderboards.kalshi.length > 0 ? (
            <ul className="trader-list">
              {market.leaderboards.kalshi.slice(0, 3).map((trader) => (
                <li key={`${market.id}-kalshi-${trader.name}`}>
                  <div>
                    <strong>{trader.name}</strong>
                    <span>{trader.platform}</span>
                  </div>
                  <div>
                    <strong>{trader.position.toUpperCase()}</strong>
                    <span>
                      WR {formatPercent(trader.winRate)} · ROI{" "}
                      {trader.roi !== null ? `${Math.round(trader.roi)}%` : "--"}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="market-compare-card__empty">
              No Kalshi leaderboard traders were provided for this market yet.
            </p>
          )}
        </div>
      </div>
      <div className="market-compare-card">
        <p className="market-compare-card__label">Polymarket leaderboard signal</p>
        {market.leaderboards.polymarket.length > 0 ? (
          <ul className="trader-list">
            {market.leaderboards.polymarket.slice(0, 2).map((trader) => (
              <li key={`${market.id}-polymarket-${trader.name}`}>
                <div>
                  <strong>{trader.name}</strong>
                  <span>{trader.platform}</span>
                </div>
                <div>
                  <strong>{trader.position.toUpperCase()}</strong>
                  <span>
                    WR {formatPercent(trader.winRate)} · ROI{" "}
                    {trader.roi !== null ? `${Math.round(trader.roi)}%` : "--"}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="market-compare-card__empty">
            No Polymarket leaderboard traders were provided for this market yet.
          </p>
        )}
      </div>
      <div className="signal-list">
        {market.outcomes.slice(0, 4).map((outcome) => (
          <span key={`${market.id}-${outcome.label}`} className="signal-pill">
            {outcome.label}: {formatProbability(outcome.price)}
          </span>
        ))}
      </div>
      <div className="market-card__footer">
        <div>
          <span>Ends</span>
          <strong>{formatMarketDate(market.endDate)}</strong>
        </div>
        {market.url ? (
          <a className="story-link" href={market.url} target="_blank" rel="noreferrer">
            Open market
          </a>
        ) : null}
      </div>
    </article>
  );
}

export function PolymarketSection({
  snapshot,
  title = "",
  eyebrow = "Prediction markets",
  description,
  emptyHeading = "No Polymarket markets are available yet.",
  compact = false,
}: PolymarketSectionProps) {
  const [positions, setPositions] = useState<PaperTradePosition[]>(() => readStoredPaperWallet());
  const hasHydratedRef = useRef(false);

  useEffect(() => {
    if (!hasHydratedRef.current) {
      hasHydratedRef.current = true;
    }

    window.localStorage.setItem(PAPER_WALLET_STORAGE_KEY, JSON.stringify(positions));
  }, [positions]);

  const remainingBalance = useMemo(() => {
    const committed = positions.reduce((sum, position) => sum + position.amount, 0);
    return Math.max(0, STARTING_BALANCE - committed);
  }, [positions]);

  function handlePaperTrade(market: PolymarketMarket, side: "yes" | "no") {
    if (remainingBalance < PAPER_TRADE_AMOUNT) {
      return;
    }

    const price = side === "yes" ? market.kalshi?.yesPrice ?? null : market.kalshi?.noPrice ?? null;
    const simulation = calculatePaperTrade(price, PAPER_TRADE_AMOUNT);

    if (!simulation) {
      return;
    }

    setPositions((current) => [
      ...current,
      {
        marketId: market.id,
        marketQuestion: market.question,
        side,
        token: market.token,
        amount: simulation.amount,
        entryPrice: simulation.entryPrice,
        shares: simulation.shares,
      },
    ]);
  }

  return (
    <section className="section-block">
      <div className="section-heading">
        <div>
          <p className="eyebrow">{eyebrow}</p>
          {title ? <h2>{title}</h2> : null}
        </div>
        <p>{description ?? snapshot.message}</p>
      </div>
      <PaperWallet positions={positions} remainingBalance={remainingBalance} />
      <div className="market-summary">
        <div>
          <span>Markets loaded</span>
          <strong>{snapshot.summary.totalMarkets}</strong>
        </div>
        <div>
          <span>Open now</span>
          <strong>{snapshot.summary.openMarkets}</strong>
        </div>
        <div>
          <span>With prices</span>
          <strong>{snapshot.summary.pricedMarkets}</strong>
        </div>
        <div>
          <span>Total volume</span>
          <strong>{formatCompactNumber(snapshot.summary.totalVolume)}</strong>
        </div>
      </div>
      {snapshot.markets.length > 0 ? (
        <div className={compact ? "market-grid market-grid--compact" : "market-grid"}>
          {snapshot.markets.map((market) => (
            <MarketCard
              key={market.id}
              market={market}
              disabled={remainingBalance < PAPER_TRADE_AMOUNT}
              onPaperTrade={handlePaperTrade}
            />
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <p className="eyebrow">{snapshot.status === "error" ? "CLI error" : "CLI not configured"}</p>
          <h3>{emptyHeading}</h3>
          <p>
            Set <code>POLYMARKET_CLI_BIN</code> and <code>POLYMARKET_CLI_ARGS_JSON</code> so the
            server can invoke your Polymarket CLI and render live market pricing here.
          </p>
        </div>
      )}
    </section>
  );
}

type RelatedMarketsSectionProps = {
  stories: NewsStory[];
  matches: StoryMarketMatch[];
};

export function RelatedMarketsSection({ stories, matches }: RelatedMarketsSectionProps) {
  const matchMap = new Map(matches.map((match) => [match.storyId, match.markets]));
  const storiesWithMatches = stories.filter((story) => (matchMap.get(story.id) ?? []).length > 0);

  if (storiesWithMatches.length === 0) {
    return null;
  }

  return (
    <section className="section-block">
      <div className="section-heading">
        <div>
          <p className="eyebrow">News x markets</p>
          <h2>Related markets for top stories</h2>
        </div>
        <p>Heuristic matching links the most relevant headlines to nearby Polymarket questions.</p>
      </div>
      <div className="related-market-list">
        {storiesWithMatches.map((story) => {
          const relatedMarkets = matchMap.get(story.id) ?? [];

          return (
            <article key={story.id} className="related-market-row">
              <div className="related-market-row__story">
                <p className="eyebrow">{story.source}</p>
                <h3>{story.title}</h3>
                <p>{story.whyItMatters}</p>
              </div>
              <div className="related-market-row__markets">
                {relatedMarkets.map((market) => (
                  <MarketCard
                    key={market.id}
                    market={market}
                    disabled
                    onPaperTrade={() => undefined}
                  />
                ))}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
