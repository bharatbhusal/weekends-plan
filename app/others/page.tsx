import { getEvents } from '@/lib/events';
import { HomePageClient } from '@/app/home-page-client';

export const dynamic = 'force-dynamic';

export default async function OthersPage() {
  const events = await getEvents('other_events');

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
      title="Weekends Plan - Other Events"
    />
  );
}
