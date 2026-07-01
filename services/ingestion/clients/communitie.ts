import { Ingester } from "../base";
import { NormalizedEvent } from "@/types/event";
import { makeEventId } from "@/lib/hash";
import { cleanLocation } from "../location-cleaner";
import {
	BASE_URL,
	HYDERABAD_PATH,
	SOURCE_NAME,
	ID_PREFIX,
	DEFAULT_CATEGORY,
	CITY,
	TIMEOUT_MS,
} from "./communitie.constants";

interface ScheduleSlot {
	slotDate: string;
	startTime: string;
	durationMinutes: number;
	active: boolean;
	ticketAvailability: string;
}

interface TimeSlot {
	venueName: string;
	address: string;
	locationLink?: string;
	scheduleSlots: ScheduleSlot[];
}

interface RawEvent {
	id: string;
	title: string;
	slug: string;
	shortDesc: string;
	longDesc: string;
	minimumBasePrice: number;
	status: string;
	ticketAvailability: string;
	clubName?: string;
	tags: string[];
	communitieOriginal: boolean;
	featured: boolean;
	portraitImageUrl?: string;
	landscapeImageUrl?: string;
	timeSlots: TimeSlot[];
}

interface Section {
	section: string;
	title: string;
	description: string;
	events: RawEvent[];
}

interface SectionsData {
	sections: Section[];
}

const SECTIONS_RE =
	/\\"sections\\":\[/;

async function fetchPageHtml(): Promise<string> {
	const url = `${BASE_URL}${HYDERABAD_PATH}`;
	const res = await fetch(url, {
		headers: {
			"User-Agent":
				"Mozilla/5.0 (compatible; WeekendsPlan/1.0)",
		},
		signal: AbortSignal.timeout(TIMEOUT_MS),
	});
	if (!res.ok)
		throw new Error(
			`Communitie page returned ${res.status}`,
		);
	return res.text();
}

function extractSectionsJson(
	html: string,
): Section[] {
	const startIdx = html.search(SECTIONS_RE);
	if (startIdx < 0) {
		throw new Error("Could not find sections data in page");
	}

	let pos = startIdx + String.raw`\"sections\":[`.length;
	let depth = 1;
	let json = "[";
	while (depth > 0 && pos < html.length) {
		const c = html[pos];
		if (c === "[" && html[pos - 1] !== "\\") depth++;
		else if (c === "]" && html[pos - 1] !== "\\") {
			depth--;
			if (depth === 0) {
				json += c;
				break;
			}
		}
		json += c;
		pos++;
	}

	const unescaped = json
		.replace(/\\"/g, '"')
		.replace(/\\\\/g, "\\");
	return JSON.parse(unescaped);
}

const DOLLAR_REF_RE = /^\$/;

function resolveDescription(
	raw: RawEvent,
): string {
	if (
		raw.longDesc &&
		!DOLLAR_REF_RE.test(raw.longDesc)
	) {
		return raw.longDesc;
	}
	return raw.shortDesc || "";
}

function parseDateTime(
	slotDate: string,
	startTime: string,
): Date {
	const [y, m, d] = slotDate.split("-").map(Number);
	const [hh, mm, ss] = startTime.split(":").map(Number);
	return new Date(y, m - 1, d, hh, mm, ss || 0);
}

export class CommunitieClient implements Ingester {
	readonly id = "communitie";

	async fetch(): Promise<NormalizedEvent[]> {
		const html = await fetchPageHtml();
		const sections = extractSectionsJson(html);

		const seen = new Set<string>();
		const results: NormalizedEvent[] = [];

		for (const section of sections) {
			for (const raw of section.events) {
				if (!raw.title || !raw.slug) continue;
				if (seen.has(raw.slug)) continue;
				seen.add(raw.slug);

				const normalized =
					this.normalize(raw);
				if (normalized) results.push(normalized);
			}
		}

		console.log(
			`  -> ${results.length} events from Communitie`,
		);
		return results;
	}

	private normalize(
		raw: RawEvent,
	): NormalizedEvent | null {
		const timeSlot = raw.timeSlots?.[0];
		const scheduleSlot = timeSlot?.scheduleSlots?.[0];
		if (!scheduleSlot || !scheduleSlot.active) return null;

		const deterministicId = makeEventId(
			ID_PREFIX,
			raw.slug,
		);

		const startDateTime = parseDateTime(
			scheduleSlot.slotDate,
			scheduleSlot.startTime,
		);

		let endDateTime: Date | undefined;
		if (scheduleSlot.durationMinutes) {
			endDateTime = new Date(
				startDateTime.getTime() +
					scheduleSlot.durationMinutes *
						60 *
						1000,
			);
		}

		const imageUrl =
			raw.portraitImageUrl ||
			raw.landscapeImageUrl ||
			undefined;

		const tags: string[] = [];
		if (raw.tags?.length) tags.push(...raw.tags);
		if (raw.communitieOriginal) tags.push("OG");
		if (
			raw.ticketAvailability === "SOLD_OUT"
		)
			tags.push("sold_out");

		return {
			_id: deterministicId,
			title: raw.title,
			description: resolveDescription(raw),
			startDateTime,
			endDateTime,
			location: {
				name: timeSlot.venueName || "",
				address: timeSlot.address || undefined,
				city: CITY,
			},
			sourceName: SOURCE_NAME,
			originalUrl: `${BASE_URL}/events/${raw.slug}`,
			imageUrl,
			category: DEFAULT_CATEGORY,
			tags: tags.length > 0 ? tags : undefined,
			updatedAt: new Date(),
		};
	}
}
