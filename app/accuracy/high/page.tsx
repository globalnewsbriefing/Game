import { AccuracyBucketPage } from "@/components/accuracy-bucket-page";
import { filterMarketsByAccuracyBucket, getPolymarketSnapshot } from "@/lib/polymarket";

export const dynamic = "force-dynamic";

export default async function HighAccuracyPage() {
  const snapshot = await getPolymarketSnapshot();
  const markets = filterMarketsByAccuracyBucket(snapshot.markets, "high");

  return (
    <AccuracyBucketPage
      band="high"
      title="High-accuracy trades"
      description="These trades have the strongest cross-venue pricing agreement and leaderboard support across Polymarket and Kalshi."
      markets={markets}
    />
  );
}
