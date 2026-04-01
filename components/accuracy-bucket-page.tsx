"use client";

import type { AccuracyBand, PolymarketMarket } from "@/lib/polymarket";

type AccuracyBucketPageProps = {
  band: AccuracyBand;
  title: string;
  description: string;
  markets: PolymarketMarket[];
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(value);
}

function formatProbability(value: number | null) {
  if (value === null) {
    return "--";
  }

  return `${Math.round(value * 100)}%`;
}

function formatShares(value: number) {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 2,
  }).format(value);
}

function formatPercent(value: number) {
  return `${Math.round(value * 100)}%`;
}

export function AccuracyBucketPage({
  band,
  title,
  description,
  markets,
}: AccuracyBucketPageProps) {
  const suggestedBudget = 100;
  const suggestedPerTrade = markets.length > 0 ? Math.floor(suggestedBudget / markets.length) : 0;

  return (
    <main className="page-shell">
      <section className="hero hero--single">
        <div className="hero__content">
          <p className="eyebrow">Accuracy band</p>
          <p className="hero__lede">{description}</p>
        </div>
      </section>

      <section className="section-block">
        <div className="section-heading">
          <div>
            <p className="eyebrow">{band} conviction</p>
            <h2>{title}</h2>
          </div>
          <p>
            Split by likely accuracy using Polymarket pricing, Kalshi pricing, and the leaderboard
            signal from both venues.
          </p>
        </div>
        <div className="market-summary">
          <div>
            <span>Markets in band</span>
            <strong>{markets.length}</strong>
          </div>
          <div>
            <span>Paper budget</span>
            <strong>{formatCurrency(suggestedBudget)}</strong>
          </div>
          <div>
            <span>Per trade</span>
            <strong>{markets.length > 0 ? formatCurrency(suggestedPerTrade) : "--"}</strong>
          </div>
          <div>
            <span>Band</span>
            <strong>{band}</strong>
          </div>
        </div>

        {markets.length > 0 ? (
          <div className="ai-trades-grid">
            {markets.map((market) => {
              const side = market.tradePrompt.action === "buy_no" ? "NO" : "YES";
              const entryPrice = market.tradePrompt.action === "buy_no" ? market.noPrice : market.yesPrice;
              const amount = suggestedPerTrade;
              const shares = entryPrice && amount > 0 ? amount / entryPrice : 0;

              return (
                <article key={market.id} className="ai-trade-card">
                  <div className="ai-trade-card__header">
                    <div>
                      <p className="eyebrow">Accuracy trade</p>
                      <h3>{market.question}</h3>
                    </div>
                    <span className="market-status market-status--open">{band}</span>
                  </div>
                  <p className="ai-trade-card__meta">
                    {market.token ? `${market.token} · ` : ""}
                    {amount > 0 ? formatCurrency(amount) : "--"} on {side} at{" "}
                    {formatProbability(entryPrice)} for {shares > 0 ? formatShares(shares) : "--"} shares.
                  </p>
                  <div className="ai-trade-card__stats">
                    <div>
                      <span>Accuracy score</span>
                      <strong>{formatPercent(market.accuracyScore)}</strong>
                    </div>
                    <div>
                      <span>Prompt confidence</span>
                      <strong>{market.tradePrompt.confidence}</strong>
                    </div>
                    <div>
                      <span>Polymarket yes</span>
                      <strong>{formatProbability(market.yesPrice)}</strong>
                    </div>
                    <div>
                      <span>Kalshi yes</span>
                      <strong>{formatProbability(market.kalshi?.yesPrice ?? null)}</strong>
                    </div>
                  </div>
                  <p className="ai-trade-card__thesis">{market.tradePrompt.rationale}</p>
                  <p className="ai-trade-card__footnote">
                    Leaderboard strength is blended from both venues to estimate how likely the setup
                    is to be directionally accurate.
                  </p>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="empty-state">
            <p className="eyebrow">No markets</p>
            <h3>No trades fall into this accuracy band right now.</h3>
            <p>
              When new markets arrive with enough pricing and leaderboard agreement, they will appear
              here automatically.
            </p>
          </div>
        )}
      </section>
    </main>
  );
}
