# AGENTS.md

## Cursor Cloud specific instructions

This is a **Next.js 16** (App Router, React 19, TypeScript) single-service application with **no external dependencies** — no database, Docker, environment variables, or API keys.

### Quick reference

| Action | Command |
|--------|---------|
| Install deps | `npm install` |
| Dev server | `npm run dev` (port 3000) |
| Lint | `npm run lint` |
| Build | `npm run build` |

### Notes

- The app fetches live RSS feeds (BBC, NYT, DW) at runtime. If network access is unavailable, the app still starts but shows a "feeds could not be loaded" state.
- There are no automated tests in this project; validation is done via lint, build, and manual verification of the UI and `/api/news` JSON endpoint.
- The dev server supports hot reload — code changes are reflected immediately without restart.
