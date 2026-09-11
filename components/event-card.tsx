import Link from "next/link"
import { NormalizedEvent } from "@/types/event"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { AddToCalendar } from "@/components/add-to-calendar"
import {
	Calendar,
	MapPin,
	ExternalLink,
	Star,
} from "lucide-react"
import {
	formatDateRange,
	timeUntilEvent,
	cn,
} from "@/lib/utils"
import { marked } from "marked"
import Image from "next/image"

interface EventCardProps {
	event: NormalizedEvent
	variant?: "box" | "line" | "default" | "compact" | "featured"
	isWatched?: boolean
	onToggleWatch?: (id: string) => void
}

const sourceBadgeVariant = (source: string) => {
	switch (source.toLowerCase()) {
		case "luma":
			return "luma" as const
		case "foss":
			return "foss" as const
		case "meetup":
			return "meetup" as const
		case "eventbrite":
			return "eventbrite" as const
		default:
			return "secondary" as const
	}
}

const SOURCE_FALLBACK: Record<
	string,
	{ color: string; initial: string }
> = {
	luma: {
		color: "from-purple-600/30 to-purple-900/20",
		initial: "L",
	},
	foss: {
		color: "from-emerald-600/30 to-emerald-900/20",
		initial: "F",
	},
	meetup: {
		color: "from-red-600/30 to-red-900/20",
		initial: "M",
	},
	eventbrite: {
		color: "from-orange-600/30 to-orange-900/20",
		initial: "E",
	},
}

function getFallback(source: string) {
	return (
		SOURCE_FALLBACK[source.toLowerCase()] || {
			color: "from-muted to-muted/50",
			initial: "?",
		}
	)
}

function TimeBadge({
	start,
	end,
}: {
	start: Date
	end?: Date
}) {
	const { label, isLive } = timeUntilEvent(start, end)
	if (!label && !isLive) return null

	if (isLive) {
		return (
			<Badge className="animate-blink bg-red-600/20 text-red-400 border-red-600/30">
				<span className="mr-1 h-1.5 w-1.5 rounded-full bg-red-400" />
				Live
			</Badge>
		)
	}

	return (
		<Badge className="bg-slate-600/20 text-slate-400 border-slate-600/30 text-xs">
			{label}
		</Badge>
	)
}

function renderMarkdown(text: string): string {
	try {
		return marked.parse(text, { async: false }) as string
	} catch {
		return text
	}
}

export function EventCard({
	event,
	variant = "box",
	isWatched = false,
	onToggleWatch,
}: EventCardProps) {
	const isLine = variant === "line" || variant === "compact"
	const now = new Date()
	const start = new Date(event.startDateTime)
	const end = event.endDateTime ? new Date(event.endDateTime) : null
	const isLive = end ? (now >= start && now <= end) : false



	if (isLine) {
		return (
			<div className="group flex gap-4 rounded-lg border bg-card p-4 shadow-sm transition-all hover:shadow-md select-none relative">
				<div
					onClick={() => window.open(event.originalUrl, "_blank")}
					className="flex-1 min-w-0 cursor-pointer"
				>
					<div className="flex items-center gap-2 mb-1.5">
						<Badge variant={sourceBadgeVariant(event.sourceName)}>
							{event.sourceName}
						</Badge>
						<TimeBadge
							start={event.startDateTime}
							end={event.endDateTime}
						/>
					</div>
					<h3 className="font-semibold leading-snug truncate">
						{event.title}
					</h3>
					<div className="flex items-center gap-1.5 mt-1.5 text-xs text-muted-foreground">
						<Calendar className="h-3 w-3" />
						<span>
							{formatDateRange(
								event.startDateTime,
								event.endDateTime,
							)}
						</span>
					</div>
					<div className="flex items-center gap-1.5 mt-1 text-xs text-muted-foreground">
						{event.eventType === "online" ? (
							<span className="truncate">Online</span>
						) : (
							<>
								<MapPin className="h-3 w-3 shrink-0" />
								<span className="truncate">
									{event.location.address ||
										event.location.city ||
										event.location.name}
								</span>
							</>
						)}
					</div>


				</div>

				<div className="flex flex-col items-center gap-2 self-start shrink-0 ml-auto">
					{onToggleWatch && (
						<button
							onClick={(e) => {
								e.preventDefault()
								e.stopPropagation()
								onToggleWatch(event._id)
							}}
							className={cn(
								"p-1.5 rounded-full border bg-background/80 backdrop-blur hover:bg-background transition-colors shrink-0 shadow-sm",
								isWatched ? "text-amber-500 border-amber-500/25 bg-amber-500/5 hover:bg-amber-500/10" : "text-muted-foreground hover:text-foreground"
							)}
							title={isWatched ? "Remove from watchlist" : "Watch event"}
						>
							<Star className={cn("h-3.5 w-3.5", isWatched && "fill-amber-500")} />
						</button>
					)}
					<AddToCalendar event={event} />
				</div>
			</div>
		)
	}

	const fallback = getFallback(event.sourceName)

	return (
		<div className="group relative flex flex-col rounded-lg border bg-card shadow-sm transition-all hover:shadow-md overflow-hidden animate-fade-in">
			{onToggleWatch && (
				<button
					onClick={(e) => {
						e.preventDefault()
						e.stopPropagation()
						onToggleWatch(event._id)
					}}
					className={cn(
						"absolute top-3 right-3 z-10 p-1.5 rounded-full border bg-background/80 backdrop-blur hover:bg-background transition-colors shadow-sm",
						isWatched ? "text-amber-500 border-amber-500/25 bg-amber-500/5 hover:bg-amber-500/10" : "text-muted-foreground hover:text-foreground"
					)}
					title={isWatched ? "Remove from watchlist" : "Watch event"}
				>
					<Star className={cn("h-4 w-4", isWatched && "fill-amber-500")} />
				</button>
			)}

			{event.imageUrl ? (
				<div className="relative aspect-[16/9] overflow-hidden">
					<Image
						src={event.imageUrl}
						alt={event.title}
						fill
						sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
						className="object-cover transition-transform group-hover:scale-105"
						loading="lazy"
					/>
				</div>
			) : (
				<div
					className={`aspect-[16/9] bg-gradient-to-br ${fallback.color} flex items-center justify-center`}
				>
					<span className="text-4xl font-bold text-muted-foreground/30">
						{fallback.initial}
					</span>
				</div>
			)}

			<div className="flex flex-1 flex-col p-5">
				<div className="flex items-center gap-2 mb-3">
					<Badge variant={sourceBadgeVariant(event.sourceName)}>
						{event.sourceName}
					</Badge>
					<TimeBadge
						start={event.startDateTime}
						end={event.endDateTime}
					/>
				</div>

				<h3 className="text-lg font-bold leading-snug line-clamp-2 group-hover:text-primary transition-colors">
					{event.title}
				</h3>

				<div className="flex items-center gap-1.5 mt-2 text-sm text-muted-foreground">
					<Calendar className="h-3.5 w-3.5 shrink-0" />
					<span className="truncate">
						{formatDateRange(
							event.startDateTime,
							event.endDateTime,
						)}
					</span>
				</div>

				<div className="flex items-center gap-1.5 mt-1 text-sm text-muted-foreground">
					{event.eventType === "online" ? (
						<span className="truncate">Online</span>
					) : (
						<>
							<MapPin className="h-3.5 w-3.5 shrink-0" />
							<span className="truncate">
								{event.location.address ||
									event.location.name ||
									event.location.city}
							</span>
						</>
					)}
				</div>



				{event.description && (
					<div
						className="mt-3 text-sm text-muted-foreground line-clamp-3 flex-1 [&_a]:text-primary [&_a]:underline [&_p]:my-0.5 [&_ul]:list-disc [&_ul]:pl-4 [&_ol]:list-decimal [&_ol]:pl-4"
						dangerouslySetInnerHTML={{
							__html: renderMarkdown(event.description),
						}}
					/>
				)}

				<div className="mt-4 pt-4 border-t flex items-center justify-between">
					{event.location.city && (
						<Badge variant="outline" className="text-xs">
							{event.location.city}
						</Badge>
					)}
					<div className="ml-auto flex items-center gap-1">
						<AddToCalendar event={event} />
						<Button
							variant="link"
							size="sm"
							className="gap-1"
							asChild
						>
							<Link href={event.originalUrl} target="_blank">
								View <ExternalLink className="h-3 w-3" />
							</Link>
						</Button>
					</div>
				</div>
			</div>
		</div>
	)
}
