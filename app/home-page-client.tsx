"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { NormalizedEvent } from "@/types/event";
import { EventGrid } from "@/components/event-grid";
import { EventFilters } from "@/components/event-filters";
import { LoadingSkeleton } from "@/components/loading-skeleton";
import { EmptyState } from "@/components/empty-state";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { generalizeCity } from "@/lib/city-aliases";
import { getSection, isStaticSection, SECTION_ORDER } from "@/lib/date-utils";
import { watchStorage } from "@/lib/watch-storage";
import { CalendarView } from "@/components/calendar-view";
import { EventList } from "@/components/event-list";
import { EventCard } from "@/components/event-card";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
  DrawerClose,
} from "@/components/ui/drawer";

interface HomePageClientProps {
  initialEvents: NormalizedEvent[];
  initialSources: string[];
  initialCities: string[];
  title?: string;
}

interface PageInfo {
  label: string;
  key: string;
  sections: {
    label: string;
    key: string;
    events: NormalizedEvent[];
  }[];
}

export function HomePageClient({
  initialEvents,
  initialSources,
  initialCities,
  title = "Weekends Plan",
}: HomePageClientProps) {
  const [filters, setFilters] = useState<{
    sources: string[];
    cities: string[];
    eventType: "in-person" | "online" | "";
  }>({
    sources: [],
    cities: ["Hyderabad"],
    eventType: "in-person",
  });

  const [view, setView] = useState<"grid" | "calendar">("grid");
  const [page, setPage] = useState(0);
  const [watchedIds, setWatchedIds] = useState<string[]>([]);

  // Calendar monthly pagination state
  const [currentMonth, setCurrentMonth] = useState<Date>(() => new Date());

  // Drawer states
  const [selectedDayEvents, setSelectedDayEvents] = useState<{
    date: Date;
    events: NormalizedEvent[];
  } | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<NormalizedEvent | null>(null);

  // LocalStorage watched list initialization and cleanup (Runs strictly once on mount)
  useEffect(() => {
    const apiIds = initialEvents.map((e) => e._id);
    const cleanedIds = watchStorage.cleanWatchedIds(apiIds);
    setWatchedIds(cleanedIds);
  }, [initialEvents]);

  const handleToggleWatch = useCallback((id: string) => {
    setWatchedIds((prev) => {
      const isAlreadyWatched = prev.includes(id);
      const next = isAlreadyWatched ? prev.filter((x) => x !== id) : [...prev, id];
      if (isAlreadyWatched) {
        watchStorage.unwatchEvent(id);
      } else {
        watchStorage.watchEvent(id);
      }
      return next;
    });
  }, []);

  const filteredEvents = useMemo(() => {
    return initialEvents.filter((event) => {
      if (filters.sources.length > 0 && !filters.sources.includes(event.sourceName)) {
        return false;
      }

      if (
        filters.cities.length > 0 &&
        !filters.cities.includes(generalizeCity(event.location.city) || "")
      ) {
        return false;
      }

      if (filters.eventType === "in-person" && event.eventType === "online") {
        return false;
      }
      if (filters.eventType === "online" && event.eventType !== "online") {
        return false;
      }

      return true;
    });
  }, [initialEvents, filters]);

  // Filter events that have been explicitly pinned/watched
  const watchedEvents = useMemo(() => {
    return filteredEvents.filter((e) => watchedIds.includes(e._id));
  }, [filteredEvents, watchedIds]);

  const sections = useMemo(() => {
    const now = new Date();
    const map = new Map<string, NormalizedEvent[]>();
    const staticKeys: string[] = [];

    for (const event of filteredEvents) {
      const section = getSection(
        new Date(event.startDateTime),
        now,
        event.endDateTime ? new Date(event.endDateTime) : undefined,
      );
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

    const ordered: {
      label: string;
      key: string;
      events: NormalizedEvent[];
    }[] = [];
    const seenStatic = new Set(staticKeys);

    // Watch list section should appear first if any events are watched
    if (watchedEvents.length > 0) {
      ordered.push({
        label: "Watchlist",
        key: "watch",
        events: watchedEvents,
      });
    }

    for (const key of SECTION_ORDER) {
      if (map.has(key)) {
        const events = map.get(key)!;
        const label = getSection(
          new Date(events[0].startDateTime),
          now,
          events[0].endDateTime ? new Date(events[0].endDateTime) : undefined,
        ).label;
        ordered.push({ label, key, events });
      }
    }

    for (const [key, events] of map) {
      if (!seenStatic.has(key)) {
        const label = getSection(
          new Date(events[0].startDateTime),
          now,
          events[0].endDateTime ? new Date(events[0].endDateTime) : undefined,
        ).label;
        ordered.push({ label, key, events });
      }
    }

    return ordered;
  }, [filteredEvents, watchedEvents]);

  const pages = useMemo(() => {
    const result: PageInfo[] = [];
    let upcomingSections: PageInfo["sections"] = [];
    let thisMonthSection: PageInfo["sections"] = [];
    const monthSections: Map<string, PageInfo["sections"]> = new Map();

    for (const section of sections) {
      if (
        section.key === "watch" ||
        section.key === "live" ||
        section.key === "today" ||
        section.key === "tomorrow" ||
        section.key === "this-week"
      ) {
        upcomingSections.push(section);
      } else if (section.key === "this-month") {
        thisMonthSection.push(section);
      } else {
        const key = section.key;
        if (!monthSections.has(key)) {
          monthSections.set(key, []);
        }
        monthSections.get(key)!.push(section);
      }
    }

    if (upcomingSections.length > 0) {
      result.push({
        label: "Upcoming",
        key: "upcoming",
        sections: upcomingSections,
      });
    }
    if (thisMonthSection.length > 0) {
      result.push({
        label: "This Month",
        key: "this-month",
        sections: thisMonthSection,
      });
    }
    for (const [key, secs] of monthSections) {
      const label = secs[0]?.label || key;
      result.push({ label, key, sections: secs });
    }

    return result;
  }, [sections]);

  useEffect(() => {
    if (pages.length > 0 && page >= pages.length) {
      setPage(0);
    }
  }, [pages.length, page]);

  const currentPage = pages[page] || null;

  const visibleEvents = useMemo(() => {
    if (!currentPage) return 0;
    return currentPage.sections.reduce((sum, s) => {
      // Don't double count watched events in the pagination metrics
      if (s.key === "watch") return sum;
      return sum + s.events.length;
    }, 0);
  }, [currentPage]);

  // Calculate events count for the visible month in calendar view
  const calendarEventsCount = useMemo(() => {
    const start = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
    const end = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0, 23, 59, 59);
    return filteredEvents.filter((e) => {
      const d = new Date(e.startDateTime);
      return d >= start && d <= end;
    }).length;
  }, [filteredEvents, currentMonth]);

  const hasNext = page < pages.length - 1;
  const hasPrev = page > 0;

  const goNext = useCallback(() => {
    if (hasNext) setPage((p) => p + 1);
  }, [hasNext]);

  const goPrev = useCallback(() => {
    if (hasPrev) setPage((p) => p - 1);
  }, [hasPrev]);

  // Month changes in Calendar View
  const goToPrevMonth = useCallback(() => {
    setCurrentMonth((prev) => {
      const now = new Date();
      const minDate = new Date(now.getFullYear(), now.getMonth(), 1);
      const newDate = new Date(prev.getFullYear(), prev.getMonth() - 1, 1);
      if (newDate < minDate) return prev;
      return newDate;
    });
  }, []);

  const goToNextMonth = useCallback(() => {
    setCurrentMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  }, []);

  const handleFiltersChange = useCallback(
    (newFilters: {
      sources: string[];
      cities: string[];
      eventType: "in-person" | "online" | "";
    }) => {
      setFilters(newFilters);
      setPage(0);
    },
    [],
  );

  const handleViewChange = useCallback((newView: "grid" | "calendar") => {
    setView(newView);
  }, []);

  const isCurrentOrPastMonth = useMemo(() => {
    const now = new Date();
    const currentActual = new Date(now.getFullYear(), now.getMonth(), 1);
    const viewMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
    return viewMonth <= currentActual;
  }, [currentMonth]);

  const isCalendar = view === "calendar";
  const totalVisible = isCalendar ? calendarEventsCount : visibleEvents;

  function renderCalenderPagination() {
    return (
      <div className="flex items-center justify-between gap-2 order-1 sm:order-2 w-full sm:w-auto">
        <button
          onClick={goToPrevMonth}
          disabled={isCurrentOrPastMonth}
          className={cn(
            "inline-flex items-center gap-1 px-3 py-1.5 text-sm rounded-lg border transition-colors",
            isCurrentOrPastMonth
              ? "border-border/50 text-muted-foreground/50 cursor-not-allowed"
              : "border-border text-foreground hover:bg-accent",
          )}
        >
          <FaChevronLeft className="h-4 w-4" />
          Previous
        </button>
        <span className="text-sm font-semibold text-muted-foreground px-2 min-w-[120px] text-center">
          {new Intl.DateTimeFormat("en-IN", {
            month: "long",
            year: "numeric",
          }).format(currentMonth)}
        </span>
        <button
          onClick={goToNextMonth}
          className="inline-flex items-center gap-1 px-3 py-1.5 text-sm rounded-lg border border-border text-foreground hover:bg-accent transition-colors"
        >
          Next
          <FaChevronRight className="h-4 w-4" />
        </button>
      </div>
    );
  }

  function renderGridPagination() {
    return (
      <div className="flex items-center justify-between gap-2 order-1 sm:order-2 w-full sm:w-auto">
        <button
          onClick={goPrev}
          disabled={!hasPrev}
          className={cn(
            "inline-flex items-center gap-1 px-3 py-1.5 text-sm rounded-lg border transition-colors",
            hasPrev
              ? "border-border text-foreground hover:bg-accent"
              : "border-border/50 text-muted-foreground/50 cursor-not-allowed",
          )}
        >
          <FaChevronLeft className="h-4 w-4" />
          Previous
        </button>
        <span className="text-sm font-semibold text-muted-foreground px-2 min-w-[100px] text-center">
          {currentPage.label}
        </span>
        <button
          onClick={goNext}
          disabled={!hasNext}
          className={cn(
            "inline-flex items-center gap-1 px-3 py-1.5 text-sm rounded-lg border transition-colors",
            hasNext
              ? "border-border text-foreground hover:bg-accent"
              : "border-border/50 text-muted-foreground/50 cursor-not-allowed",
          )}
        >
          Next
          <FaChevronRight className="h-4 w-4" />
        </button>
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-4 sm:px-6 lg:px-8 h-16">
          <div className="flex items-center gap-3">
            <Image src="/icon.png" alt="" width={28} height={28} className="h-7 w-7" />
            <h1 className="text-xl font-bold tracking-tight">{title}</h1>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <EventFilters
          sources={initialSources}
          cities={initialCities}
          filters={filters}
          onFiltersChange={handleFiltersChange}
          view={view}
          onViewChange={handleViewChange}
        />

        <div className="mt-2">
          {initialEvents.length === 0 ? (
            <LoadingSkeleton view={view === "calendar" ? "grid" : view} count={8} />
          ) : !isCalendar && (!currentPage || totalVisible === 0) ? (
            <EmptyState
              title="No matching events"
              description="Try changing your filters."
              actionLabel="Clear filters"
              onAction={() => {
                setFilters({
                  sources: [],
                  cities: ["Hyderabad"],
                  eventType: "in-person",
                });
              }}
            />
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-end flex-wrap">
                {/* Pagination buttons: different logic for grid vs calendar */}
                {isCalendar
                  ? renderCalenderPagination()
                  : pages.length > 1 && renderGridPagination()}
              </div>

              {isCalendar ? (
                <CalendarView
                  events={filteredEvents}
                  currentMonth={currentMonth}
                  onMonthChange={setCurrentMonth}
                  onSelectEvent={setSelectedEvent}
                  onSelectDayEvents={(date, evts) => setSelectedDayEvents({ date, events: evts })}
                />
              ) : (
                currentPage.sections.map((section) => (
                  <section key={section.key} className="animate-fade-in">
                    <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">
                      <span className="bg-primary/10 text-primary text-xs font-medium px-2.5 py-0.5 rounded-full">
                        {section.events.length}
                      </span>
                      {section.label}
                    </h2>
                    <EventGrid
                      events={section.events}
                      watchedIds={watchedIds}
                      onToggleWatch={handleToggleWatch}
                    />
                  </section>
                ))
              )}
            </div>
          )}
        </div>
      </main>

      {/* Day Events List Drawer */}
      <Drawer
        open={!!selectedDayEvents}
        onOpenChange={(open) => !open && setSelectedDayEvents(null)}
      >
        <DrawerContent className="max-h-[85vh]">
          <div className="mx-auto w-full max-w-lg overflow-y-auto px-6 py-4">
            <DrawerHeader className="px-0">
              <DrawerTitle className="text-xl">
                Events on{" "}
                {selectedDayEvents
                  ? new Intl.DateTimeFormat("en-IN", {
                      dateStyle: "full",
                    }).format(selectedDayEvents.date)
                  : ""}
              </DrawerTitle>
              <DrawerDescription className="px-0">
                Click any event to view details or register.
              </DrawerDescription>
            </DrawerHeader>

            {selectedDayEvents && (
              <div className="py-4">
                <EventList
                  events={selectedDayEvents.events}
                  watchedIds={watchedIds}
                  onToggleWatch={handleToggleWatch}
                />
              </div>
            )}

            <DrawerFooter className="px-0 mt-4">
              <DrawerClose asChild>
                <Button variant="outline" className="w-full">
                  Close
                </Button>
              </DrawerClose>
            </DrawerFooter>
          </div>
        </DrawerContent>
      </Drawer>

      {/* Single Event Detail Card Drawer */}
      <Drawer open={!!selectedEvent} onOpenChange={(open) => !open && setSelectedEvent(null)}>
        <DrawerContent className="max-h-[90vh]">
          <div className="mx-auto w-full max-w-xl overflow-y-auto px-6 py-4">
            {selectedEvent && (
              <>
                <DrawerHeader className="px-0">
                  <DrawerTitle className="text-xl">{selectedEvent.title}</DrawerTitle>
                  <DrawerDescription className="px-0">Event Details & Schedule</DrawerDescription>
                </DrawerHeader>
                <div className="py-4">
                  <EventCard
                    event={selectedEvent}
                    variant="box"
                    isWatched={watchedIds.includes(selectedEvent._id)}
                    onToggleWatch={handleToggleWatch}
                  />
                </div>
              </>
            )}
            <DrawerFooter className="px-0 mt-4">
              <DrawerClose asChild>
                <Button variant="outline" className="w-full">
                  Close
                </Button>
              </DrawerClose>
            </DrawerFooter>
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  );
}
