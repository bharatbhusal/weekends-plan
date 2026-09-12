import { Ingester } from "../base";
import { NormalizedEvent } from "@/types/event";
import { makeEventId } from "@/lib/hash";
import {
	API_BASE,
	LIST_PATH,
	TIMEOUT_MS,
	SOURCE_NAME,
	ID_PREFIX,
	DEFAULT_CATEGORY,
	NON_TECH_CATEGORIES,
	JUNK_TITLE_RE,
} from "./konfhub.constants";

interface RawKonfhubEvent {
	name: string;
	event_id: string;
	event_url: string;
	featured_url: string;
	event_poster_url?: string;
	start_date: string;
	start_time: string;
	end_date?: string;
	end_time?: string;
	is_free: boolean;
	is_virtual: boolean;
	venue?: string | null;
	featured_category?: string;
	city?: string;
	country?: string;
}

interface RawResponse {
	featuredEvents: RawKonfhubEvent[];
}

// ponytail: API times are UTC; the site renders them in IST
function parseUtc(date: string, time: string): Date {
	return new Date(`${date}T${time}Z`);
}

export class KonfhubClient implements Ingester {
	readonly id = "konfhub";

	async fetch(): Promise<NormalizedEvent[]> {
		const res = await fetch(`${API_BASE}${LIST_PATH}`, {
			signal: AbortSignal.timeout(TIMEOUT_MS),
		});
		if (!res.ok)
			throw new Error(`KonfHub API returned ${res.status}`);

		const body: RawResponse = await res.json();
		const now = new Date();

		const filtered = (body.featuredEvents || []).filter((e) => {
			if (!e.name || !e.event_id) return false;
			if (isPast(e, now)) return false;
			return isTech(e);
		});

		console.log(
			`  -> ${filtered.length} events (filtered ${(body.featuredEvents || []).length - filtered.length} non-tech/past)`,
		);

		return filtered.map((e) => this.normalize(e));
	}

	private normalize(raw: RawKonfhubEvent): NormalizedEvent {
		const deterministicId = makeEventId(ID_PREFIX, raw.event_id);

		const startDateTime = parseUtc(raw.start_date, raw.start_time);

		let endDateTime: Date | undefined;
		if (raw.end_date && raw.end_time) {
			endDateTime = parseUtc(raw.end_date, raw.end_time);
		}

		const tags: string[] = [];
		if (raw.is_free) tags.push("free");

		return {
			_id: deterministicId,
			title: raw.name,
			description: "",
			startDateTime,
			endDateTime,
			location: {
				name: raw.venue || "",
				city: raw.city || undefined,
			},
			eventType: raw.is_virtual ? "online" : "in-person",
			sourceName: SOURCE_NAME,
			originalUrl: raw.featured_url,
			imageUrl: raw.event_poster_url,
			category: raw.featured_category || DEFAULT_CATEGORY,
			tags: tags.length > 0 ? tags : undefined,
			updatedAt: new Date(),
		};
	}
}

function isPast(event: RawKonfhubEvent, now: Date): boolean {
	if (!event.end_date) {
		return parseUtc(event.start_date, event.start_time) < now;
	}
	return parseUtc(event.end_date, event.end_time || "00:00:00") < now;
}

function isTech(event: RawKonfhubEvent): boolean {
	if (NON_TECH_CATEGORIES.includes(event.featured_category || ""))
		return false;
	return !JUNK_TITLE_RE.test(event.name);
}