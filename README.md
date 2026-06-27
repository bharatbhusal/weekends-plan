# weekends-plan

> Event aggregation platform that discovers, deduplicates, and displays tech/community events across India.

**Stack:** Next.js 14 (App Router) · TypeScript · MongoDB · Tailwind CSS · shadcn/ui

## Quick Start

```bash
npm install           # Install dependencies
cp .env.example .env  # Configure MONGODB_URI
npm run dev           # Start dev server on http://localhost:3000
```

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm run ingest` | Run event ingestion pipeline (fetches → dedup → upserts to MongoDB) |
| `npm run lint` | ESLint |

## Architecture

```
Workflows (GitHub Actions)      Vercel (Next.js)
       │                              │
       │ npm run ingest               │ SSR pages
       ▼                              ▼
   ┌──────────┐               ┌──────────────┐
   │ Ingestion│ ── upsert ──▶ │   MongoDB    │
   │ Pipeline │               │  (Atlas)     │
   └──────────┘               └──────────────┘
        │                           ▲
        │ POST /api/revalidate      │ getEvents()
        ▼                           │
   ┌──────────┐                     │
   │  ISR     │ ── revalidate ──────┘
   │  Cache   │
   └──────────┘
```

## Project Structure

```
app/                  Next.js App Router (pages, layouts, API routes)
components/           React components (cards, filters, UI primitives)
components/ui/        shadcn/ui primitives
config/               Source configuration (Luma, Meetup, FOSS, Eventbrite)
lib/                  Shared utilities (MongoDB client, date utils, city aliases, hashing)
services/ingestion/   Ingestion pipeline (clients, registry, orchestrator, location cleaner)
services/             Deduplication engine
types/                TypeScript interfaces
scripts/              CLI entry points (ingest.ts)
.github/workflows/    CI/CD (daily event sync)
```

## Documentation

| Document | Description |
|---|---|
| [docs/architecture.md](docs/architecture.md) | High-level design: system architecture, tech stack, deployment |
| [docs/data-model.md](docs/data-model.md) | Low-level design: schemas, types, interfaces |
| [docs/ingestion-pipeline.md](docs/ingestion-pipeline.md) | Ingestion flow: source clients → orchestrator → dedup → MongoDB |
| [docs/components.md](docs/components.md) | Frontend component tree, state management, filtering |
| [docs/user-journey.md](docs/user-journey.md) | User flow diagrams |

## License

MIT
