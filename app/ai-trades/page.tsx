import { buildAiTrades, getPolymarketSnapshot } from "@/lib/polymarket";

export const dynamic = "force-dynamic";

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

export default async function AiTradesPage() {
  const polymarket = await getPolymarketSnapshot();
  const aiTrades = buildAiTrades(polymarket.markets, 100);
  const allocated = aiTrades.reduce((sum, trade) => sum + trade.amount, 0);
  const remaining = Math.max(0, 100 - allocated);

  return (
    <main className="page-shell">
      <section className="hero hero--single">
        <div className="hero__content">
          <p className="eyebrow">AI trades</p>
          <p className="hero__lede">
            A rules-based allocator uses the current trade prompts, prompt confidence, and current
            pricing to deploy a paper budget of $100 whenever the model thinks it should act.
          </p>
        </div>
      </section>

      <section className="section-block">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Automated paper book</p>
            <h2>AI trade allocations</h2>
          </div>
          <p>The AI deploys capital only when the current prompt says buy yes or buy no.</p>
        </div>
        <div className="market-summary">
          <div>
            <span>Budget</span>
            <strong>{formatCurrency(100)}</strong>
          </div>
          <div>
            <span>Allocated</span>
            <strong>{formatCurrency(allocated)}</strong>
          </div>
          <div>
            <span>Remaining</span>
            <strong>{formatCurrency(remaining)}</strong>
          </div>
          <div>
            <span>AI positions</span>
            <strong>{aiTrades.length}</strong>
          </div>
        </div>

        {aiTrades.length > 0 ? (
          <div className="ai-trades-grid">
            {aiTrades.map((trade) => (
              <article key={`${trade.marketId}-${trade.side}`} className="ai-trade-card">
                <div className="ai-trade-card__header">
                  <div>
                    <p className="eyebrow">AI trade</p>
                    <h3>{trade.marketQuestion}</h3>
                  </div>
                  <span className={`market-status market-status--${trade.side === "yes" ? "open" : "resolved"}`}>
                    {trade.side.toUpperCase()}
                  </span>
                </div>
                <p className="ai-trade-card__meta">
                  {trade.token ? `${trade.token} · ` : ""}
                  {formatCurrency(trade.amount)} at {formatProbability(trade.entryPrice)} for{" "}
                  {formatShares(trade.shares)} shares.
                </p>
                <div className="ai-trade-card__stats">
                  <div>
                    <span>Prompt action</span>
                    <strong>{trade.side === "yes" ? "buy yes" : "buy no"}</strong>
                  </div>
                  <div>
                    <span>Prompt confidence</span>
                    <strong>{trade.confidence}</strong>
                  </div>
                  <div>
                    <span>Yes price</span>
                    <strong>{trade.side === "yes" ? formatProbability(trade.entryPrice) : "--"}</strong>
                  </div>
                  <div>
                    <span>No price</span>
                    <strong>{trade.side === "no" ? formatProbability(trade.entryPrice) : "--"}</strong>
                  </div>
                </div>
                <p className="ai-trade-card__reason">{trade.rationale}</p>
              </article>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <p className="eyebrow">No AI entries</p>
            <h3>The AI chose not to allocate the paper budget.</h3>
            <p>
              Current prompts are too weak or too balanced, so the allocator is keeping the budget in
              cash for now.
            </p>
          </div>
        )}
      </section>
    </main>
  );
}
