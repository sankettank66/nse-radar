# NSE Sectorial Dashboard

Interactive dashboard for NSE (National Stock Exchange of India) sectorial indices with drill-down, live ticker, F&O analysis, and dark mode.

## Features

- **Live Index Ticker** — Real-time NIFTY 50 and BANKNIFTY prices via WebSocket with auto-reconnect
- **Sectorial Indices Table** — Sortable grid with current value, % change, open, high, low, 52-week range
- **Analytics Panel** — Market breadth, top gainers/losers, top OI spurts
- **Performance Charts** — Bar charts for sectors and individual stocks with semantic green/red coloring
- **Drill-Down** — Click any sector to view its constituent stocks in a side sheet
- **OI Spurts** — Full table of 200+ entries with OI change and volume data, sortable by any column
- **F&O Analysis** — CE/PE scoring by momentum and volume for stocks in the selected sector
- **Dark Mode** — Full dark theme with localStorage persistence and inline flash prevention
- **Auto-Refresh** — Data refreshes every 60 seconds; manual refresh available

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| UI | shadcn/ui, Tailwind CSS v4 |
| Charts | Recharts |
| Data Fetching | Built-in hooks with periodic refresh |
| Live Data | Browser WebSocket with auto-reconnect |

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Architecture

### API Proxy

All NSE API calls go through `/api/nse/[...path]` route handler to avoid CORS issues. The proxy sets the required `User-Agent` and `Referer` headers before forwarding requests to `https://www.nseindia.com/api/...`.

### Data Flow

1. **Sector / OI data** — REST API calls via fetch, cached in React state, auto-refreshed every 60s
2. **Stock data** — Fetched on demand when a sector is selected for drill-down
3. **Live index quotes** — Browser WebSocket connections to NSE streamer (`wss://streamer.nseindia.com/streams/indices/high/...`)
4. **Theme** — Toggled via button, persisted in `localStorage`, applied before hydration via inline script

### Project Structure

```
src/
├── app/
│   ├── api/nse/[...path]/route.ts   — NSE API proxy
│   ├── globals.css                   — Theme tokens (light + dark)
│   ├── layout.tsx                    — Fonts, theme script
│   └── page.tsx                      — Main dashboard layout
├── components/
│   ├── ui/                           — shadcn/ui components
│   ├── sector-grid.tsx               — Sector indices table
│   ├── sector-drilldown.tsx          — Stock drill-down sheet
│   ├── analytics.tsx                 — Market overview panel
│   ├── performance-charts.tsx        — Bar charts
│   ├── oi-spurts.tsx                 — OI data table
│   ├── fno-analysis.tsx              — CE/PE analysis
│   ├── live-ticker.tsx               — Live index ticker
│   └── theme-toggle.tsx              — Dark mode switch
├── hooks/
│   ├── use-nse-data.ts               — Sector/OI data fetching
│   ├── use-index-ws.ts               — WebSocket connections
│   └── use-sort.ts                   — Generic table sorting
└── lib/
    ├── api.ts                        — API service layer
    ├── types.ts                      — TypeScript interfaces
    └── utils.ts                      — cn() helper
```

### Design System

- **Fonts**: Inter (sans) + JetBrains Mono (tabular numbers)
- **Primary**: `#0052ff` — Coinbase blue
- **Semantic**: Green (`#05b169`) / Red (`#cf202f`)
- **Components**: Pill buttons (100px radius), border-based cards, no shadows
- **Responsive**: Stack layout on mobile, side-by-side on desktop

## Build

```bash
npm run build
npm start
```
