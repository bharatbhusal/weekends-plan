'use client';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  Search,
  X,
  LayoutGrid,
  List,
  ChevronDown,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  MapPin,
  Calendar,
  Globe,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export type SortField = 'date' | 'city' | 'location';
export type SortOrder = 'asc' | 'desc';

export interface SortState {
  field: SortField;
  order: SortOrder;
}

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
  sort: SortState;
  onSortChange: (sort: SortState) => void;
  view: 'grid' | 'list';
  onViewChange: (view: 'grid' | 'list') => void;
}

const SORT_OPTIONS: { field: SortField; label: string; icon: typeof Calendar }[] = [
  { field: 'date', label: 'Date', icon: Calendar },
  { field: 'city', label: 'City', icon: MapPin },
  { field: 'location', label: 'Location', icon: Globe },
];

export function EventFilters({
  sources,
  cities,
  filters,
  onFiltersChange,
  sort,
  onSortChange,
  view,
  onViewChange,
}: EventFiltersProps) {
  const allSourcesSelected = filters.sources.length === 0;

  const toggleSource = (source: string) => {
    const next = filters.sources.includes(source)
      ? filters.sources.filter((s) => s !== source)
      : [...filters.sources, source];
    onFiltersChange({ ...filters, sources: next });
  };

  const selectCity = (city: string | null) => {
    onFiltersChange({ ...filters, cities: city ? [city] : [] });
  };

  const toggleOrder = () => {
    onSortChange({ ...sort, order: sort.order === 'asc' ? 'desc' : 'asc' });
  };

  const clearAll = () => {
    onFiltersChange({ search: '', sources: [], cities: [] });
  };

  const hasActiveFilters = filters.search || filters.sources.length > 0 || filters.cities.length > 0;
  const currentSortLabel = SORT_OPTIONS.find((o) => o.field === sort.field)?.label || 'Date';
  const SortIcon = SORT_OPTIONS.find((o) => o.field === sort.field)?.icon || Calendar;
  const selectedCity = filters.cities[0] || null;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="relative flex-1 w-full sm:max-w-md">
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

        <div className="flex flex-wrap items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1">
                <span className="hidden sm:inline">{allSourcesSelected ? 'All sources' : `${filters.sources.length} src`}</span>
                <span className="sm:hidden">
                  <Globe className="h-3.5 w-3.5" />
                </span>
                <ChevronDown className="h-3.5 w-3.5 opacity-60" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              {sources.map((source) => (
                <DropdownMenuCheckboxItem
                  key={source}
                  checked={allSourcesSelected || filters.sources.includes(source)}
                  onCheckedChange={() => toggleSource(source)}
                >
                  {source === 'foss_united' ? 'FOSS United' : source.charAt(0).toUpperCase() + source.slice(1)}
                </DropdownMenuCheckboxItem>
              ))}
              {!allSourcesSelected && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onSelect={() => onFiltersChange({ ...filters, sources: [] })}>
                    Select all
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1">
                <SortIcon className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">{currentSortLabel}</span>
                <ChevronDown className="h-3.5 w-3.5 opacity-60" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuRadioGroup
                value={sort.field}
                onValueChange={(v) => onSortChange({ ...sort, field: v as SortField })}
              >
                {SORT_OPTIONS.map((opt) => (
                  <DropdownMenuRadioItem key={opt.field} value={opt.field}>
                    <opt.icon className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
                    {opt.label}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            variant="outline"
            size="sm"
            className="gap-1"
            onClick={toggleOrder}
            title={sort.order === 'asc' ? 'Ascending' : 'Descending'}
          >
            {sort.order === 'asc' ? (
              <ArrowUp className="h-3.5 w-3.5" />
            ) : (
              <ArrowDown className="h-3.5 w-3.5" />
            )}
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1">
                <MapPin className="h-3.5 w-3.5 shrink-0" />
                <span className="hidden sm:inline truncate max-w-20">
                  {selectedCity
                    ? selectedCity.charAt(0).toUpperCase() + selectedCity.slice(1)
                    : 'All cities'}
                </span>
                <ChevronDown className="h-3.5 w-3.5 opacity-60 shrink-0" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44 max-h-72 overflow-y-auto">
              <DropdownMenuRadioGroup
                value={selectedCity || ''}
                onValueChange={(v) => selectCity(v || null)}
              >
                <DropdownMenuRadioItem value="">All cities</DropdownMenuRadioItem>
                {cities.map((city) => (
                  <DropdownMenuRadioItem key={city} value={city} className="capitalize">
                    {city}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>

          <div className="h-6 w-px bg-border mx-1 hidden sm:block" />

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
