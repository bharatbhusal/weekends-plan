import { getEvents } from '@/lib/events';
import { HomePageClient } from './home-page-client';

export const dynamic = 'force-dynamic';

export default async function Page() {
  const events = await getEvents('municipal_events');

  const sources = Array.from(new Set(events.map((e) => e.sourceName)));
  const cities = Array.from(
    new Set(
      events
        .map((e) => e.location.city)
        .filter((c): c is string => !!c)
    )
  );

  return (
    <HomePageClient
      initialEvents={events}
      initialSources={sources}
      initialCities={cities}
      title="Weekends Plan"
    />
  );
}
