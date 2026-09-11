"use client";

import { Button } from "@/components/ui/button";
import { X, LayoutGrid, Calendar, Globe, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";

interface FilterState {
  sources: string[];
  cities: string[];
  eventType: "in-person" | "online" | "";
}

interface EventFiltersProps {
  sources: string[];
  cities: string[];
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  view: "grid" | "calendar";
  onViewChange: (view: "grid" | "calendar") => void;
}

export function EventFilters({
  sources,
  cities,
  filters,
  onFiltersChange,
  view,
  onViewChange,
}: EventFiltersProps) {
  const clearAll = () => {
    onFiltersChange({
      sources: [],
      cities: [],
      eventType: "",
    });
  };

  const hasActiveFilters =
    filters.sources.length > 0 || filters.cities.length > 0 || filters.eventType !== "";

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 gap-2">
          <div className="flex w-full items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onViewChange("grid")}
              className={cn(view === "grid" && "bg-accent")}
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onViewChange("calendar")}
              className={cn(view === "calendar" && "bg-accent")}
            >
              <Calendar className="h-4 w-4" />
            </Button>

            <div className="relative flex-1">
              <select
                className="inline-flex w-full items-center justify-center whitespace-nowrap rounded-md border border-input bg-background px-3 py-2 text-sm font-medium ring-offset-background transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 appearance-none pl-8 pr-6"
                value={filters.cities[0] || ""}
                onChange={(e) =>
                  onFiltersChange({
                    ...filters,
                    cities: e.target.value ? [e.target.value] : [],
                  })
                }
              >
                <option value="">All locations</option>
                {cities.map((city) => (
                  <option key={city} value={city} className="capitalize">
                    {city.charAt(0).toUpperCase() + city.slice(1)}
                  </option>
                ))}
              </select>
              <MapPin className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1">
            <Globe className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            <select
              className="h-9 w-full rounded-md border border-input bg-background pl-8 pr-8 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring appearance-none bg-[length:16px] bg-[right_8px_center] bg-no-repeat"
              style={{
                backgroundImage:
                  "url(\"data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' stroke='%23909090' viewBox='0 0 24 24'%3e%3cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'/%3e%3c/svg%3e\")",
              }}
              value={filters.sources[0] || ""}
              onChange={(e) =>
                onFiltersChange({
                  ...filters,
                  sources: e.target.value ? [e.target.value] : [],
                })
              }
            >
              <option value="">All sources</option>
              {sources.map((source) => (
                <option key={source} value={source}>
                  {source.charAt(0).toUpperCase() + source.slice(1)}
                </option>
              ))}
            </select>
          </div>

          <div className="relative flex-1">
            <select
              className="h-9 w-full rounded-md border border-input bg-background pl-3 pr-8 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring appearance-none bg-[length:16px] bg-[right_8px_center] bg-no-repeat"
              style={{
                backgroundImage:
                  "url(\"data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' stroke='%23909090' viewBox='0 0 24 24'%3e%3cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'/%3e%3c/svg%3e\")",
              }}
              value={filters.eventType}
              onChange={(e) =>
                onFiltersChange({
                  ...filters,
                  eventType: e.target.value as "in-person" | "online" | "",
                })
              }
            >
              <option value="">All types</option>
              <option value="in-person">In-Person</option>
              <option value="online">Online</option>
            </select>
          </div>

          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={clearAll} className="text-xs gap-1">
              <X className="h-3 w-3" />
              <span className="hidden sm:inline">Clear</span>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
