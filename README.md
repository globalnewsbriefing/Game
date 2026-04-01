# Global News Briefing

A Next.js app that pulls live world news feeds and ranks the most relevant stories across three lenses:

- geopolitics
- economics
- politics

The homepage turns raw headlines into a readable briefing by scoring articles for recency, cross-border significance, policy relevance, and market impact. Every story gets a generated explanation that answers **why it matters**.

## Features

- Scans multiple public RSS feeds for world, business, and politics coverage
- Scores stories with a transparent heuristic instead of a black-box ranking
- Tags each story by category and region
- Generates concise geopolitical/economic/political explanations
- Exposes the briefing as both a UI and a JSON API at `/api/news`
- Supports a server-side Polymarket CLI integration with a normalized JSON API at `/api/polymarket`

## Run locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

### Optional: enable the Polymarket CLI integration

The app can render a "Polymarket watch" section if you provide a CLI binary that prints market data as JSON.

Required environment variables:

- `POLYMARKET_CLI_BIN`: absolute or resolvable path to the CLI binary
- `POLYMARKET_CLI_ARGS_JSON`: JSON array of fixed string arguments passed to the CLI

Optional environment variables:

- `POLYMARKET_CLI_TIMEOUT_MS`: CLI timeout in milliseconds, capped at 30000
- `POLYMARKET_CLI_MARKET_LIMIT`: max number of rendered markets, capped at 24

Example:

```bash
export POLYMARKET_CLI_BIN=node
export POLYMARKET_CLI_ARGS_JSON='["./scripts/mock-polymarket-cli.mjs"]'
npm run dev
```

The CLI output can be either:

- a JSON array of market objects
- an object with a `markets` array
- an object with `data` or `data.markets`

Recognized fields include:

- question/title/name
- id/marketId/conditionId
- slug, url/link, status/state
- yesPrice, noPrice, volume, liquidity
- endDate/closeTime/resolutionDate
- outcomes/prices/tokens

## How ranking works

Each story is scored using:

1. **Recency**: newer stories rank higher.
2. **Category signals**: conflict, diplomacy, elections, trade, inflation, energy, markets, and similar keywords increase the relevant lens score.
3. **Institution and spillover signals**: mentions of bodies like NATO, G7, IMF, OPEC, or central banks raise the score.
4. **Regional impact**: stories with broad cross-border consequences receive an extra boost.

## Notes

- The app relies on publicly available RSS feeds.
- Explanations are generated from structured rules based on each article's title and summary.
- If a feed is temporarily unavailable, the app will continue showing stories from the remaining feeds.
