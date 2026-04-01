"use client";

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

function formatMarketDate(value: string | null) {
  if (!value) {
    return "TBD";
  }

  return formatPublishedAt(value);
}

export function MarketCard({ market }: { market: PolymarketMarket }) {
  return (
    <article className="market-card">
      <div className="market-card__header">
        <p className="eyebrow">Polymarket</p>
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
        Volume {formatCompactNumber(market.volume)} · Liquidity {formatCompactNumber(market.liquidity)}
      </p>
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
  title = "Polymarket watch",
  eyebrow = "Prediction markets",
  description,
  emptyHeading = "No Polymarket markets are available yet.",
  compact = false,
}: PolymarketSectionProps) {
  return (
    <section className="section-block">
      <div className="section-heading">
        <div>
          <p className="eyebrow">{eyebrow}</p>
          <h2>{title}</h2>
        </div>
        <p>{description ?? snapshot.message}</p>
      </div>
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
            <MarketCard key={market.id} market={market} />
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
                  <MarketCard key={market.id} market={market} />
                ))}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
