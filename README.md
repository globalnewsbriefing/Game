# Global News Briefing

A public website that ranks and explains the most relevant world stories across:

- geopolitics
- economics
- politics

The site pulls major public news feeds, scores stories for global significance, and explains why each one matters.

## Features

- Aggregates world, business, and politics coverage from public RSS feeds
- Scores stories with a transparent heuristic instead of a black-box ranking
- Tags each story by category and region
- Generates concise geopolitical, economic, and political explanations
- Builds as a static website for GitHub Pages
- Can still run locally in development with Next.js

## Run locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Build the static website

```bash
npm install
npm run build:static
```

The generated static site is written to:

```text
out/
```

## Public deployment

The repository now includes a GitHub Pages workflow that:

1. generates a fresh news snapshot
2. builds the static site
3. deploys it to GitHub Pages

Once GitHub Pages is enabled for the repository, the site can be published publicly from the Actions workflow.

## How ranking works

Each story is scored using:

1. **Recency**: newer stories rank higher.
2. **Category signals**: conflict, diplomacy, elections, trade, inflation, energy, and market-related keywords increase relevance.
3. **Institution and spillover signals**: mentions of bodies like NATO, G7, IMF, OPEC, or central banks raise the score.
4. **Regional impact**: stories with broad cross-border consequences receive an extra boost.

## Notes

- The site relies on publicly available RSS feeds.
- Static deployments use a generated news snapshot created at build time.
- If a feed is temporarily unavailable, the build will still publish whatever stories were successfully gathered.
