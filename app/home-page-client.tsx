'use client';

import { useState, useMemo } from 'react';
import { NormalizedEvent } from '@/types/event';
import { EventGrid } from '@/components/event-grid';
import { EventFilters } from '@/components/event-filters';
import { LoadingSkeleton } from '@/components/loading-skeleton';
import { EmptyState } from '@/components/empty-state';
import { ThemeToggle } from '@/components/theme-toggle';
import { CalendarDays } from 'lucide-react';

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
  const [view, setView] = useState<'grid' | 'list'>('grid');

  const filteredEvents = useMemo(() => {
    return initialEvents.filter((event) => {
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
  }, [initialEvents, filters]);

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
          view={view}
          onViewChange={setView}
        />

        <div className="mt-6">
          {initialEvents.length === 0 ? (
            <LoadingSkeleton />
          ) : filteredEvents.length === 0 ? (
            <EmptyState
              title="No matching events"
              description="Try changing your filters or search terms."
              actionLabel="Clear filters"
              onAction={() => setFilters({ search: '', sources: [], cities: [] })}
            />
          ) : (
            <>
              <p className="text-sm text-muted-foreground mb-4">
                Showing {filteredEvents.length} of {initialEvents.length} events
              </p>
              <EventGrid events={filteredEvents} view={view} />
            </>
          )}
        </div>
      </main>
    </div>
  );
}
