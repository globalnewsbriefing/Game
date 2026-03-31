# Polymarket Live Workspace

A private Next.js app that pulls live public data from Polymarket and presents it as a browser workspace for terminal users, scripts, and agents.

It covers the flows you asked for:

- live leaderboards
- browsing active markets and politics events
- inspecting live order-book data
- viewing public wallet positions and value
- showing terminal workflows for placing orders and onchain actions

The homepage also includes Kalshi-style prompt recipes so an agent can move from natural-language requests into live public data plus exact Polymarket CLI actions where authentication is required.

## Features

- Fetches the live monthly trader leaderboard from Polymarket's public Data API
- Shows active high-volume markets from the Gamma API
- Shows active politics events from the Gamma API
- Pulls a live CLOB midpoint, spread, and top-of-book snapshot for the top market
- Supports public wallet lookup with `?wallet=0x...` for positions and total value
- Exposes the same live workspace payload as JSON at `/api/polymarket`
- Keeps authenticated order placement and onchain actions explicit as terminal workflows

## Run locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Private access

The app is protected by a login gate. Set these environment variables before starting it:

```bash
SITE_ACCESS_USERNAME=your-username
SITE_ACCESS_PASSWORD=your-password
SITE_ACCESS_SECRET=a-long-random-secret
```

Then visit:

```bash
http://localhost:3000/login
```

Anonymous users are redirected to the login page for the UI, and unauthenticated API requests receive `401 Unauthorized`.

## Live wallet lookup

You can inspect a public wallet by adding a query parameter:

```bash
http://localhost:3000/?wallet=0x492442eab586f242b53bda933fd5de859c8a3782
```

The API supports the same parameter:

```bash
curl "http://localhost:3000/api/polymarket?wallet=0x492442eab586f242b53bda933fd5de859c8a3782"
```

## Data sources

This app reads from Polymarket's public endpoints:

- `https://data-api.polymarket.com/v1/leaderboard`
- `https://data-api.polymarket.com/positions`
- `https://data-api.polymarket.com/value`
- `https://gamma-api.polymarket.com/markets`
- `https://gamma-api.polymarket.com/events`
- `https://clob.polymarket.com/midpoint`
- `https://clob.polymarket.com/spread`
- `https://clob.polymarket.com/book`

## Notes

- Trading and onchain write actions still require your own wallet and explicit approvals.
- Public wallet data availability depends on what Polymarket exposes through its public APIs.
- Verify transactions before signing anything with the real CLI or wallet.
- Keep your login credentials and session secret out of version control.
