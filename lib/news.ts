import Parser from "rss-parser";

export type NewsCategory = "geopolitics" | "economics" | "politics";

export type NewsStory = {
  id: string;
  title: string;
  description: string;
  whyItMatters: string;
  source: string;
  link: string;
  publishedAt: string;
  categories: NewsCategory[];
  regionLabel: string;
  relevanceScore: number;
  signals: string[];
};

export type NewsBriefing = {
  generatedAt: string;
  overview: string;
  totalStoriesConsidered: number;
  sourcesScanned: number;
  topStories: NewsStory[];
  byCategory: Record<NewsCategory, NewsStory[]>;
};

type FeedConfig = {
  name: string;
  url: string;
  defaultCategories: NewsCategory[];
};

type ParsedItem = {
  title?: string;
  link?: string;
  pubDate?: string;
  isoDate?: string;
  contentSnippet?: string;
  content?: string;
  summary?: string;
};

const parser = new Parser<Record<string, never>, ParsedItem>();

const feeds: FeedConfig[] = [
  {
    name: "BBC World",
    url: "https://feeds.bbci.co.uk/news/world/rss.xml",
    defaultCategories: ["geopolitics", "politics"],
  },
  {
    name: "BBC Business",
    url: "https://feeds.bbci.co.uk/news/business/rss.xml",
    defaultCategories: ["economics"],
  },
  {
    name: "New York Times World",
    url: "https://rss.nytimes.com/services/xml/rss/nyt/World.xml",
    defaultCategories: ["geopolitics", "politics"],
  },
  {
    name: "New York Times Business",
    url: "https://rss.nytimes.com/services/xml/rss/nyt/Business.xml",
    defaultCategories: ["economics"],
  },
  {
    name: "New York Times Politics",
    url: "https://rss.nytimes.com/services/xml/rss/nyt/Politics.xml",
    defaultCategories: ["politics"],
  },
  {
    name: "DW Top Stories",
    url: "https://rss.dw.com/xml/rss-en-top",
    defaultCategories: ["geopolitics", "politics"],
  },
];

const categorySignals: Record<NewsCategory, string[]> = {
  geopolitics: [
    "war",
    "military",
    "missile",
    "sanction",
    "nato",
    "summit",
    "border",
    "ceasefire",
    "diplomatic",
    "china",
    "russia",
    "ukraine",
    "taiwan",
    "gaza",
    "iran",
    "israel",
    "tariff",
    "security",
    "alliance",
    "navy",
  ],
  economics: [
    "inflation",
    "interest rate",
    "rate cut",
    "rate hike",
    "central bank",
    "trade",
    "market",
    "stocks",
    "bonds",
    "growth",
    "recession",
    "oil",
    "gas",
    "energy",
    "supply chain",
    "exports",
    "imports",
    "tariff",
    "jobs",
    "gdp",
  ],
  politics: [
    "election",
    "vote",
    "voter",
    "parliament",
    "congress",
    "senate",
    "prime minister",
    "president",
    "campaign",
    "cabinet",
    "coalition",
    "minister",
    "opposition",
    "court",
    "policy",
    "protest",
    "resign",
    "party",
    "government",
    "constitution",
  ],
};

const regionSignals: Record<string, string[]> = {
  "North America": ["united states", "u.s.", "canada", "mexico", "washington"],
  Europe: ["europe", "eu", "ukraine", "russia", "britain", "uk", "france", "germany", "poland"],
  "Middle East": ["middle east", "israel", "gaza", "iran", "saudi", "syria", "lebanon", "yemen", "qatar"],
  "East Asia": ["china", "taiwan", "japan", "korea", "philippines", "hong kong"],
  "South Asia": ["india", "pakistan", "bangladesh", "sri lanka", "afghanistan"],
  Africa: ["africa", "sudan", "ethiopia", "kenya", "nigeria", "sahel", "congo"],
  "Latin America": ["brazil", "argentina", "venezuela", "chile", "colombia", "peru"],
  Global: ["un", "united nations", "g7", "g20", "imf", "world bank", "oecd", "opec"],
};

function cleanText(value: string | undefined) {
  if (!value) {
    return "";
  }

  return value.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function buildId(source: string, title: string, link: string) {
  const raw = `${source}:${title}:${link}`;
  return Buffer.from(raw).toString("base64url").slice(0, 18);
}

function ageHours(publishedAt: string) {
  const date = new Date(publishedAt);

  if (Number.isNaN(date.getTime())) {
    return 999;
  }

  return Math.max(0, (Date.now() - date.getTime()) / (1000 * 60 * 60));
}

function countMatches(text: string, phrases: string[]) {
  return phrases.reduce((count, phrase) => (text.includes(phrase) ? count + 1 : count), 0);
}

function detectCategories(text: string, defaults: NewsCategory[]) {
  const scores = {
    geopolitics: countMatches(text, categorySignals.geopolitics),
    economics: countMatches(text, categorySignals.economics),
    politics: countMatches(text, categorySignals.politics),
  };

  const categories = new Set<NewsCategory>(defaults);

  (Object.entries(scores) as [NewsCategory, number][]).forEach(([category, score]) => {
    if (score > 0) {
      categories.add(category);
    }
  });

  return {
    categories: Array.from(categories).sort((a, b) => scores[b] - scores[a]),
    scores,
  };
}

function detectRegion(text: string) {
  let bestLabel = "Cross-border";
  let bestScore = 0;

  for (const [label, keywords] of Object.entries(regionSignals)) {
    const score = countMatches(text, keywords);

    if (score > bestScore) {
      bestLabel = label;
      bestScore = score;
    }
  }

  return bestLabel;
}

function extractSignals(text: string, categories: NewsCategory[], regionLabel: string) {
  const detected = new Set<string>();

  categories.forEach((category) => {
    categorySignals[category].forEach((signal) => {
      if (text.includes(signal)) {
        detected.add(signal);
      }
    });
  });

  if (regionLabel !== "Cross-border") {
    detected.add(regionLabel);
  }

  return Array.from(detected).slice(0, 6);
}

function computeRelevance(
  publishedAt: string,
  categoryScores: Record<NewsCategory, number>,
  text: string,
  regionLabel: string,
) {
  const recencyBoost = Math.max(0, 36 - ageHours(publishedAt) * 0.5);
  const institutionalBoost =
    countMatches(text, [
      "nato",
      "g7",
      "g20",
      "united nations",
      "imf",
      "world bank",
      "opec",
      "eu",
      "fed",
      "ecb",
    ]) * 3;
  const crossBorderBoost = regionLabel === "Cross-border" ? 6 : 10;
  const categoryBoost =
    categoryScores.geopolitics * 7 + categoryScores.economics * 6 + categoryScores.politics * 6;

  return Math.min(100, Math.round(20 + recencyBoost + institutionalBoost + crossBorderBoost + categoryBoost));
}

function buildWhyItMatters(
  title: string,
  categories: NewsCategory[],
  regionLabel: string,
  signals: string[],
) {
  const primaryLens = categories[0] ?? "geopolitics";
  const regionPhrase =
    regionLabel === "Cross-border"
      ? "It appears to have broad international spillover."
      : `It is centered on ${regionLabel}, a region with clear cross-border knock-on effects.`;

  const lensPhrase =
    primaryLens === "geopolitics"
      ? "The story matters because it can shift alliances, conflict risk, sanctions, or strategic leverage between states."
      : primaryLens === "economics"
        ? "The story matters because it can move growth expectations, trade flows, inflation, energy prices, or markets."
        : "The story matters because domestic political decisions can rapidly alter policy, stability, and international positioning.";

  const signalPhrase =
    signals.length > 0
      ? `Key signals in the coverage include ${signals.slice(0, 3).join(", ")}, which raise the article's relevance score.`
      : `${title} was retained because it sits inside a high-impact policy and world affairs news cycle.`;

  return `${lensPhrase} ${regionPhrase} ${signalPhrase}`;
}

async function fetchFeed(feed: FeedConfig) {
  try {
    const response = await fetch(feed.url, {
      headers: {
        "user-agent": "GlobalNewsBriefing/1.0 (+https://github.com/angelclarosherrera376-source/Game)",
        accept: "application/rss+xml, application/xml, text/xml;q=0.9, */*;q=0.8",
      },
      next: { revalidate: 1800 },
    });

    if (!response.ok) {
      return [] as NewsStory[];
    }

    const xml = await response.text();
    const parsed = await parser.parseString(xml);

    return (parsed.items ?? [])
      .map((item) => {
        const title = cleanText(item.title);
        const description = cleanText(item.contentSnippet ?? item.summary ?? item.content);
        const link = item.link ?? feed.url;
        const publishedAt = item.isoDate ?? item.pubDate ?? new Date().toISOString();
        const combinedText = `${title} ${description}`.toLowerCase();
        const categoryResult = detectCategories(combinedText, feed.defaultCategories);
        const regionLabel = detectRegion(combinedText);
        const signals = extractSignals(combinedText, categoryResult.categories, regionLabel);
        const whyItMatters = buildWhyItMatters(title, categoryResult.categories, regionLabel, signals);
        const relevanceScore = computeRelevance(
          publishedAt,
          categoryResult.scores,
          combinedText,
          regionLabel,
        );

        return {
          id: buildId(feed.name, title, link),
          title,
          description: description || "Open the article for the full reporting context.",
          whyItMatters,
          source: feed.name,
          link,
          publishedAt,
          categories: categoryResult.categories,
          regionLabel,
          relevanceScore,
          signals,
        } satisfies NewsStory;
      })
      .filter((story) => Boolean(story.title));
  } catch {
    return [] as NewsStory[];
  }
}

function dedupeStories(stories: NewsStory[]) {
  const seen = new Set<string>();

  return stories.filter((story) => {
    const fingerprint = `${story.title.toLowerCase()}::${story.link}`;

    if (seen.has(fingerprint)) {
      return false;
    }

    seen.add(fingerprint);
    return true;
  });
}

function buildOverview(topStories: NewsStory[]) {
  if (topStories.length === 0) {
    return "Live feeds could not be loaded right now, so no briefing is available yet.";
  }

  const regions = Array.from(new Set(topStories.slice(0, 5).map((story) => story.regionLabel))).join(", ");
  const topSignals = Array.from(new Set(topStories.flatMap((story) => story.signals))).slice(0, 6).join(", ");

  return `The current briefing is dominated by stories tied to ${regions}. The highest-ranked articles cluster around ${topSignals}, suggesting that strategic rivalry, policy decisions, and market spillovers are driving today's global agenda.`;
}

function selectByCategory(stories: NewsStory[], category: NewsCategory) {
  return stories.filter((story) => story.categories.includes(category)).slice(0, 3);
}

export async function getNewsBriefing(): Promise<NewsBriefing> {
  const storiesByFeed = await Promise.all(feeds.map((feed) => fetchFeed(feed)));
  const allStories = dedupeStories(
    storiesByFeed
      .flat()
      .sort((left, right) => right.relevanceScore - left.relevanceScore)
      .slice(0, 18),
  );

  return {
    generatedAt: new Date().toISOString(),
    overview: buildOverview(allStories),
    totalStoriesConsidered: storiesByFeed.flat().length,
    sourcesScanned: feeds.length,
    topStories: allStories,
    byCategory: {
      geopolitics: selectByCategory(allStories, "geopolitics"),
      economics: selectByCategory(allStories, "economics"),
      politics: selectByCategory(allStories, "politics"),
    },
  };
}
