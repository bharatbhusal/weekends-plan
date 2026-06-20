'use client';

import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Search, X, LayoutGrid, List } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FilterState {
  search: string;
  sources: string[];
  cities: string[];
}

interface EventFiltersProps {
  sources: string[];
  cities: string[];
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  view: 'grid' | 'list';
  onViewChange: (view: 'grid' | 'list') => void;
}

const sourceColors: Record<string, string> = {
  luma: 'bg-purple-600/20 text-purple-400 hover:bg-purple-600/30 border-purple-600/30',
  foss_united: 'bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/30 border-emerald-600/30',
};

export function EventFilters({
  sources,
  cities,
  filters,
  onFiltersChange,
  view,
  onViewChange,
}: EventFiltersProps) {
  const toggleSource = (source: string) => {
    const next = filters.sources.includes(source)
      ? filters.sources.filter((s) => s !== source)
      : [...filters.sources, source];
    onFiltersChange({ ...filters, sources: next });
  };

  const toggleCity = (city: string) => {
    const next = filters.cities.includes(city)
      ? filters.cities.filter((c) => c !== city)
      : [...filters.cities, city];
    onFiltersChange({ ...filters, cities: next });
  };

  const hasActiveFilters = filters.search || filters.sources.length > 0 || filters.cities.length > 0;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search events..."
            className="pl-9"
            value={filters.search}
            onChange={(e) => onFiltersChange({ ...filters, search: e.target.value })}
          />
          {filters.search && (
            <button
              onClick={() => onFiltersChange({ ...filters, search: '' })}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onViewChange('grid')}
            className={cn(view === 'grid' && 'bg-accent')}
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onViewChange('list')}
            className={cn(view === 'list' && 'bg-accent')}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {sources.map((source) => {
          const active = filters.sources.length === 0 || filters.sources.includes(source);
          return (
            <button
              key={source}
              onClick={() => toggleSource(source)}
              className={cn(
                'inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium transition-colors',
                active
                  ? sourceColors[source] || 'bg-primary/10 text-primary border-primary/20'
                  : 'border-muted-foreground/20 text-muted-foreground/50 line-through'
              )}
            >
              {source === 'foss_united' ? 'FOSS United' : source.charAt(0).toUpperCase() + source.slice(1)}
            </button>
          );
        })}

        {cities.slice(0, 8).map((city) => {
          const active = filters.cities.length === 0 || filters.cities.includes(city);
          return (
            <Badge
              key={city}
              variant={active ? 'default' : 'outline'}
              className={cn(
                'cursor-pointer capitalize',
                !active && 'opacity-40 hover:opacity-70'
              )}
              onClick={() => toggleCity(city)}
            >
              {city}
            </Badge>
          );
        })}

        {hasActiveFilters && (
          <button
            onClick={() => onFiltersChange({ search: '', sources: [], cities: [] })}
            className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2"
          >
            Clear all
          </button>
        )}
      </div>
    </div>
  );
}
