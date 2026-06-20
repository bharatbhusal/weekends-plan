import Link from 'next/link';
import { NormalizedEvent } from '@/types/event';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, MapPin, ExternalLink } from 'lucide-react';
import { formatDateRange } from '@/lib/utils';

interface EventCardProps {
  event: NormalizedEvent;
  variant?: 'default' | 'compact' | 'featured';
}

const sourceBadgeVariant = (source: string) => {
  switch (source) {
    case 'luma':
      return 'luma' as const;
    case 'foss_united':
      return 'foss' as const;
    default:
      return 'secondary' as const;
  }
};

export function EventCard({ event, variant = 'default' }: EventCardProps) {
  if (variant === 'compact') {
    return (
      <div className="group flex gap-4 rounded-lg border bg-card p-4 shadow-sm transition-all hover:shadow-md">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5">
            <Badge variant={sourceBadgeVariant(event.sourceName)}>
              {event.sourceName}
            </Badge>
          </div>
          <h3 className="font-semibold leading-snug truncate">{event.title}</h3>
          <div className="flex items-center gap-1.5 mt-1.5 text-xs text-muted-foreground">
            <Calendar className="h-3 w-3" />
            <span>{formatDateRange(event.startDateTime, event.endDateTime)}</span>
          </div>
          <div className="flex items-center gap-1.5 mt-1 text-xs text-muted-foreground">
            <MapPin className="h-3 w-3" />
            <span className="truncate">{event.location.name || event.location.city}</span>
          </div>
        </div>
        <div className="flex items-center">
          <Button variant="ghost" size="icon" asChild>
            <Link href={event.originalUrl} target="_blank">
              <ExternalLink className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="group relative flex flex-col rounded-lg border bg-card shadow-sm transition-all hover:shadow-md overflow-hidden">
      {event.imageUrl ? (
        <div className="aspect-[16/9] overflow-hidden">
          <img
            src={event.imageUrl}
            alt={event.title}
            className="h-full w-full object-cover transition-transform group-hover:scale-105"
            loading="lazy"
          />
        </div>
      ) : (
        <div className="aspect-[16/9] bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center">
          <Calendar className="h-12 w-12 text-muted-foreground/40" />
        </div>
      )}

      <div className="flex flex-1 flex-col p-5">
        <Badge
          variant={sourceBadgeVariant(event.sourceName)}
          className="self-start mb-3"
        >
          {event.sourceName}
        </Badge>

        <h3 className="text-lg font-bold leading-snug line-clamp-2 group-hover:text-primary transition-colors">
          {event.title}
        </h3>

        <div className="flex items-center gap-1.5 mt-2 text-sm text-muted-foreground">
          <Calendar className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">
            {formatDateRange(event.startDateTime, event.endDateTime)}
          </span>
        </div>

        <div className="flex items-center gap-1.5 mt-1 text-sm text-muted-foreground">
          <MapPin className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">{event.location.name || event.location.city || 'Online'}</span>
        </div>

        {event.description && (
          <p className="mt-3 text-sm text-muted-foreground line-clamp-3 flex-1">
            {event.description}
          </p>
        )}

        <div className="mt-4 pt-4 border-t flex items-center justify-between">
          {event.location.city && (
            <Badge variant="outline" className="text-xs">
              {event.location.city}
            </Badge>
          )}
          <Button variant="link" size="sm" className="ml-auto gap-1" asChild>
            <Link href={event.originalUrl} target="_blank">
              View <ExternalLink className="h-3 w-3" />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
