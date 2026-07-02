import { Ingester } from "../base";
import { NormalizedEvent } from "@/types/event";
import { makeEventId } from "@/lib/hash";
import { cleanLocation } from "../location-cleaner";
import {
	BASE_URL,
	TIMEOUT_MS,
	HEADERS,
	SOURCE_NAME,
	ID_PREFIX,
	DEFAULT_CATEGORY,
	CITIES,
	CATEGORIES,
} from "./meetup.constants";

const NEXT_DATA_RE =
	/<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/;

// Actually found in the api response: <script id="__NEXT_DATA__" type="application/json">

interface MeetupRawEvent {
	id: string;
	title: string;
	dateTime: string;
	endTime?: string;
	eventUrl?: string;
	description?: string;
	image?: { url?: string };
	venue?: {
		name?: string;
		address?: string;
		city?: string;
		state?: string;
		lat?: number;
		lng?: number;
	};
	group?: { name?: string; urlname?: string };
	isFree?: boolean;
	fee?: { amount?: number; currency?: string };
	eventType?: string;
}

function parseNextData(
	html: string,
): Record<string, any> | null {
	const m = html.match(NEXT_DATA_RE);
	if (!m) return null;
	try {
		return JSON.parse(m[1]);
	} catch {
		return null;
	}
}

function extractEventsFromApollo(
	apollo: Record<string, any>,
): MeetupRawEvent[] {
	const events: MeetupRawEvent[] = [];
	for (const [key, val] of Object.entries(apollo)) {
		if (
			key.startsWith("Event:") &&
			val?.__typename === "Event" &&
			val.title
		) {
			const photoRef =
				val.featuredEventPhoto?.__ref ||
				val.displayPhoto?.__ref;
			if (photoRef) {
				const photo = apollo[photoRef];
				if (photo?.highResUrl) {
					val.image = { url: photo.highResUrl };
				}
			}
			events.push(val as MeetupRawEvent);
		}
	}
	return events;
}

export class MeetupClient implements Ingester {
	readonly id = "meetup";

	async fetch(): Promise<NormalizedEvent[]> {
		const combos: Array<{
			cityVal: string;
			catId: string;
			catName: string;
		}> = [];
		for (const [catName, catId] of Object.entries(
			CATEGORIES,
		)) {
			for (const cityVal of Object.values(CITIES)) {
				combos.push({ cityVal, catId, catName });
			}
		}

		const results = await Promise.allSettled(
			combos.map((c) =>
				this.fetchCityCategory(c.cityVal, c.catId, c.catName),
			),
		);

		return results.flatMap((r) =>
			r.status === "fulfilled" ? r.value : [],
		);
	}

	private async fetchCityCategory(
		city: string,
		categoryId: string,
		categoryName: string,
	): Promise<NormalizedEvent[]> {
		const url = `${BASE_URL}&location=${city}&categoryId=${categoryId}`;

		const res = await fetch(url, {
			headers: HEADERS,
			signal: AbortSignal.timeout(TIMEOUT_MS),
		});

		if (!res.ok) {
			throw new Error(`HTTP ${res.status}`);
		}

		const html = await res.text();
		const nextData = parseNextData(html);
		if (!nextData) {
			throw new Error("No __NEXT_DATA__ found in response");
		}

		const apollo =
			nextData.props?.pageProps?.__APOLLO_STATE__;
		if (!apollo) {
			return [];
		}

		const rawEvents = extractEventsFromApollo(apollo);
		return rawEvents.map((e: MeetupRawEvent) =>
			this.normalize(e, city, categoryName),
		);
	}

	private normalize(
		raw: MeetupRawEvent,
		city: string,
		categoryName: string,
	): NormalizedEvent {
		const deterministicId = makeEventId(ID_PREFIX, raw.id);

		const isOnline =
			raw.eventType === "ONLINE" ||
			(!raw.venue?.name && !raw.venue?.address && !raw.venue?.city);

		const venueName =
			raw.venue?.name || raw.venue?.address || "";
		const hasCoords = !!(raw.venue?.lat && raw.venue?.lng);
		const cleaned = cleanLocation(
			venueName,
			venueName,
			hasCoords,
		);

		return {
			_id: deterministicId,
			title: raw.title,
			description: raw.description || "",
			startDateTime: new Date(raw.dateTime),
			endDateTime: raw.endTime
				? new Date(raw.endTime)
				: undefined,
			location: {
				name: cleaned.name,
				address: cleaned.address,
				city: raw.venue?.city || city,
				coordinates: hasCoords
					? { lat: raw.venue!.lat!, lng: raw.venue!.lng! }
					: undefined,
			},
			eventType: isOnline ? "online" : undefined,
			sourceName: SOURCE_NAME,
			originalUrl: raw.eventUrl || "",
			imageUrl: raw.image?.url || undefined,
			category: categoryName || DEFAULT_CATEGORY,
			updatedAt: new Date(),
		};
	}
}
