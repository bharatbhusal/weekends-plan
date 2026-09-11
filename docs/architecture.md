# Architecture — High-Level Design

## System Overview

Weekends Plan is a server-rendered Next.js application that aggregates tech events from multiple platforms (Luma, Meetup, FOSS United, Eventbrite) into a unified, filterable feed. Events are ingested via a scheduled GitHub Actions pipeline, stored in MongoDB Atlas, and served via Next.js App Router with Incremental Static Regeneration (ISR).

## Tech Stack

| Layer         | Technology                   | Purpose                              |
| ------------- | ---------------------------- | ------------------------------------ |
| **Framework** | Next.js 14 (App Router)      | SSR, ISR, API routes                 |
| **Language**  | TypeScript 5.4               | Type safety across stack             |
| **Styling**   | Tailwind CSS 3.4 + shadcn/ui | Utility-first CSS + Radix primitives |
| **Database**  | MongoDB 6.5 (Atlas)          | Event storage                        |
| **CI/CD**     | GitHub Actions               | Daily event ingestion                |
| **Hosting**   | Vercel                       | Production deployment                |
| **Icons**     | lucide-react                 | UI icons                             |
| **Theme**     | next-themes                  | Dark/light mode                      |

## System Architecture Diagram

```mermaid
graph TB
    subgraph "Data Sources"
        LUMA[Luma API]
        MEETUP[Meetup.com Scrape]
        FOSS[FOSS United RSS]
        EVB[Eventbrite Scrape]
    end

    subgraph "GitHub Actions (Scheduled)"
        INGEST[Ingestion Pipeline<br/>scripts/ingest.ts]
        REVAL[ISR Revalidation<br/>POST /api/revalidate]
    end

    subgraph "Vercel (Next.js)"
        SRV[Server Components<br/>app/page.tsx]
        API[API Routes<br/>app/api/revalidate]
        CLIENT[Client Components<br/>home-page-client.tsx]
    end

    subgraph "MongoDB Atlas"
        DB[(events_db<br/>municipal_events)]
    end

    LUMA -->|paginated API| INGEST
    MEETUP -->|__NEXT_DATA__ scrape| INGEST
    FOSS -->|RSS feed| INGEST
    EVB -->|JSON-LD scrape| INGEST

    INGEST -->|dedup + upsert| DB
    INGEST -->|trigger| REVAL
    REVAL -->|POST| API
    API -->|revalidatePath| SRV
    SRV -->|getEvents| DB
    SRV -->|props| CLIENT
```

## Component Architecture

```mermaid
graph TB
    subgraph "Server (RSC)"
        PAGE[page.tsx<br/>getEvents]
        OTHER[others/page.tsx<br/>getEvents]
    end

    subgraph "Client"
        HPC[HomePageClient<br/>state: filters, view, pagination]
        FILTERS[EventFilters<br/> source, city, view]
        GRID[EventGrid<br/>grid/list layout]
        CARD[EventCard<br/>default/compact/featured]
        EMPTY[EmptyState]
        SKEL[LoadingSkeleton]
    end

    PAGE -->|initialEvents| HPC
    OTHER -->|initialEvents| HPC
    HPC --> FILTERS
    HPC --> GRID
    GRID --> CARD
    HPC --> EMPTY
    HPC --> SKEL
```

## Data Flow

```mermaid
flowchart LR
    A[Event Sources] -->|fetch| B(Ingestion Pipeline)
    B -->|normalize| C{runIngestionPipeline}
    C -->|city normalization| D[generalizeCity]
    C -->|Jaccard dedup| E[deduplicate]
    E -->|bulk upsert| F[(MongoDB)]
    F -->|SSR query| G(Server Components)
    G -->|serialize| H(Client Components)
    H -->|render| I[User Browser]
```

## Deployment Architecture

```mermaid
flowchart TD
    DEV[Developer] -->|git push| GH[GitHub]
    GH -->|Vercel deploy| PROD[Vercel Production]
    GH -->|schedule 14:30 UTC| GA[GitHub Actions]
    GA -->|npm run ingest| INGEST_SCRIPT[Ingestion Pipeline]
    INGEST_SCRIPT -->|upsert| ATLAS[(MongoDB Atlas)]
    INGEST_SCRIPT -->|POST /api/revalidate| VERCEL_API[Vercel API Route]
    VERCEL_API -->|revalidatePath| CACHE[ISR Cache]
    USER[User] -->|visits| PROD
    PROD -->|getEvents| ATLAS
```

## Key Design Decisions

1. **SSR over SSG** — Pages use `force-dynamic` because event data changes daily. ISR revalidation via API route after each ingestion run.
2. **No authentication** — Public read-only app. Ingestion runs via GitHub Actions with environment secrets.
3. **Deterministic IDs** — `makeEventId(source, originalId)` produces SHA-256 hex keys, enabling idempotent upserts.
4. **Split collections** — `municipal_events` for Indian tech events, `other_events` for everything else (currently all events go to the first collection).
