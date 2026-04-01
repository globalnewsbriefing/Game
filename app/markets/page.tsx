import { PolymarketSection } from "@/components/polymarket-section";
import { getPolymarketSnapshot } from "@/lib/polymarket";

export const dynamic = "force-dynamic";

export default async function MarketsPage() {
  const polymarket = await getPolymarketSnapshot();

  return (
    <main className="page-shell">
      <section className="hero hero--single">
        <div className="hero__content">
          <p className="eyebrow">Prediction markets</p>
          <h1>Polymarket markets ranked for quick monitoring.</h1>
          <p className="hero__lede">
            Browse the normalized Polymarket feed on its own page, independent from the world-news
            briefing.
          </p>
        </div>
      </section>

      <PolymarketSection
        snapshot={polymarket}
        title="All tracked markets"
        eyebrow="Market directory"
        description={polymarket.message}
      />
    </main>
  );
}
