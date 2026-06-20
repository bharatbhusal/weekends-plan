import { NormalizedEvent } from '@/types/event';
import { EventCard } from './event-card';

interface EventGridProps {
  events: NormalizedEvent[];
  view?: 'grid' | 'list';
}

export function EventGrid({ events, view = 'grid' }: EventGridProps) {
  if (events.length === 0) return null;

  if (view === 'list') {
    return (
      <div className="space-y-3">
        {events.map((event) => (
          <EventCard key={event._id} event={event} variant="compact" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {events.map((event) => (
        <EventCard key={event._id} event={event} />
      ))}
    </div>
  );
}
