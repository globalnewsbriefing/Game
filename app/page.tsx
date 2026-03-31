import newsData from "@/app/generated/briefing.json";
import { type NewsBriefing, type NewsCategory, type NewsStory } from "@/lib/news";

const lensDescriptions: Record<NewsCategory, string> = {
  geopolitics:
    "Conflicts, alliances, diplomacy, sanctions, and strategic competition between states.",
  economics:
    "Inflation, energy, trade, central banks, industrial policy, and market-moving developments.",
  politics:
    "Elections, executive power, legislation, domestic stability, and political risk.",
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

function StoryCard({ story }: { story: NewsStory }) {
  return (
    <article className="story-card">
      <div className="story-card__header">
        <div>
          <p className="eyebrow">{story.source}</p>
          <h3>{story.title}</h3>
        </div>
        <div className="relevance-pill">{story.relevanceScore}/100 relevance</div>
      </div>

      <p className="story-card__meta">
        {story.regionLabel} · {formatPublishedAt(story.publishedAt)}
      </p>

      <div className="chip-row">
        {story.categories.map((category) => (
          <span key={category} className={`chip chip--${category}`}>
            {category}
          </span>
        ))}
      </div>

      <p className="story-card__description">{story.description}</p>
      <p className="story-card__why">{story.whyItMatters}</p>

      <div className="signal-list">
        {story.signals.slice(0, 4).map((signal) => (
          <span key={signal} className="signal-pill">
            {signal}
          </span>
        ))}
      </div>

      <a className="story-link" href={story.link} target="_blank" rel="noreferrer">
        Read original coverage
      </a>
    </article>
  );
}

function LensColumn({
  title,
  description,
  stories,
}: {
  title: string;
  description: string;
  stories: NewsStory[];
}) {
  return (
    <section className="lens-column">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Lens</p>
          <h2>{title}</h2>
        </div>
        <p>{description}</p>
      </div>
      <div className="lens-stack">
        {stories.map((story) => (
          <article key={`${title}-${story.id}`} className="lens-story">
            <div className="lens-story__topline">
              <span>{story.source}</span>
              <span>{story.relevanceScore}/100</span>
            </div>
            <h3>{story.title}</h3>
            <p>{story.whyItMatters}</p>
            <a href={story.link} target="_blank" rel="noreferrer">
              Open article
            </a>
          </article>
        ))}
      </div>
    </section>
  );
}

export default async function HomePage() {
  const briefing = newsData as NewsBriefing;
  const [leadStory, ...moreStories] = briefing.topStories;

  return (
    <main className="page-shell">
      <section className="hero">
        <div className="hero__content">
          <p className="eyebrow">Global briefing</p>
          <h1>World news ranked by geopolitical, economic, and political relevance.</h1>
          <p className="hero__lede">{briefing.overview}</p>
          <div className="hero__stats">
            <div>
              <span>Stories ranked</span>
              <strong>{briefing.totalStoriesConsidered}</strong>
            </div>
            <div>
              <span>Feeds scanned</span>
              <strong>{briefing.sourcesScanned}</strong>
            </div>
            <div>
              <span>Updated</span>
              <strong>{formatPublishedAt(briefing.generatedAt)}</strong>
            </div>
          </div>
        </div>
        <div className="hero__panel">
          <p className="eyebrow">Method</p>
          <h2>How ranking works</h2>
          <ul>
            <li>Recency boosts stories published in the last 72 hours.</li>
            <li>Keyword signals detect conflict, diplomacy, elections, trade, energy, and markets.</li>
            <li>Region and institution tags surface stories with cross-border spillover.</li>
            <li>Each article gets a generated explanation of why it matters.</li>
          </ul>
        </div>
      </section>

      {leadStory ? (
        <section className="lead-story">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Most relevant now</p>
              <h2>{leadStory.title}</h2>
            </div>
            <p>{leadStory.source}</p>
          </div>
          <div className="lead-story__body">
            <div>
              <div className="chip-row">
                {leadStory.categories.map((category) => (
                  <span key={category} className={`chip chip--${category}`}>
                    {category}
                  </span>
                ))}
              </div>
              <p className="lead-story__description">{leadStory.description}</p>
              <p className="lead-story__why">{leadStory.whyItMatters}</p>
              <div className="signal-list">
                {leadStory.signals.map((signal) => (
                  <span key={signal} className="signal-pill">
                    {signal}
                  </span>
                ))}
              </div>
            </div>
            <div className="lead-story__meta">
              <div>
                <span>Region</span>
                <strong>{leadStory.regionLabel}</strong>
              </div>
              <div>
                <span>Published</span>
                <strong>{formatPublishedAt(leadStory.publishedAt)}</strong>
              </div>
              <div>
                <span>Relevance</span>
                <strong>{leadStory.relevanceScore}/100</strong>
              </div>
              <a className="story-link" href={leadStory.link} target="_blank" rel="noreferrer">
                Read original coverage
              </a>
            </div>
          </div>
        </section>
      ) : null}

      <section className="section-block">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Top stories</p>
            <h2>What is moving the world right now</h2>
          </div>
          <p>Cross-border consequences, economic spillovers, and political risk drive the order.</p>
        </div>
        <div className="story-grid">
          {moreStories.map((story) => (
            <StoryCard key={story.id} story={story} />
          ))}
        </div>
      </section>

      <section className="section-block">
        <div className="section-heading">
          <div>
            <p className="eyebrow">By lens</p>
            <h2>Read the same world through three filters</h2>
          </div>
          <p>
            The app separates strategic, market, and domestic-political significance so you can
            scan faster.
          </p>
        </div>
        <div className="lens-grid">
          <LensColumn
            title="Geopolitics"
            description={lensDescriptions.geopolitics}
            stories={briefing.byCategory.geopolitics}
          />
          <LensColumn
            title="Economics"
            description={lensDescriptions.economics}
            stories={briefing.byCategory.economics}
          />
          <LensColumn
            title="Politics"
            description={lensDescriptions.politics}
            stories={briefing.byCategory.politics}
          />
        </div>
      </section>
    </main>
  );
}
