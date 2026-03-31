"use client";

import { useMemo, useState } from "react";
import type { NewsBriefing, NewsStory } from "@/lib/news";

type FilterKey =
  | "all"
  | "markets"
  | "wikileaks"
  | "north-america"
  | "europe"
  | "middle-east"
  | "east-asia"
  | "south-asia"
  | "africa"
  | "latin-america"
  | "global";

type FilterConfig = {
  key: FilterKey;
  label: string;
  description: string;
  predicate: (story: NewsStory) => boolean;
};

const filterConfigs: FilterConfig[] = [
  {
    key: "all",
    label: "All",
    description: "The full ranked global briefing.",
    predicate: () => true,
  },
  {
    key: "markets",
    label: "Markets",
    description: "Energy, inflation, trade, rates, and market-moving stories.",
    predicate: (story) =>
      story.categories.includes("economics") ||
      story.signals.some((signal) =>
        ["market", "oil", "gas", "energy", "trade", "inflation", "gdp"].includes(
          signal.toLowerCase(),
        ),
      ),
  },
  {
    key: "wikileaks",
    label: "WikiLeaks",
    description: "WikiLeaks press items and document-release coverage.",
    predicate: (story) => story.source.toLowerCase().includes("wikileaks"),
  },
  {
    key: "north-america",
    label: "North America",
    description: "Stories centered on the U.S., Canada, and Mexico.",
    predicate: (story) => story.regionLabel === "North America",
  },
  {
    key: "europe",
    label: "Europe",
    description: "European strategic, political, and economic developments.",
    predicate: (story) => story.regionLabel === "Europe",
  },
  {
    key: "middle-east",
    label: "Middle East",
    description: "Middle East conflict, diplomacy, energy, and political risk.",
    predicate: (story) => story.regionLabel === "Middle East",
  },
  {
    key: "east-asia",
    label: "East Asia",
    description: "China, Taiwan, Japan, Korea, and regional flashpoints.",
    predicate: (story) => story.regionLabel === "East Asia",
  },
  {
    key: "south-asia",
    label: "South Asia",
    description: "India, Pakistan, Afghanistan, and regional developments.",
    predicate: (story) => story.regionLabel === "South Asia",
  },
  {
    key: "africa",
    label: "Africa",
    description: "African political, economic, and security developments.",
    predicate: (story) => story.regionLabel === "Africa",
  },
  {
    key: "latin-america",
    label: "Latin America",
    description: "Latin American political and economic developments.",
    predicate: (story) => story.regionLabel === "Latin America",
  },
  {
    key: "global",
    label: "Global",
    description: "UN, G7, IMF, OPEC, and broad cross-border spillovers.",
    predicate: (story) =>
      story.regionLabel === "Global" || story.regionLabel === "Cross-border",
  },
];

const lensDescriptions = {
  geopolitics:
    "Conflicts, alliances, diplomacy, sanctions, and strategic competition between states.",
  economics:
    "Inflation, energy, trade, central banks, industrial policy, and market-moving developments.",
  politics:
    "Elections, executive power, legislation, domestic stability, and political risk.",
} as const;

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
        {stories.length > 0 ? (
          stories.map((story) => (
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
          ))
        ) : (
          <article className="lens-story">
            <h3>No stories in this slice right now.</h3>
            <p>Try another filter to view the rest of the briefing.</p>
          </article>
        )}
      </div>
    </section>
  );
}

export function BriefingClient({ briefing }: { briefing: NewsBriefing }) {
  const [activeFilter, setActiveFilter] = useState<FilterKey>("all");

  const filteredStories = useMemo(() => {
    const currentFilter =
      filterConfigs.find((filter) => filter.key === activeFilter) ?? filterConfigs[0];
    return briefing.topStories.filter(currentFilter.predicate);
  }, [activeFilter, briefing.topStories]);

  const currentFilter =
    filterConfigs.find((filter) => filter.key === activeFilter) ?? filterConfigs[0];
  const [leadStory, ...moreStories] = filteredStories;

  const lensStories = {
    geopolitics: filteredStories.filter((story) => story.categories.includes("geopolitics")).slice(0, 3),
    economics: filteredStories.filter((story) => story.categories.includes("economics")).slice(0, 3),
    politics: filteredStories.filter((story) => story.categories.includes("politics")).slice(0, 3),
  };

  return (
    <main className="page-shell">
      <section className="filter-bar">
        <div className="filter-bar__copy">
          <p className="eyebrow">Browse by section</p>
          <p>{currentFilter.description}</p>
        </div>
        <div className="filter-bar__tabs">
          {filterConfigs.map((filter) => (
            <button
              key={filter.key}
              type="button"
              className={`filter-pill ${activeFilter === filter.key ? "filter-pill--active" : ""}`}
              onClick={() => setActiveFilter(filter.key)}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </section>

      <section className="hero">
        <div className="hero__content">
          <p className="hero__lede">{briefing.overview}</p>
          <div className="hero__stats">
            <div>
              <span>Stories ranked</span>
              <strong>{filteredStories.length}</strong>
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
              <p className="eyebrow">
                {activeFilter === "all" ? "Most relevant now" : `${currentFilter.label} focus`}
              </p>
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
      ) : (
        <section className="section-block">
          <div className="section-heading">
            <div>
              <p className="eyebrow">{currentFilter.label}</p>
              <h2>No stories matched this section right now.</h2>
            </div>
            <p>Choose another section in the bar above to continue browsing the briefing.</p>
          </div>
        </section>
      )}

      <section className="section-block">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Top stories</p>
            <h2>
              {activeFilter === "all"
                ? "What is moving the world right now"
                : `Top stories in ${currentFilter.label}`}
            </h2>
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
          <p>The app separates strategic, market, and domestic-political significance so you can scan faster.</p>
        </div>
        <div className="lens-grid">
          <LensColumn
            title="Geopolitics"
            description={lensDescriptions.geopolitics}
            stories={lensStories.geopolitics}
          />
          <LensColumn
            title="Economics"
            description={lensDescriptions.economics}
            stories={lensStories.economics}
          />
          <LensColumn
            title="Politics"
            description={lensDescriptions.politics}
            stories={lensStories.politics}
          />
        </div>
      </section>
    </main>
  );
}
