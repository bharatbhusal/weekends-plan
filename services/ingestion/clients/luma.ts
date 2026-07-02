import { Ingester } from "../base";
import { NormalizedEvent } from "@/types/event";
import { makeEventId } from "@/lib/hash";
import { cleanLocation } from "../location-cleaner";
import {
	SLUGS,
	BASE_URL,
	EVENT_URL_BASE,
	PAGE_LIMIT,
	MAX_TOTAL_EVENTS,
	HEADERS,
	SOURCE_NAME,
	ID_PREFIX,
	DEFAULT_CATEGORY,
	DEFAULT_LOCATION,
} from "./luma.constants";

interface RawGeoInfo {
	city?: string;
	region?: string;
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
}

interface RawResponse {
	entries: RawEntry[];
	has_more: boolean;
	next_cursor?: string;
}

export class LumaClient implements Ingester {
	readonly id = "luma";

	async fetch(): Promise<NormalizedEvent[]> {
		const allEvents: NormalizedEvent[] = [];
		const seenIds = new Set<string>();

		// Stage 1: global discover (no slug) — catches events not tied to any slug
		try {
			const globalEvents = await this.fetchPaginated({});
			for (const e of globalEvents) {
				if (!seenIds.has(e._id)) {
					seenIds.add(e._id);
					allEvents.push(e);
				}
			}
			console.log(
				`  -> ${globalEvents.length} events from global discover`,
			);
		} catch (err) {
			console.warn(
				`Luma global discover failed (non-fatal): ${err}`,
			);
		}

		// Stage 2: by slug (cities + categories) in parallel
		const slugResults = await Promise.allSettled(
			SLUGS.map((slug) => this.fetchPaginated({ slug })),
		);
		for (let i = 0; i < slugResults.length; i++) {
			const result = slugResults[i];
			if (result.status === "fulfilled") {
				for (const e of result.value) {
					if (!seenIds.has(e._id)) {
						seenIds.add(e._id);
						allEvents.push(e);
					}
				}
			} else {
				console.warn(
					`Luma slug "${SLUGS[i]}" failed: ${result.reason}`,
				);
			}
		}

		return allEvents;
	}

	private async fetchPaginated(params: {
		slug?: string;
	}): Promise<NormalizedEvent[]> {
		const allEvents: NormalizedEvent[] = [];
		let cursor: string | undefined;

		while (allEvents.length < MAX_TOTAL_EVENTS) {
			const url = new URL(BASE_URL);
			url.searchParams.set(
				"pagination_limit",
				String(PAGE_LIMIT),
			);
			if (params.slug)
				url.searchParams.set("slug", params.slug);
			if (cursor)
				url.searchParams.set("pagination_cursor", cursor);

			const res = await fetch(url.toString(), {
				headers: HEADERS,
			});

			if (!res.ok) {
				const body = await res.text().catch(() => "");
				throw new Error(
					`Luma API returned ${res.status}${params.slug ? ` for "${params.slug}"` : ""}: ${body.slice(0, 100)}`,
				);
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

	private normalize(
		entry: RawEntry,
	): NormalizedEvent | null {
		const ev = entry.event;
		if (!ev.name || !ev.api_id) return null;

		const deterministicId = makeEventId(ID_PREFIX, ev.api_id);

		const imageUrl = ev.cover_url?.startsWith("http")
			? ev.cover_url
			: undefined;

		const isOnline =
			ev.location_type === "online" ||
			(!ev.geo_address_info?.city &&
				!ev.geo_address_info?.region &&
				!ev.coordinate);

		const cityName =
			ev.geo_address_info?.city ||
			ev.geo_address_info?.region ||
			"";

		const rawShort = ev.geo_address_info?.short_address || "";
		const rawFull = ev.geo_address_info?.full_address || "";
		const rawName = rawShort
			? `${rawShort}${cityName && !rawShort.toLowerCase().includes(cityName.toLowerCase()) ? `, ${cityName}` : ""}`
			: rawFull || cityName || DEFAULT_LOCATION;
		const hasCoords = !!ev.coordinate;

		const cleaned = cleanLocation(
			rawName,
			rawFull,
			hasCoords,
		);

		return {
			_id: deterministicId,
			title: ev.name,
			description: "",
			startDateTime: new Date(ev.start_at),
			endDateTime: ev.end_at ? new Date(ev.end_at) : undefined,
			location: {
				name: cleaned.name,
				address: cleaned.address,
				city: cityName || undefined,
				coordinates: ev.coordinate
					? {
							lat: ev.coordinate.latitude,
							lng: ev.coordinate.longitude,
						}
					: undefined,
			},
			eventType: isOnline ? "online" : undefined,
			sourceName: SOURCE_NAME,
			originalUrl: ev.url
				? `${EVENT_URL_BASE}/${ev.url}`
				: EVENT_URL_BASE,
			imageUrl,
			category: DEFAULT_CATEGORY,
			updatedAt: new Date(),
		};
	}
}
