import { Ingester } from '../base';
import { NormalizedEvent } from '@/types/event';
import crypto from 'crypto';

interface LumaEvent {
  event: {
    api_id: string;
    title: string;
    date: string;
    end_date?: string;
    timezone: string;
    venue?: string;
    geo_address?: string;
    cover_image?: string;
    registration_url: string;
  };
  organizer?: {
    name: string;
  };
}

interface LumaResponse {
  entries: Array<{
    event: LumaEvent['event'];
    organizer?: LumaEvent['organizer'];
  }>;
  has_more: boolean;
  pagination_cursor?: string;
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
        throw new Error(`Luma API returned ${res.status} for city "${city}"`);
      }

      const data: LumaResponse = await res.json();

      for (const entry of data.entries || []) {
        const ev = entry.event;
        const normalized = this.normalize(ev, city);
        if (normalized) allEvents.push(normalized);
      }

      if (!data.has_more || !data.pagination_cursor) break;
      cursor = data.pagination_cursor;
    }

    return allEvents;
  }

  private normalize(event: LumaEvent['event'], city: string): NormalizedEvent | null {
    if (!event.title || !event.api_id) return null;

    const deterministicId = crypto
      .createHash('sha256')
      .update(`luma_${event.api_id}`)
      .digest('hex');

    let imageUrl = event.cover_image;
    if (imageUrl && !imageUrl.startsWith('http')) {
      imageUrl = undefined;
    }

    return {
      _id: deterministicId,
      title: event.title,
      description: '',
      startDateTime: new Date(event.date),
      endDateTime: event.end_date ? new Date(event.end_date) : undefined,
      location: {
        name: event.venue || event.geo_address || 'Online / Virtual',
        address: event.geo_address || event.venue || '',
        city,
      },
      sourceName: 'luma',
      originalUrl: event.registration_url,
      imageUrl,
      category: 'Community',
      updatedAt: new Date(),
    };
  }
}
