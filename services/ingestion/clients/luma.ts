import { Ingester } from '../base';
import { NormalizedEvent } from '@/types/event';
import crypto from 'crypto';
import { cleanLocation } from '../location-cleaner';

interface RawGeoInfo {
  city?: string;
  city_state?: string;
  country?: string;
  short_address?: string;
  full_address?: string;
}

interface RawEvent {
  api_id: string;
  name: string;
  cover_url?: string;
  start_at: string;
  end_at?: string;
  timezone: string;
  url: string;
  location_type?: string;
  geo_address_info?: RawGeoInfo;
  geo_address_visibility?: string;
  coordinate?: { latitude: number; longitude: number };
}

interface RawEntry {
  api_id: string;
  event: RawEvent;
  start_at: string;
  hosts?: Array<{ name: string }>;
  featured_city?: { api_id: string; name: string; slug: string };
  ticket_info?: {
    is_free?: boolean;
    price?: number | null;
  };
}

interface RawResponse {
  entries: RawEntry[];
  has_more: boolean;
  next_cursor?: string;
}

const DESCRIPTION_URL_RE = /<meta\s+(?:name|property)="description"\s+content="([^"]+)"/i;

export async function enrichLumaDescriptions(
  events: NormalizedEvent[],
): Promise<void> {
  const batchSize = 5;
  for (let i = 0; i < events.length; i += batchSize) {
    const batch = events.slice(i, i + batchSize);
    await Promise.allSettled(
      batch.map(async (event) => {
        if (event.description) return;
        try {
          const res = await fetch(event.originalUrl, {
            signal: AbortSignal.timeout(5000),
            headers: { 'User-Agent': 'Mozilla/5.0 (compatible; WeekendsPlan/1.0)' },
          });
          if (!res.ok) return;
          const html = await res.text();
          const m = html.match(DESCRIPTION_URL_RE);
          if (m) {
            event.description = m[1].replace(/&amp;/g, '&').trim();
          }
        } catch {
          // best-effort
        }
      }),
    );
  }
}

export class LumaClient implements Ingester {
  readonly id = 'luma';
  private baseUrl = 'https://api.luma.com/discover/get-paginated-events';

  async fetch(config: Record<string, unknown>): Promise<NormalizedEvent[]> {
    const cities = config.cities as string[] | undefined;
    const maxPerCity = (config.maxEventsPerCity as number) || 40;

    if (!cities || cities.length === 0) {
      console.warn('Luma ingestion: no cities configured.');
      return [];
    }

    const results: NormalizedEvent[] = [];
    const errors: string[] = [];

    const batchSize = 4;
    for (let i = 0; i < cities.length; i += batchSize) {
      const batch = cities.slice(i, i + batchSize);
      const batchResults = await Promise.allSettled(
        batch.map((city) => this.fetchCity(city, maxPerCity))
      );
      for (let j = 0; j < batchResults.length; j++) {
        const result = batchResults[j];
        if (result.status === 'fulfilled') {
          results.push(...result.value);
        } else {
          errors.push(`[${batch[j]}] ${result.reason}`);
        }
      }
    }

    if (errors.length > 0) {
      console.warn(`Luma: ${errors.length} city fetch(es) failed:\n${errors.join('\n')}`);
    }

    return results;
  }

  private async fetchCity(city: string, limit: number): Promise<NormalizedEvent[]> {
    const allEvents: NormalizedEvent[] = [];
    let cursor: string | undefined;
    const maxPages = 3;

    for (let page = 0; page < maxPages; page++) {
      const url = new URL(this.baseUrl);
      url.searchParams.set('slug', city);
      url.searchParams.set('pagination_limit', String(Math.min(limit, 40)));
      if (cursor) url.searchParams.set('pagination_cursor', cursor);

      const res = await fetch(url.toString(), {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; WeekendsPlan/1.0)',
          Origin: 'https://luma.com',
          Referer: 'https://luma.com/discover',
        },
      });

      if (!res.ok) {
        const body = await res.text().catch(() => '');
        throw new Error(`Luma API returned ${res.status} for city "${city}": ${body.slice(0, 100)}`);
      }

      const data: RawResponse = await res.json();

      for (const entry of data.entries || []) {
        const normalized = this.normalize(entry);
        if (normalized) allEvents.push(normalized);
      }

      if (!data.has_more || !data.next_cursor) break;
      cursor = data.next_cursor;
    }

    return allEvents;
  }

  private normalize(entry: RawEntry): NormalizedEvent | null {
    const ev = entry.event;
    if (!ev.name || !ev.api_id) return null;

    const deterministicId = crypto
      .createHash('sha256')
      .update(`luma_${ev.api_id}`)
      .digest('hex');

    const imageUrl = ev.cover_url?.startsWith('http') ? ev.cover_url : undefined;

    const cityName =
      ev.geo_address_info?.city || entry.featured_city?.name || '';

    const rawShort = ev.geo_address_info?.short_address || '';
    const rawFull = ev.geo_address_info?.full_address || '';
    const rawName = rawShort
      ? `${rawShort}${cityName && !rawShort.toLowerCase().includes(cityName.toLowerCase()) ? `, ${cityName}` : ''}`
      : rawFull || cityName || 'Online / Virtual';
    const hasCoords = !!ev.coordinate;

    const cleaned = cleanLocation(rawName, rawFull, hasCoords);

    return {
      _id: deterministicId,
      title: ev.name,
      description: '',
      startDateTime: new Date(ev.start_at),
      endDateTime: ev.end_at ? new Date(ev.end_at) : undefined,
      location: {
        name: cleaned.name,
        address: cleaned.address,
        city: cityName || undefined,
        coordinates: ev.coordinate
          ? { lat: ev.coordinate.latitude, lng: ev.coordinate.longitude }
          : undefined,
      },
      sourceName: 'luma',
      originalUrl: ev.url ? `https://lu.ma/${ev.url}` : 'https://lu.ma',
      imageUrl,
      category: 'Community',
      updatedAt: new Date(),
    };
  }
}
