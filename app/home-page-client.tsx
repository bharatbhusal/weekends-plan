'use client';

import { useState, useMemo } from 'react';
import { NormalizedEvent } from '@/types/event';
import { EventGrid } from '@/components/event-grid';
import { EventFilters, SortState } from '@/components/event-filters';
import { LoadingSkeleton } from '@/components/loading-skeleton';
import { EmptyState } from '@/components/empty-state';
import { ThemeToggle } from '@/components/theme-toggle';
import { CalendarDays } from 'lucide-react';
import { getSection, isStaticSection, SECTION_ORDER } from '@/lib/date-utils';

interface HomePageClientProps {
  initialEvents: NormalizedEvent[];
  initialSources: string[];
  initialCities: string[];
}

export function HomePageClient({
  initialEvents,
  initialSources,
  initialCities,
}: HomePageClientProps) {
  const [filters, setFilters] = useState({
    search: '',
    sources: [] as string[],
    cities: [] as string[],
  });
  const [sort, setSort] = useState<SortState>({ field: 'date', order: 'asc' });
  const [view, setView] = useState<'grid' | 'list'>('grid');

  const filteredEvents = useMemo(() => {
    let result = initialEvents.filter((event) => {
      if (filters.search) {
        const q = filters.search.toLowerCase();
        const matchesSearch =
          event.title.toLowerCase().includes(q) ||
          event.description.toLowerCase().includes(q) ||
          event.location.name.toLowerCase().includes(q) ||
          (event.location.city || '').toLowerCase().includes(q);
        if (!matchesSearch) return false;
      }

      if (filters.sources.length > 0 && !filters.sources.includes(event.sourceName)) {
        return false;
      }

      if (
        filters.cities.length > 0 &&
        !filters.cities.includes(event.location.city || '')
      ) {
        return false;
      }

      return true;
    });

    result.sort((a, b) => {
      let cmp = 0;
      if (sort.field === 'date') {
        cmp = new Date(a.startDateTime).getTime() - new Date(b.startDateTime).getTime();
      } else if (sort.field === 'city') {
        cmp = (a.location.city || '').localeCompare(b.location.city || '');
      } else if (sort.field === 'location') {
        cmp = a.location.name.localeCompare(b.location.name);
      }
      return sort.order === 'asc' ? cmp : -cmp;
    });

    return result;
  }, [initialEvents, filters, sort]);

  const sections = useMemo(() => {
    const now = new Date();
    const map = new Map<string, NormalizedEvent[]>();
    const staticKeys: string[] = [];

    for (const event of filteredEvents) {
      const section = getSection(new Date(event.startDateTime), now);
      let list = map.get(section.key);
      if (!list) {
        list = [];
        map.set(section.key, list);
        if (isStaticSection(section.key)) {
          staticKeys.push(section.key);
        }
      }
      list.push(event);
    }

    const ordered: { label: string; key: string; events: NormalizedEvent[] }[] = [];
    const seenStatic = new Set(staticKeys);

    for (const key of SECTION_ORDER) {
      if (map.has(key)) {
        const events = map.get(key)!;
        const label = getSection(new Date(events[0].startDateTime), now).label;
        ordered.push({ label, key, events });
      }
    }

    for (const [key, events] of map) {
      if (!seenStatic.has(key)) {
        const label = getSection(new Date(events[0].startDateTime), now).label;
        ordered.push({ label, key, events });
      }
    }

    return ordered;
  }, [filteredEvents]);

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-4 sm:px-6 lg:px-8 h-16">
          <div className="flex items-center gap-3">
            <CalendarDays className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-bold tracking-tight">Weekends Plan</h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground hidden sm:inline">
              {initialEvents.length} events across India
            </span>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <EventFilters
          sources={initialSources}
          cities={initialCities}
          filters={filters}
          onFiltersChange={setFilters}
          sort={sort}
          onSortChange={setSort}
          view={view}
          onViewChange={setView}
        />

        <div className="mt-6">
          {initialEvents.length === 0 ? (
            <LoadingSkeleton view={view} count={8} />
          ) : filteredEvents.length === 0 ? (
            <EmptyState
              title="No matching events"
              description="Try changing your filters or search terms."
              actionLabel="Clear filters"
              onAction={() => setFilters({ search: '', sources: [], cities: [] })}
            />
          ) : (
            <div className="space-y-10">
              <p className="text-sm text-muted-foreground">
                Showing {filteredEvents.length} of {initialEvents.length} events
              </p>
              {sections.map((section) => (
                <section key={section.key}>
                  <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <span className="bg-primary/10 text-primary text-xs font-medium px-2.5 py-0.5 rounded-full">
                      {section.events.length}
                    </span>
                    {section.label}
                  </h2>
                  <EventGrid events={section.events} view={view} />
                </section>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
