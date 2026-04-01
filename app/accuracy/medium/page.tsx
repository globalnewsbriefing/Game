import { AccuracyBucketPage } from "@/components/accuracy-bucket-page";
import { filterMarketsByAccuracyBucket, getPolymarketSnapshot } from "@/lib/polymarket";

export const dynamic = "force-dynamic";

export default async function MediumAccuracyTradesPage() {
  const polymarket = await getPolymarketSnapshot();
  const markets = filterMarketsByAccuracyBucket(polymarket.markets, "medium");

  return (
    <AccuracyBucketPage
      band="medium"
      title="Medium-accuracy trades"
      description="These setups have mixed but still actionable agreement across Polymarket, Kalshi, and the two venue leaderboards."
      markets={markets}
    />
  );
}
