import { NormalizedEvent } from "@/types/event"
import { EventCard } from "./event-card"

interface EventListProps {
  events: NormalizedEvent[]
  watchedIds?: string[]
  onToggleWatch?: (id: string) => void
}

export function EventList({ events, watchedIds = [], onToggleWatch }: EventListProps) {
  if (events.length === 0) return null

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {events.map((event) => (
        <EventCard
          key={event._id}
          event={event}
          variant="line"
          isWatched={watchedIds.includes(event._id)}
          onToggleWatch={onToggleWatch}
        />
      ))}
    </div>
  )
}
