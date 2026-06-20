import { Ingester } from '../base';
import { NormalizedEvent } from '@/types/event';
import crypto from 'crypto';
import ical from 'node-ical';

export class FossUnitedIcsClient implements Ingester {
  readonly id = 'foss_united_ics';

  async fetch(config: Record<string, unknown>): Promise<NormalizedEvent[]> {
    const url = (config.url as string) || 'https://fossunited.org/api/method/fossunited.api.chapter.upcoming_events_ics';

    const res = await fetch(url, {
      headers: { 'User-Agent': 'WeekendsPlan/1.0' },
    });
    if (!res.ok) {
      throw new Error(`FOSS United ICS fetch failed: HTTP ${res.status}`);
    }

    const textData = await res.text();
    const parsed = ical.sync.parseICS(textData);
    const events: NormalizedEvent[] = [];

    for (const uid of Object.keys(parsed)) {
      const component = parsed[uid];
      if (component.type !== 'VEVENT') continue;

      const vevent = component as ical.VEvent;
      if (!vevent.summary) continue;

      const originalId = vevent.uid || uid;
      const deterministicId = crypto
        .createHash('sha256')
        .update(`fossunited_ics_${originalId}`)
        .digest('hex');

      let city: string | undefined;
      const locationStr = vevent.location || '';
      if (locationStr) {
        const parts = locationStr.split(',').map((s) => s.trim());
        city = parts[parts.length - 1];
      }

      events.push({
        _id: deterministicId,
        title: vevent.summary,
        description: vevent.description || '',
        startDateTime: vevent.start ? new Date(vevent.start) : new Date(),
        endDateTime: vevent.end ? new Date(vevent.end) : undefined,
        location: {
          name: locationStr || 'Various Locations',
          address: locationStr || '',
          city,
        },
        sourceName: 'foss_united',
        originalUrl: 'https://fossunited.org/events',
        imageUrl: undefined,
        category: 'Open Source',
        updatedAt: new Date(),
      });
    }

    return events;
  }
}
