import { Ingester } from "../base";
import { NormalizedEvent } from "@/types/event";
import { makeEventId } from "@/lib/hash";
import { matchCity } from "@/lib/city-aliases";
import FeedParser from "feedparser";
import { Readable } from "stream";
import { cleanLocation } from "../location-cleaner";
import {
	MONTHS,
	DATE_RE,
	IST_OFFSET_MS,
	DEFAULT_URL,
	DEFAULT_EVENTS_URL,
	HEADERS,
	SOURCE_NAME,
	ID_PREFIX,
	DEFAULT_CATEGORY,
	DEFAULT_LOCATION,
	DEFAULT_EVENT_IMAGE,
} from "./foss.constants";

function extractFromHtml(
	html: string,
	label: string,
): string | undefined {
	const regex = new RegExp(
		`<strong>${label}:</strong>\\s*([^<]+)`,
		"i",
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
	if (ampm === "PM" && hours !== 12) hours += 12;
	if (ampm === "AM" && hours === 12) hours = 0;
	const utcTs =
		Date.UTC(year, month, day, hours, minutes) -
		IST_OFFSET_MS;
	return new Date(utcTs);
}

function parseDateFromDescription(html: string): {
	start?: Date;
	end?: Date;
} {
	const startRaw = extractFromHtml(html, "Start");
	const endRaw = extractFromHtml(html, "End");
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

function extractLinkFromDescription(
	html: string,
): string | undefined {
	const match = html.match(
		/<a\s+href="([^"]+)">\s*View Event Details/,
	);
	return match?.[1];
}

// ponytail: inline helpers, no need for a separate module

function extractCityFromChapter(chapter: string): string | null {
	const m = chapter.match(
		/^([A-Za-z\s]+?)\s*-?\s*City\s+Community$/i,
	);
	return m ? m[1].trim() : null;
}

function extractCityFromUrl(url: string): string | null {
	const m = url.match(/\/c\/([^/]+)/);
	return m ? matchCity(m[1]) : null;
}

function isOnlineEvent(
	category: string | undefined,
	typeHtml: string,
	locationName: string,
	title: string,
): boolean {
	return (
		(category || "").toLowerCase() === "online" ||
		typeHtml.toLowerCase() === "online" ||
		locationName.toLowerCase() === "online" ||
		title.toLowerCase().includes("– online")
	);
}

export class FossClient implements Ingester {
	readonly id = "foss";

	async fetch(): Promise<NormalizedEvent[]> {
		const res = await fetch(DEFAULT_URL, {
			headers: HEADERS,
		});
		if (!res.ok) {
			throw new Error(
				`FOSS United RSS fetch failed: HTTP ${res.status}`,
			);
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

			parser.on("error", reject);
			parser.on("readable", function () {
				let item;
				while ((item = parser.read())) {
					items.push(item);
				}
			});
			parser.on("end", () => resolve(items));
		});
	}

	private normalize(item: any): NormalizedEvent {
		const originalId = item.guid || item.link || item.title;
		const deterministicId = makeEventId(
			ID_PREFIX,
			originalId,
		);

		const description = item.description || "";
		const parsedDates = parseDateFromDescription(description);

		const startDateTime =
			parsedDates.start ||
			new Date(item.pubDate || item.date || new Date());

		const locationName =
			extractFromHtml(description, "Location") ||
			DEFAULT_LOCATION;
		const chapterRaw =
			extractFromHtml(description, "Chapter") || "";
		const typeHtml =
			extractFromHtml(description, "Type") || "";

		const cleaned = cleanLocation(
			locationName,
			locationName,
			false,
		);

		const eventLink =
			extractLinkFromDescription(description) ||
			item.link ||
			DEFAULT_EVENTS_URL;

		const cleanTitle =
			item.title.replace(/\s*–\s+[^–]+$/, "").trim() ||
			item.title;

		const city =
			extractCityFromChapter(chapterRaw) ||
			extractCityFromUrl(eventLink) ||
			matchCity(locationName) ||
			(isOnlineEvent(
				item.categories?.[0],
				typeHtml,
				locationName,
				item.title,
			)
				? "Online"
				: undefined);

		return {
			_id: deterministicId,
			title: cleanTitle,
			description,
			startDateTime,
			endDateTime: parsedDates.end,
			location: {
				name: cleaned.name,
				address: cleaned.address,
				city,
			},
			sourceName: SOURCE_NAME,
			originalUrl: eventLink,
			imageUrl:
				description.match(/<img[^>]+src="([^"]+)"/i)?.[1] ||
				DEFAULT_EVENT_IMAGE,
			category: item.categories?.[0] || DEFAULT_CATEGORY,
			updatedAt: new Date(),
		};
	}
}
