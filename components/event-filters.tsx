"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
	Search,
	X,
	LayoutGrid,
	List,
	Globe,
	MapPin,
} from "lucide-react";
import { cn } from "@/lib/utils";

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
	view: "grid" | "list";
	onViewChange: (view: "grid" | "list") => void;
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
		onFiltersChange({ search: "", sources: [], cities: [] });
	};

	const hasActiveFilters =
		filters.search ||
		filters.sources.length > 0 ||
		filters.cities.length > 0;

	return (
		<div className="space-y-4">
			<div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
				<div className="flex gap-2">
					<div className="flex items-center gap-2">
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
							onClick={() => onViewChange("list")}
							className={cn(view === "list" && "bg-accent")}
						>
							<List className="h-4 w-4" />
						</Button>
					</div>

					<div className="relative w-full">
						<Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
						<Input
							placeholder="Search events..."
							className="pl-9 w-full"
							value={filters.search}
							onChange={(e) =>
								onFiltersChange({
									...filters,
									search: e.target.value,
								})
							}
						/>
						{filters.search && (
							<button
								onClick={() =>
									onFiltersChange({ ...filters, search: "" })
								}
								className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
							>
								<X className="h-4 w-4" />
							</button>
						)}
					</div>
				</div>

				<div className="flex flex-wrap items-center gap-2">
					<div className="relative flex-1">
						<Globe className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground pointer-events-none" />
						<select
							className="h-9 w-full rounded-md border border-input bg-background pl-8 pr-8 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring appearance-none"
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
									{source === "foss_united"
										? "FOSS United"
										: source === "foss_united_ics"
											? "FOSS United (Calendar)"
											: source === "foss_united_rss"
												? "FOSS United (RSS)"
												: source.charAt(0).toUpperCase() +
													source.slice(1)}
								</option>
							))}
						</select>
						<div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
							<svg
								className="h-4 w-4 text-muted-foreground"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M19 9l-7 7-7-7"
								/>
							</svg>
						</div>
					</div>

					<div className="relative flex-1">
						<MapPin className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground pointer-events-none" />
						<select
							className="h-9 w-full rounded-md border border-input bg-background pl-8 pr-8 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring appearance-none"
							value={filters.cities[0] || ""}
							onChange={(e) =>
								onFiltersChange({
									...filters,
									cities: e.target.value ? [e.target.value] : [],
								})
							}
						>
							<option value="">All cities</option>
							{cities.map((city) => (
								<option
									key={city}
									value={city}
									className="capitalize"
								>
									{city.charAt(0).toUpperCase() + city.slice(1)}
								</option>
							))}
						</select>
						<div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
							<svg
								className="h-4 w-4 text-muted-foreground"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M19 9l-7 7-7-7"
								/>
							</svg>
						</div>
					</div>

					{hasActiveFilters && (
						<Button
							variant="ghost"
							size="sm"
							onClick={clearAll}
							className="text-xs gap-1"
						>
							<X className="h-3 w-3" />
							<span className="hidden sm:inline">Clear</span>
						</Button>
					)}
				</div>
			</div>
		</div>
	);
}
