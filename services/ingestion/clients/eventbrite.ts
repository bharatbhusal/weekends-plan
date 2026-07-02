import { Ingester } from "../base";
import { NormalizedEvent } from "@/types/event";
import { makeEventId } from "@/lib/hash";
import { cleanLocation } from "../location-cleaner";
import {
	CITY_SLUGS,
	CATEGORIES,
	BASE_URL,
	TIMEOUT_MS,
	HEADERS,
	SOURCE_NAME,
	ID_PREFIX,
	DEFAULT_CATEGORY,
} from "./eventbrite.constants";

const JSONLD_RE =
	/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g;

interface EbEvent {
	name?: string;
	startDate?: string;
	endDate?: string;
	url?: string;
	image?: string | { url?: string };
	description?: string;
	location?: {
		name?: string;
		address?: {
			addressLocality?: string;
			addressRegion?: string;
			streetAddress?: string;
		};
	};
	organizer?: { name?: string };
}

function parseJsonLdEvents(html: string): EbEvent[] {
	const events: EbEvent[] = [];
	let m: RegExpExecArray | null;
	while ((m = JSONLD_RE.exec(html)) !== null) {
		try {
			const parsed = JSON.parse(m[1]);
			if (
				parsed?.["@type"] === "ItemList" &&
				Array.isArray(parsed.itemListElement)
			) {
				for (const item of parsed.itemListElement) {
					if (item?.item?.["@type"] === "Event") {
						events.push(item.item);
					}
				}
			}
		} catch {
			// skip malformed JSON-LD
		}
	}
	return events;
}

function ebCitySlug(city: string): string {
	return CITY_SLUGS[city] || `india--${city}`;
}

export class EventbriteClient implements Ingester {
	readonly id = "eventbrite";

	async fetch(): Promise<NormalizedEvent[]> {
		const results: NormalizedEvent[] = [];
		const seenUrls = new Set<string>();

		for (const city of Object.keys(CITY_SLUGS)) {
			for (const category of CATEGORIES) {
				try {
					const events = await this.fetchCityCategory(
						city,
						category,
						seenUrls,
					);
					results.push(...events);
				} catch (err) {
					console.warn(
						`Eventbrite [${city}/${category}]: ${err instanceof Error ? err.message : String(err)}`,
					);
				}
			}
		}

		return results;
	}

	private async fetchCityCategory(
		city: string,
		category: string,
		seenUrls: Set<string>,
	): Promise<NormalizedEvent[]> {
		const slug = ebCitySlug(city);
		const url = `${BASE_URL}${slug}/${category}/`;

		const res = await fetch(url, {
			headers: HEADERS,
			signal: AbortSignal.timeout(TIMEOUT_MS),
		});

		if (!res.ok) {
			throw new Error(`HTTP ${res.status}`);
		}

		const html = await res.text();
		const rawEvents = parseJsonLdEvents(html);
		const deduped = rawEvents.filter((e) => {
			if (!e.url || seenUrls.has(e.url)) return false;
			seenUrls.add(e.url);
			return true;
		});
		return deduped.map((e) => this.normalize(e, city));
	}

	private normalize(
		raw: EbEvent,
		city: string,
	): NormalizedEvent {
		const eventUrl = raw.url || "";
		const deterministicId = makeEventId(ID_PREFIX, eventUrl);

		const isOnline = !raw.location?.name && !raw.location?.address;
		const venueName = raw.location?.name || "";
		const streetAddr =
			raw.location?.address?.streetAddress || "";
		const hasCoords = false; // Eventbrite JSON-LD doesn't include lat/lng
		const cleaned = cleanLocation(
			venueName || streetAddr,
			streetAddr,
			hasCoords,
		);

		const imgUrl =
			typeof raw.image === "string"
				? raw.image
				: raw.image?.url || undefined;

		return {
			_id: deterministicId,
			title: raw.name || "Untitled Event",
			description: raw.description || "",
			startDateTime: new Date(raw.startDate || new Date()),
			endDateTime: raw.endDate
				? new Date(raw.endDate)
				: undefined,
			location: {
				name: cleaned.name,
				address: cleaned.address,
				city: raw.location?.address?.addressLocality || city,
			},
			eventType: isOnline ? "online" : undefined,
			sourceName: SOURCE_NAME,
			originalUrl: eventUrl,
			imageUrl: imgUrl,
			category: DEFAULT_CATEGORY,
			updatedAt: new Date(),
		};
	}
}
