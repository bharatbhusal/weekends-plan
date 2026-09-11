# Frontend Components — Low-Level Design

## Page Structure

```mermaid
graph TB
    subgraph "Server Components (RSC)"
        ROOT[app/layout.tsx<br/>ThemeProvider, fonts, globals.css]
        HOME[app/page.tsx<br/>getEvents municipal_events]
        OTHER[app/others/page.tsx<br/>getEvents other_events]
    end

    subgraph "Client Components"
        HPC[HomePageClient<br/>State: filters, pagination, view]
        FILTERS[EventFilters<br/> source, city, view toggle]
        GRID[EventGrid<br/>grid/list variant]
        CARD[EventCard<br/>default/compact variant]
        EMPTY[EmptyState]
        SKEL[LoadingSkeleton]
        THEME[ThemeToggle<br/>dark/light mode]
    end

    ROOT --> HOME
    ROOT --> OTHER
    HOME -->|initialEvents, sources, cities| HPC
    OTHER -->|initialEvents, sources, cities| HPC
    HPC --> THEME
    HPC --> FILTERS
    HPC --> GRID
    GRID --> CARD
    HPC --> EMPTY
    HPC --> SKEL
```

### Server Components

| File                  | Route     | Function                                                                             |
| --------------------- | --------- | ------------------------------------------------------------------------------------ |
| `app/page.tsx`        | `/`       | Fetches `municipal_events`, extracts unique sources/cities, renders `HomePageClient` |
| `app/others/page.tsx` | `/others` | Same flow for `other_events` collection                                              |
| `app/layout.tsx`      | all       | Root layout with Inter font, `ThemeProvider` (default dark), globals                 |

Both pages use `export const dynamic = "force-dynamic"` to skip static generation.

## HomePageClient State Management

```typescript
// Core state tracked in HomePageClient (~355 lines)
interface HomePageState {
  selectedSources: string[]; // Multi-select source filter
  selectedCities: string[]; // Multi-select city filter
  viewMode: "grid" | "list"; // Display layout toggle
}
```

### Event Sectioning Logic

Events are grouped into time-based sections:

```mermaid
flowchart TD
    A[All events sorted by startDateTime] --> B{Is event ongoing?<br/>now between start and end}
    B -->|Yes| C["Live"]
    B -->|No| D{Is start today?}
    D -->|Yes| E["Today"]
    D -->|No| F{Is start tomorrow?}
    F -->|Yes| G["Tomorrow"]
    F -->|No| H{Is start within next 7 days?}
    H -->|Yes| I["This Week"]
    H -->|No| J{Is start within this month?}
    J -->|Yes| K["This Month"]
    J -->|No| L["Month Year"<br/>e.g. ""July 2026""]
```

Implemented via `getSection(date, now, endDate?)` in `lib/date-utils.ts`.

### Pagination

Events are paginated by section:

```mermaid
flowchart LR
    A[Sectioned events] --> B{Which page?}
    B -->|"Upcoming"| C[Live + Today + Tomorrow<br/>combined]
    B -->|"This Week"| D[This Week events]
    B -->|"This Month"| E[This Month events]
    B -->|Per month tabs| F[Future months<br/>each as a tab]
```

When switching sections, the view scrolls to the corresponding event section.

## Component Tree

### EventCard Variants

| Variant    | Use                  | Layout                                                                                         |
| ---------- | -------------------- | ---------------------------------------------------------------------------------------------- |
| `default`  | Grid view            | Vertical card with image, badge, title, description (truncated), location, date, action button |
| `compact`  | List view            | Horizontal row with icon, title, date, location, action button                                 |
| `featured` | Defined but not used | Larger hero-style card                                                                         |

### EventFilters Controls

| Control         | Type                   | Behavior                                        |
| --------------- | ---------------------- | ----------------------------------------------- |
| Source dropdown | Single-select dropdown | Filters by source (Luma/Meetup/FOSS/Eventbrite) |
| City dropdown   | Single-select dropdown | Filters by canonical city                       |
| View toggle     | Icon buttons           | Switches grid/list layout                       |
| Clear all       | Button                 | Resets all filters                              |

## UI Primitives (shadcn/ui)

| Component      | Source                        | Customizations                                                                        |
| -------------- | ----------------------------- | ------------------------------------------------------------------------------------- |
| `Badge`        | @radix-ui + CVA               | Source-specific color variants (luma=blue, foss=green, meetup=orange, eventbrite=red) |
| `Button`       | CVA                           | Multiple size/variant combinations                                                    |
| `Card`         | Compound component            | CardHeader, CardTitle, CardDescription, CardContent, CardFooter                       |
| `DropdownMenu` | @radix-ui/react-dropdown-menu | Full implementation with trigger, content, items, separators                          |
| `Input`        | Styled input                  | Standard styling                                                                      |
| `Skeleton`     | Animated div                  | Pulse animation for loading states                                                    |

## Theme

- **Provider:** `next-themes` wrapping the root layout
- **Mode:** `"class"` strategy (Tailwind dark mode via class toggle)
- **Default:** `dark`
- **Toggle:** `ThemeToggle` component with Sun/Moon icons

## Styling Conventions

- Classes combined via `cn()` utility (`clsx` + `tailwind-merge`)
- CSS variables for light/dark color tokens in `app/globals.css`
- Custom `blink` animation defined in `tailwind.config.ts`
- Dates formatted with `en-IN` locale (e.g., "Sat, 27 Jun, 02:30 PM")
