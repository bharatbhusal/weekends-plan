"use client";

import {
	useState,
	useMemo,
	useEffect,
	useCallback,
} from "react";
import { NormalizedEvent } from "@/types/event";
import { EventGrid } from "@/components/event-grid";
import { EventFilters } from "@/components/event-filters";
import { LoadingSkeleton } from "@/components/loading-skeleton";
import { EmptyState } from "@/components/empty-state";
import { ThemeToggle } from "@/components/theme-toggle";
import {
	CalendarDays,
	ChevronLeft,
	ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
	getSection,
	isStaticSection,
	SECTION_ORDER,
} from "@/lib/date-utils";

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
		search: string;
		sources: string[];
		cities: string[];
	}>({
		search: "",
		sources: [],
		cities: [],
	});

	const [view, setView] = useState<"grid" | "list">("grid");

	const [page, setPage] = useState(0);

	const filteredEvents = useMemo(() => {
		return initialEvents.filter((event) => {
			if (filters.search) {
				const q = filters.search.toLowerCase();
				const matchesSearch =
					event.title.toLowerCase().includes(q) ||
					event.description.toLowerCase().includes(q) ||
					event.location.name.toLowerCase().includes(q) ||
					(event.location.city || "")
						.toLowerCase()
						.includes(q) ||
					(event.category || "").toLowerCase().includes(q);
				if (!matchesSearch) return false;
			}

			if (
				filters.sources.length > 0 &&
				!filters.sources.includes(event.sourceName)
			) {
				return false;
			}

			if (
				filters.cities.length > 0 &&
				!filters.cities.includes(event.location.city || "")
			) {
				return false;
			}

			return true;
		});
	}, [initialEvents, filters]);

	const sections = useMemo(() => {
		const now = new Date();
		const map = new Map<string, NormalizedEvent[]>();
		const staticKeys: string[] = [];

		for (const event of filteredEvents) {
			const section = getSection(
				new Date(event.startDateTime),
				now,
				event.endDateTime
					? new Date(event.endDateTime)
					: undefined,
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

		for (const key of SECTION_ORDER) {
			if (map.has(key)) {
				const events = map.get(key)!;
				const label = getSection(
					new Date(events[0].startDateTime),
					now,
					events[0].endDateTime
						? new Date(events[0].endDateTime)
						: undefined,
				).label;
				ordered.push({ label, key, events });
			}
		}

		for (const [key, events] of map) {
			if (!seenStatic.has(key)) {
				const label = getSection(
					new Date(events[0].startDateTime),
					now,
					events[0].endDateTime
						? new Date(events[0].endDateTime)
						: undefined,
				).label;
				ordered.push({ label, key, events });
			}
		}

		return ordered;
	}, [filteredEvents]);

	const pages = useMemo(() => {
		const result: PageInfo[] = [];
		let upcomingSections: PageInfo["sections"] = [];
		let thisMonthSection: PageInfo["sections"] = [];
		const monthSections: Map<string, PageInfo["sections"]> =
			new Map();

		for (const section of sections) {
			if (
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
		return currentPage.sections.reduce(
			(sum, s) => sum + s.events.length,
			0,
		);
	}, [currentPage]);

	const hasNext = page < pages.length - 1;
	const hasPrev = page > 0;

	const goNext = useCallback(() => {
		if (hasNext) setPage((p) => p + 1);
	}, [hasNext]);

	const goPrev = useCallback(() => {
		if (hasPrev) setPage((p) => p - 1);
	}, [hasPrev]);

	const handleFiltersChange = useCallback(
		(newFilters: {
			search: string;
			sources: string[];
			cities: string[];
		}) => {
			setFilters(newFilters);
			setPage(0);
		},
		[],
	);

	const handleViewChange = useCallback(
		(newView: "grid" | "list") => {
			setView(newView);
		},
		[],
	);

	return (
		<div className="min-h-screen bg-background">
			<header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
				<div className="max-w-7xl mx-auto flex items-center justify-between px-4 sm:px-6 lg:px-8 h-16">
					<div className="flex items-center gap-3">
						<CalendarDays className="h-6 w-6 text-primary" />
						<h1 className="text-xl font-bold tracking-tight">
							{title}
						</h1>
					</div>
					<div className="flex items-center gap-4">
						<span className="text-sm text-muted-foreground hidden sm:inline">
							{initialEvents.length} events across India
						</span>
						<ThemeToggle />
					</div>
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
						<LoadingSkeleton view={view} count={8} />
					) : !currentPage || visibleEvents === 0 ? (
						<EmptyState
							title="No matching events"
							description="Try changing your filters or search terms."
							actionLabel="Clear filters"
							onAction={() => {
								setFilters({
									search: "",
									sources: [],
									cities: [],
								});
							}}
						/>
					) : (
						<div className="space-y-4">
							<div className="flex items-center justify-between flex-wrap gap-2">
								<p className="text-sm text-muted-foreground order-2 sm:order-1">
									Showing {visibleEvents} of {filteredEvents.length}{" "}
									events
								</p>
								{pages.length > 1 && (
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
											<ChevronLeft className="h-4 w-4" />
											Previous
										</button>
										<span className="text-sm font-medium text-muted-foreground px-1">
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
											<ChevronRight className="h-4 w-4" />
										</button>
									</div>
								)}
							</div>
							{currentPage.sections.map((section) => (
								<section key={section.key}>
									<h2 className="text-lg font-semibold flex items-center gap-2 mb-4">
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
