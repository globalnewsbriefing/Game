import { getPolymarketSnapshot, simulateAiTrades } from "@/lib/polymarket";

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
  const aiPlan = simulateAiTrades(polymarket.markets, 100);

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
          <p>{aiPlan.rationale}</p>
        </div>
        <div className="market-summary">
          <div>
            <span>Budget</span>
            <strong>{formatCurrency(aiPlan.startingBalance)}</strong>
          </div>
          <div>
            <span>Allocated</span>
            <strong>{formatCurrency(aiPlan.allocated)}</strong>
          </div>
          <div>
            <span>Remaining</span>
            <strong>{formatCurrency(aiPlan.remaining)}</strong>
          </div>
          <div>
            <span>AI positions</span>
            <strong>{aiPlan.positions.length}</strong>
          </div>
        </div>

        {aiPlan.positions.length > 0 ? (
          <div className="ai-trades-grid">
            {aiPlan.positions.map((position) => (
              <article key={`${position.marketId}-${position.side}`} className="ai-trade-card">
                <div className="ai-trade-card__header">
                  <div>
                    <p className="eyebrow">AI trade</p>
                    <h3>{position.marketQuestion}</h3>
                  </div>
                  <span className={`market-status market-status--${position.side === "yes" ? "open" : "resolved"}`}>
                    {position.side.toUpperCase()}
                  </span>
                </div>
                <p className="ai-trade-card__meta">
                  {position.token ? `${position.token} · ` : ""}
                  {formatCurrency(position.amount)} at {formatProbability(position.entryPrice)} for{" "}
                  {formatShares(position.shares)} shares.
                </p>
                <div className="ai-trade-card__stats">
                  <div>
                    <span>Prompt action</span>
                    <strong>{position.promptAction.replace("_", " ")}</strong>
                  </div>
                  <div>
                    <span>Prompt confidence</span>
                    <strong>{position.promptConfidence}</strong>
                  </div>
                  <div>
                    <span>Yes price</span>
                    <strong>{formatProbability(position.yesPrice)}</strong>
                  </div>
                  <div>
                    <span>No price</span>
                    <strong>{formatProbability(position.noPrice)}</strong>
                  </div>
                </div>
                <p className="ai-trade-card__reason">{position.rationale}</p>
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
