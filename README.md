# Kalshi BTC 15-Min Signal

A Next.js dashboard that watches the active Kalshi `KXBTC15M` Bitcoin up/down market and turns live market data into a fast trading checklist.

## Features

- Pulls the active Kalshi 15-minute BTC market from the public market data API
- Uses Coinbase BTC-USD spot and one-minute candles as a live proxy feed
- Estimates fair Up/Down odds from target distance, time left, short-term volatility, and momentum
- Shows a clear `Bet Up`, `Bet Down`, or `Pass` recommendation with edge and stake guidance
- Exposes the live signal as JSON at `/api/btc-signal`

## Run locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## How the signal works

The signal is intentionally conservative:

1. It reads the active Kalshi market target, bid/ask prices, volume, and close time.
2. It compares BTC spot to the target and estimates the likely move into close from recent one-minute candles.
3. It converts that into a fair Up probability and compares fair value to the current buy prices.
4. It only recommends a side when the estimated edge clears 5 cents and basic liquidity/timing filters pass.

## Notes

- Coinbase spot is not the settlement source; Kalshi resolves against CF Benchmarks BRTI.
- The dashboard is a decision aid, not a guarantee or financial advice.
- Keep position sizing small and avoid martingale behavior.
