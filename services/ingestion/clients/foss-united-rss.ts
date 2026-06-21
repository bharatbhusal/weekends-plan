import { Ingester } from '../base';
import { NormalizedEvent } from '@/types/event';
import crypto from 'crypto';
import FeedParser from 'feedparser';
import { Readable } from 'stream';

const MONTHS: Record<string, number> = {
  jan: 0, january: 0,
  feb: 1, february: 1,
  mar: 2, march: 2,
  apr: 3, april: 3,
  may: 4,
  jun: 5, june: 5,
  jul: 6, july: 6,
  aug: 7, august: 7,
  sep: 8, september: 8,
  oct: 9, october: 9,
  nov: 10, november: 10,
  dec: 11, december: 11,
};

const DATE_RE = /^(\d{1,2})\s+(\w+)\s+(\d{4}),\s*(\d{1,2}):(\d{2})\s+(AM|PM)$/i;
const IST_OFFSET_MS = (5 * 60 + 30) * 60 * 1000;

function extractFromHtml(html: string, label: string): string | undefined {
  const regex = new RegExp(
    `<strong>${label}:</strong>\\s*([^<]+)`,
    'i'
  );
  const match = html.match(regex);
  return match?.[1]?.trim();
}

function parseIndianDate(dateStr: string): Date | null {
  const m = dateStr.trim().match(DATE_RE);
  if (!m) return null;
  const day = parseInt(m[1]);
  const month = MONTHS[m[2].toLowerCase()];
  const year = parseInt(m[3]);
  let hours = parseInt(m[4]);
  const minutes = parseInt(m[5]);
  const ampm = m[6].toUpperCase();
  if (month === undefined) return null;
  if (ampm === 'PM' && hours !== 12) hours += 12;
  if (ampm === 'AM' && hours === 12) hours = 0;
  const utcTs = Date.UTC(year, month, day, hours, minutes) - IST_OFFSET_MS;
  return new Date(utcTs);
}

function parseDateFromDescription(
  html: string
): { start?: Date; end?: Date } {
  const startRaw = extractFromHtml(html, 'Start');
  const endRaw = extractFromHtml(html, 'End');
  const result: { start?: Date; end?: Date } = {};

  if (startRaw) {
    const parsed = parseIndianDate(startRaw);
    if (parsed) result.start = parsed;
  }

  if (endRaw) {
    const parsed = parseIndianDate(endRaw);
    if (parsed) result.end = parsed;
  }

  return result;
}

function extractLinkFromDescription(html: string): string | undefined {
  const match = html.match(/<a\s+href="([^"]+)">\s*View Event Details/);
  return match?.[1];
}

export class FossUnitedRssClient implements Ingester {
  readonly id = 'foss_united_rss';

  async fetch(config: Record<string, unknown>): Promise<NormalizedEvent[]> {
    const url =
      (config.url as string) ||
      'https://fossunited.org/events/timeline/rss.xml';

    const res = await fetch(url, {
      headers: { 'User-Agent': 'WeekendsPlan/1.0' },
    });
    if (!res.ok) {
      throw new Error(`FOSS United RSS fetch failed: HTTP ${res.status}`);
    }

    const textData = await res.text();
    const items = await this.parseFeed(textData);
    return items.map((item) => this.normalize(item));
  }

  private parseFeed(xml: string): Promise<any[]> {
    return new Promise((resolve, reject) => {
      const parser = new FeedParser({});
      const items: any[] = [];

      const stream = Readable.from(xml);
      stream.pipe(parser);

      parser.on('error', reject);
      parser.on('readable', function () {
        let item;
        while ((item = parser.read())) {
          items.push(item);
        }
      });
      parser.on('end', () => resolve(items));
    });
  }

  private normalize(item: any): NormalizedEvent {
    const originalId = item.guid || item.link || item.title;
    const deterministicId = crypto
      .createHash('sha256')
      .update(`fossunited_rss_${originalId}`)
      .digest('hex');

    const description = item.description || '';
    const parsedDates = parseDateFromDescription(description);

    const startDateTime = parsedDates.start || new Date(item.pubDate || item.date || new Date());

    const locationName = extractFromHtml(description, 'Location') || 'FOSS United';
    const chapterRaw = extractFromHtml(description, 'Chapter') || '';

    let city: string | undefined;
    if (chapterRaw) {
      const chapterCity = chapterRaw.replace(/-City Community$/, '').trim();
      if (chapterCity) city = chapterCity;
    }

    const eventLink =
      extractLinkFromDescription(description) || item.link || 'https://fossunited.org/events';

    const cleanTitle = item.title.replace(/\s*–\s+[^–]+$/, '').trim() || item.title;

    return {
      _id: deterministicId,
      title: cleanTitle,
      description,
      startDateTime,
      endDateTime: parsedDates.end,
      location: {
        name: locationName,
        address: locationName,
        city,
      },
      sourceName: 'foss_united',
      originalUrl: eventLink,
      imageUrl: item.image?.url || undefined,
      category: item.categories?.[0] || 'Technology',
      updatedAt: new Date(),
    };
  }
}
