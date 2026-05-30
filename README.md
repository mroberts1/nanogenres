# 100 Film Aesthetics

A catalog of 100 community-defined cinema aesthetics — hyper-specific, community-named categories that cut across traditional genre lines (mood, look, character type, cultural framing). Each entry's canonical films are computed from Letterboxd user lists: a film is "canonical" for an aesthetic if it recurs across many independent lists tagged with that phrase.

Live: SvelteKit + adapter-static, deployed to Vercel.

## Stack

- SvelteKit (Svelte 5) + adapter-static
- TypeScript
- d3-force, d3-geo for visualizations
- Letterboxd scraper: Playwright (`scrapers/scrape_nanogenre.py`)

## Develop

```sh
npm install
npm run dev
```

## Build

```sh
npm run build
```

Static output goes to `build/` and is served by Vercel.

## Data

- `src/lib/data/<slug>.json` — one file per aesthetic (canonical films, source lists, aggregates).
- `docs/visualizations/*.md` — usage guides embedded inline on each visualization page.
- `scrape_logs/` — per-aesthetic scrape transcripts.

## Re-scrape an aesthetic

```sh
.venv/bin/python scrapers/scrape_nanogenre.py "dreamcore" \
  --out-dir src/lib/data --max-lists 10
```
