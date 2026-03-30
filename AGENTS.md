# AGENTS.md

## Cursor Cloud specific instructions

### Project overview
This is a browser-based Snake game built with TypeScript and Vite. It has a single service (the Vite dev server) and no external dependencies or databases.

### Running the application
- **Dev server**: `npm run dev` — starts Vite on port 3000 with HMR
- **Build**: `npm run build` — runs `tsc` then `vite build`, output in `dist/`

### Commands reference
| Task       | Command            |
|------------|--------------------|
| Dev server | `npm run dev`      |
| Lint       | `npm run lint`     |
| Test       | `npm test`         |
| Build      | `npm run build`    |

### Non-obvious notes
- The game logic in `src/game.ts` is pure (no DOM), making it easy to unit test. The renderer in `src/renderer.ts` handles all canvas drawing.
- Vitest runs with the default Node environment (no browser environment needed for game logic tests).
- ESLint uses the flat config format (`eslint.config.js`) with `typescript-eslint`.
