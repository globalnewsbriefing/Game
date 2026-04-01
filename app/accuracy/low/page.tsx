import { AccuracyBucketPage } from "@/components/accuracy-bucket-page";
import { filterMarketsByAccuracyBucket, getPolymarketSnapshot } from "@/lib/polymarket";

export const dynamic = "force-dynamic";

export default async function LowAccuracyTradesPage() {
  const snapshot = await getPolymarketSnapshot();
  const markets = filterMarketsByAccuracyBucket(snapshot.markets, "low");

  return (
    <AccuracyBucketPage
      band="low"
      title="Lower-accuracy setups"
      description="These trades have the weakest combined agreement across Polymarket, Kalshi, and both leaderboards, so they deserve the most skepticism."
      markets={markets}
    />
  );
}
