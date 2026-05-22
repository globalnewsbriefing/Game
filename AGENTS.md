# AGENTS.md

## Cursor Cloud specific instructions

This is a **Next.js 16** app ("Global News Briefing") with no database, no environment variables, and no Docker. The single service serves both the UI and a JSON API.

### Quick reference

| Action | Command |
|--------|---------|
| Install deps | `npm install` |
| Dev server | `npm run dev` (port 3000) |
| Lint | `npm run lint` |
| Build | `npm run build` |
| Prod server | `npm run start` (port 3000, after build) |

### Notes

- The app fetches live RSS feeds (BBC, NYT, DW) at request time. Outbound HTTPS must be available for stories to appear; the app degrades gracefully if feeds are unreachable.
- There is no test suite in the repo. Verification is done via lint, build, and manual testing.
- The homepage (`/`) is a server component with `force-dynamic`; it re-fetches feeds on every request in dev mode.
- The JSON API is at `GET /api/news` (also `force-dynamic`).
- No `.env` file is needed.
