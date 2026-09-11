# User Journey

## Overview

Weekends Plan is a public read-only event discovery app. Users browse, filter, and navigate to events. There is no authentication, no user accounts, and no booking flow — all actions redirect to the respective source platform.

## Primary User Flow

```mermaid
flowchart TD
    A[User visits<br/>weekendsplan.bharatbhusal.com] --> B[Page loads via SSR]
    B --> C[Server fetches all events<br/>from MongoDB]
    C --> D{Events found?}
    D -->|Yes| E[Render HomePageClient<br/>with initial events]
    D -->|No| F["Render EmptyState<br/>'No events yet'"]
    E --> G[User sees events grouped<br/>by timeframe sections]
    F --> G

    G --> H{User action}

    H -->|Filter by source| K[Select source<br/>from dropdown]
    K --> L[Events filtered by source]
    L --> H

    H -->|Filter by city| M[Select city<br/>from dropdown]
    M --> N[Events filtered by city]
    N --> H

    H -->|Toggle view| O[Switch grid/list layout]
    O --> H

    H -->|Navigate sections| P["Click 'This Week'<br/>'This Month' tab"]
    P --> Q[Scroll to section]
    Q --> H

    H -->|Click event card| R[Open event details<br/>in card expand]
    R --> S{User wants to attend?}

    S -->|Yes| T["Click 'Get Tickets'<br/>or external link"]
    T --> U[Redirect to original<br/>source platform<br/>Luma / Meetup / FOSS]

    S -->|No| H
```

## User Flow Diagram (Simplified)

```mermaid
flowchart LR
    LAND[Landing Page] -->|Browse| SECTION[Timeline Sections]
    LAND -->|Filter| FILTER[Filter by Source/City]
    SECTION -->|Click| CARD[Event Card]
    FILTER -->|Results| CARD
    CARD -->|"Get Tickets"| EXT[External Source]
```

## States

### Landing Page (Events Available)

```
┌──────────────────────────────────────────────────┐
│  ☀ Weekends Plan                  [▼ Source] [▼ City] │
│                                                     │
│                                                     │
│  ● Live (2)                                         │
│  ┌──────────┐ ┌──────────┐                          │
│  │ Event A  │ │ Event B  │                          │
│  │ [Badge]  │ │ [Badge]  │                          │
│  │ Today 5pm│ │ Today 7pm│                          │
│  └──────────┘ └──────────┘                          │
│                                                     │
│  ● This Week (8)                                    │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐            │
│  │ Event C  │ │ Event D  │ │ Event E  │            │
│  └──────────┘ └──────────┘ └──────────┘            │
│                                                     │
│  ● June 2026 (12)                                   │
│  ┌──────────┐ ┌──────────┐                          │
│  │ Event F  │ │ Event G  │                          │
│  └──────────┘ └──────────┘                          │
└──────────────────────────────────────────────────┘
```

### Empty State (No Events)

```
┌──────────────────────────────────────────────────┐
│                                                     │
│                                                     │
│              📅 No events found                     │
│         Try adjusting your filters                  │
│                                                     │
│              [Clear Filters]                        │
│                                                     │
│                                                     │
└──────────────────────────────────────────────────┘
```

### Loading State

```
┌──────────────────────────────────────────────────┐
│  ┌─────────────────────────────────────────────┐  │
│  │ ████████░░░░░░░░░░░░░░░░░░░░                │  │
│  └─────────────────────────────────────────────┘  │
│                                                     │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐         │
│  │ ████████ │  │ ████████ │  │ ████████ │         │
│  │ ██░░░░░░ │  │ ██░░░░░░ │  │ ██░░░░░░ │         │
│  │ ██░░░░░░ │  │ ██░░░░░░ │  │ ██░░░░░░ │         │
│  └──────────┘  └──────────┘  └──────────┘         │
└──────────────────────────────────────────────────┘
```

## Event Card Interaction

```mermaid
flowchart TD
    A[Event Card] --> B[Shows: image, title,<br/>badge, date, location]
    B --> C{User clicks?}

    C -->|Card body| D[Card expands/event detail]
    D --> E[Shows: full description<br/>markdown rendered,<br/>date range, address]
    E --> F{User clicks<br/>""Get Tickets""?}

    C -->|"Get Tickets" button| G[Open originalUrl<br/>in new tab]

    F -->|Yes| G
    F -->|No| H[Continue browsing]
```

## Responsive Behavior

| Breakpoint          | Layout                          |
| ------------------- | ------------------------------- |
| Desktop (>1024px)   | 3-column grid for default cards |
| Tablet (768–1024px) | 2-column grid                   |
| Mobile (<768px)     | 1-column grid                   |
| List view (all)     | 2-column horizontal rows        |

## Error Scenarios

| Scenario                 | Handling                                                               |
| ------------------------ | ---------------------------------------------------------------------- |
| MongoDB unreachable      | `getEvents` catches error, returns empty array → EmptyState shown      |
| Ingestion pipeline fails | GitHub Actions logs error, no data update until next run               |
| Source API down          | Individual source marked as failed in `sourceResults`, others continue |
| ISR revalidation fails   | Events are stale until next successful revalidation or manual trigger  |
