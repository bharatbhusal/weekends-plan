# Screenshots

Visual walkthrough of Weekends Plan. The app runs as a single page
(`http://localhost:3000`) with two interchangeable views: **Card view**
(grouped event cards) and **Calendar view** (month grid). Both are reachable
via the toggle in the filter bar (grid icon = Card, calendar icon = Calendar).

Each view is shown in two viewports: laptop (1280×800) and mobile (390×844).

## Card View (Laptop)

![Card view — laptop](/public/assets/home.png)

- **How to get there:** Default landing state, or click the grid toggle in the
  filter bar.
- **What it shows:** Events grouped into timeframes (Live, Today, Tomorrow,
  This Week, This Month) as a responsive card grid. Each card shows the source
  badge, title, date/time, location, and a "View" link to the original source.

## Calendar View (Laptop)

![Calendar view — laptop](/public/assets/home-calendar.png)

- **How to get there:** Click the calendar toggle in the filter bar.
- **What it shows:** A month grid where days with events are highlighted. Use
  the Previous/Next buttons to move between months. Tap a day to open its event
  list in a drawer.

## Card View (Mobile)

![Card view — mobile](/public/assets/home-mobile.png)

- **How to get there:** Open the site on a narrow viewport; same grid toggle.
- **What it shows:** The card grid collapses to a single column; filters wrap
  and the search field stretches full width.

## Calendar View (Mobile)

![Calendar view — mobile](/public/assets/home-mobile-calendar.png)

- **How to get there:** Calendar toggle on a mobile viewport.
- **What it shows:** The month grid scales to fit the screen; tap a day to
  reveal its events in a bottom drawer.

## Tips

- **Theme toggle:** Top-right header button switches light/dark.
- **Filters:** Source, city, and event-type (In-Person/Online) dropdowns, plus
  free-text search, narrow both views.
- **Watchlist:** The watch (eye) button on any card pins it to the top
  "Watchlist" section, persisted in `localStorage`.
