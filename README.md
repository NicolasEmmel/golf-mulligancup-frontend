# Golf Tournament Live Scoring — Frontend

Next.js (App Router) frontend for the [golf-mulligancup-backend](https://github.com/NicolasEmmel/golf-mulligancup-backend) live scoring API.

## Status

**Design system + core UX implemented** from Flutter reference `livescoringfrontendv1` (visual only):

- Fairway radial background, mint cards, primary green `#2E7D32`
- Name-based scoring registration (replaces QR)
- Live leaderboard + display mode via SignalR
- Full admin area (players, flights, tournament)

See `docs/DESIGN_GUIDELINES.md` and `docs/BACKEND_CONTRACT.md`.

## Local development

```bash
cp .env.example .env.local
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Dev server |
| `npm run build` | Production build |
| `npm run lint` | ESLint |
| `npm run format` | Prettier write |
| `npm test` | Vitest unit tests |
| `npm run test:e2e` | Playwright |

## Backend integration

- Contract: [`docs/BACKEND_CONTRACT.md`](docs/BACKEND_CONTRACT.md)
- Types: [`models/tournament.ts`](models/tournament.ts)
- Hub events: [`services/signalr/events.ts`](services/signalr/events.ts)

Production backend: `https://golf-tournament-backend.fly.dev` (existing Fly app + Redis)

## Deployment (GitHub Pages)

The site is published to the same public URL as the old Flutter app:

**https://www.livescoringkitzingen.de/**

- Static export (`output: "export"`) via `.github/workflows/deploy-pages.yml`
- Custom domain `www.livescoringkitzingen.de` (also covers `livescoringkitzingen.de` in DNS/certs)
- Every push to `main` rebuilds and deploys

The repository must remain **public** for GitHub Pages on a free personal account.

## Routes

| Path | Purpose |
|------|---------|
| `/` | Home / navigation |
| `/leaderboard` | Public leaderboard |
| `/scoring` | Mobile score entry |
| `/display` | Large-screen display |
| `/admin` | Administration hub |
| `/admin/players` | Player management |
| `/admin/flights` | Flights |
| `/admin/tournament` | Tournament day / reset |

## License

MIT (add `LICENSE` when publishing the repository).
