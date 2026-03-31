# Polymarket CLI Workspace

A Next.js app that turns the upstream [Polymarket CLI](https://github.com/Polymarket/polymarket-cli) README into a browsable workspace for terminal users, scripts, and agents.

It focuses on the workflows you asked for:

- leaderboards
- browsing markets and events
- placing orders
- managing positions
- interacting with onchain contracts

The homepage also includes Kalshi-style prompt recipes so an agent can translate natural-language requests into the exact Polymarket CLI commands and JSON-mode variants.

## Features

- Summarizes the Polymarket CLI command surface in a terminal-first UI
- Groups commands by capability: data, markets, prices, trading, portfolio, and onchain flows
- Highlights when a wallet is required vs. when a command is read-only
- Includes prompt recipes similar to Kalshi research/trading prompts
- Exposes the same structured data as JSON at `/api/polymarket`

## Run locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## JSON API

The app exposes a machine-readable Polymarket workspace payload at:

```bash
curl http://localhost:3000/api/polymarket
```

That payload includes:

- install commands
- quick-start commands
- capability sections
- prompt recipes
- workflow snippets

## Notes

- The content is derived from the public Polymarket CLI README.
- The Polymarket project describes the CLI as early, experimental software; verify transactions before signing.
- This app is a guide/workspace layer and does not execute trades itself.
