import { Ingester } from '../base';
import { NormalizedEvent } from '@/types/event';
import crypto from 'crypto';
import FeedParser from 'feedparser';
import { Readable } from 'stream';

export class FossUnitedRssClient implements Ingester {
  readonly id = 'foss_united_rss';

  async fetch(config: Record<string, unknown>): Promise<NormalizedEvent[]> {
    const url = (config.url as string) || 'https://fossunited.org/events/timeline/rss.xml';

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

    const pubDate = item.pubDate || item.date || new Date().toISOString();
    const description = item.description || '';

    let city: string | undefined;
    if (description) {
      const cityMatch = description.match(/(?:city|location|venue)[:\s]+([^,\n<.]+)/i);
      if (cityMatch) city = cityMatch[1].trim();
    }

    return {
      _id: deterministicId,
      title: item.title,
      description,
      startDateTime: new Date(pubDate),
      location: {
        name: 'FOSS United',
        address: '',
        city,
      },
      sourceName: 'foss_united',
      originalUrl: item.link || 'https://fossunited.org/events',
      imageUrl: item.image?.url || undefined,
      category: 'Technology',
      updatedAt: new Date(),
    };
  }
}
