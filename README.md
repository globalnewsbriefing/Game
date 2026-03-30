# Global News Briefing

A news app that ranks and explains the most relevant stories across:

- geopolitics
- economics
- politics

The app pulls live world news feeds, scores each story for global significance, and explains why it matters.

## Features

- Scans multiple public RSS feeds for world, business, and politics coverage
- Scores stories with a transparent heuristic instead of a black-box ranking
- Tags each story by category and region
- Generates concise geopolitical, economic, and political explanations
- Exposes the briefing as both a desktop app and a JSON API at `/api/news`
- Can be packaged as an installable Linux desktop app

## Run as a web app

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Run as a desktop app during development

```bash
npm install
npm run desktop:dev
```

This starts Next.js locally and opens the Electron desktop shell automatically.

## Build a Linux installer

```bash
npm install
npm run desktop:dist
```

The generated installer files will be placed in:

```text
release/
```

Expected outputs include:

- `.AppImage`
- `.deb`

## Download an installer from GitHub

After the GitHub Actions workflow runs on this branch, downloadable Linux installer files will be available in the workflow artifacts:

1. Open the repository on GitHub.
2. Go to the **Actions** tab.
3. Open the latest **Build Linux installer** workflow run.
4. Download the **linux-installers** artifact.

The artifact contains:

- `Global News Briefing-1.0.0.AppImage`
- `global-news-briefing_1.0.0_amd64.deb`

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
- The Linux installer is produced with Electron Builder.
