import { Ingester } from "../base";
import { NormalizedEvent } from "@/types/event";
import { makeEventId } from "@/lib/hash";
import { cleanLocation } from "../location-cleaner";
import {
	API_BASE,
	FALLBACK_API_BASE,
	LIST_PATH,
	EVENT_URL_BASE,
	TIMEOUT_MS,
	SOURCE_NAME,
	ID_PREFIX,
	DEFAULT_CATEGORY,
} from "./goavo.constants";

interface RawGoavoEvent {
	id: string;
	title: string;
	slug: string;
	city?: string;
	state?: string;
	startDate: string;
	endDate?: string;
	mode?: string;
	venue?: string;
	locationLabel?: string;
	format?: string;
	hostCommunityName?: string;
	hostCommunitySlug?: string;
	bannerImageUrl?: string;
	description?: string;
	attendeeCount?: number;
	capacity?: number;
	isPaid?: boolean;
	ticketPricePaise?: number;
	ticketCurrency?: string;
	timeZone?: string;
	urlPath?: string;
}

interface RawResponse {
	data: RawGoavoEvent[];
	message?: string;
	status?: boolean;
}

const PLACEHOLDER_VENUE_RE = /\[insert/i;

async function fetchFromBase(
	base: string,
): Promise<RawGoavoEvent[]> {
	const url = `${base}${LIST_PATH}`;
	const res = await fetch(url, {
		signal: AbortSignal.timeout(TIMEOUT_MS),
	});
	if (!res.ok)
		throw new Error(`GoAvo API returned ${res.status}`);
	const body: RawResponse = await res.json();
	return body.data || [];
}

export class GoavoClient implements Ingester {
	readonly id = "goavo";

	async fetch(): Promise<NormalizedEvent[]> {
		let raw: RawGoavoEvent[];

		try {
			raw = await fetchFromBase(API_BASE);
		} catch (err) {
			console.warn(
				`GoAvo primary API failed, trying fallback: ${err}`,
			);
			try {
				raw = await fetchFromBase(FALLBACK_API_BASE);
			} catch (fallbackErr) {
				console.error(
					`GoAvo fallback API also failed: ${fallbackErr}`,
				);
				return [];
			}
		}

		const filtered = raw.filter((e) => {
			if (!e.title || !e.id) return false;
			if (e.venue && PLACEHOLDER_VENUE_RE.test(e.venue))
				return false;
			return true;
		});

		console.log(
			`  -> ${filtered.length} events (filtered ${raw.length - filtered.length} low-quality)`,
		);

		return filtered.map((e) => this.normalize(e));
	}

	private normalize(raw: RawGoavoEvent): NormalizedEvent {
		const deterministicId = makeEventId(ID_PREFIX, raw.id);

		const venueName = raw.venue || "";
		const locationLabel = raw.locationLabel || "";
		const city = raw.city || "";
		const cleaned = cleanLocation(
			venueName || locationLabel || city,
			locationLabel || city,
		);

		const imageUrl = raw.bannerImageUrl?.startsWith("http")
			? raw.bannerImageUrl
			: undefined;

		const originalUrl = raw.slug
			? `${EVENT_URL_BASE}/meetups/view?slug=${raw.slug}`
			: EVENT_URL_BASE;

		const tags: string[] = [];
		if (raw.hostCommunityName)
			tags.push(raw.hostCommunityName);
		if (raw.mode) tags.push(raw.mode);
		if (raw.isPaid) tags.push("paid");

		return {
			_id: deterministicId,
			title: raw.title,
			description: raw.description || "",
			startDateTime: new Date(raw.startDate),
			endDateTime: raw.endDate
				? new Date(raw.endDate)
				: undefined,
			location: {
				name: cleaned.name,
				address: cleaned.address,
				city: city || undefined,
			},
			eventType: raw.mode === "online" ? "online" : undefined,
			sourceName: SOURCE_NAME,
			originalUrl,
			imageUrl,
			category: raw.format || DEFAULT_CATEGORY,
			tags: tags.length > 0 ? tags : undefined,
			updatedAt: new Date(),
		};
	}
}
