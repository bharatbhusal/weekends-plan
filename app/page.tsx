import { connectToDatabase } from '@/lib/mongodb';
import { NormalizedEvent } from '@/types/event';
import { HomePageClient } from './home-page-client';

async function getEvents(): Promise<NormalizedEvent[]> {
  try {
    const db = await connectToDatabase();

    const events = await db
      .collection<NormalizedEvent>('municipal_events')
      .find({ startDateTime: { $gte: new Date() } })
      .sort({ startDateTime: 1 })
      .limit(200)
      .toArray();

    return JSON.parse(JSON.stringify(events));
  } catch (err) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('getEvents: Unable to fetch from database:', err);
    }
    return [];
  }
}

export default async function Page() {
  const events = await getEvents();

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
    />
  );
}
