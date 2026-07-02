# Streaming Intelligence Demo

Next.js demo for TwelveLabs Jockey: metadata hydration, semantic search, personalized discovery, and FAST programming.

## Setup

```bash
cd app
npm install
npm run prepare-data   # sync-manifest + seed-cache
cp .env.example .env.local  # or auto-created from preprocessing/.env
npm run dev
```

## Scripts

- `npm run sync-manifest` — copy preprocessing snapshot to `data/demo-manifest.json`
- `npm run seed-cache` — generate Jockey response cache for instant demo paths
- `npm run warm-cache` — alias to seed-cache (live Jockey warming optional)
- `npm run test` — Playwright API + E2E suites

## Data

- `data/demo-manifest.json` — 18 assets, YouTube embed URLs, hydrated metadata
- `data/jockey-response-manifest.json` — index of cached Jockey responses
- `data/jockey-cache/` — per-store hydration, search, discover, program payloads
