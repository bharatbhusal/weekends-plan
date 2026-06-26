import { Ingester } from "../base";
import { NormalizedEvent } from "@/types/event";
import { makeEventId } from "@/lib/hash";
import ical from "node-ical";
import { cleanLocation } from "../location-cleaner";
import {
	DEFAULT_URL,
	DEFAULT_EVENTS_URL,
	HEADERS,
	SOURCE_NAME,
	ID_PREFIX,
	DEFAULT_CATEGORY,
	DEFAULT_LOCATION,
} from "./foss-united-ics.constants";

function extractCity(raw: string): string | undefined {
	const first = raw.split("\n")[0];
	const parts = first
		.split(",")
		.map((s) => s.trim())
		.filter(Boolean);
	const last = parts[parts.length - 1];
	if (!last || /https?:\/\//i.test(last)) return undefined;
	return last;
}

export class FossUnitedIcsClient implements Ingester {
	readonly id = "foss_united_ics";

	async fetch(): Promise<NormalizedEvent[]> {
		const res = await fetch(DEFAULT_URL, {
			headers: HEADERS,
		});
		if (!res.ok) {
			throw new Error(
				`FOSS United ICS fetch failed: HTTP ${res.status}`,
			);
		}

		const textData = await res.text();
		const parsed = ical.sync.parseICS(textData);
		const events: NormalizedEvent[] = [];

		for (const uid of Object.keys(parsed)) {
			const component = parsed[uid];
			if (component.type !== "VEVENT") continue;

			const vevent = component as ical.VEvent;
			if (!vevent.summary) continue;

			const originalId = vevent.uid || uid;
			const deterministicId = makeEventId(
				ID_PREFIX,
				originalId,
			);

			const rawLocation = vevent.location || "";
			const cleaned = cleanLocation(
				rawLocation,
				rawLocation,
				false,
			);
			const city = extractCity(rawLocation);

			const rawCategories = (vevent as any).categories;
			const category = Array.isArray(rawCategories)
				? rawCategories[0]
				: rawCategories || DEFAULT_CATEGORY;

			events.push({
				_id: deterministicId,
				title: vevent.summary,
				description: vevent.description || "",
				startDateTime: vevent.start
					? new Date(vevent.start)
					: new Date(),
				endDateTime: vevent.end
					? new Date(vevent.end)
					: undefined,
				location: {
					name: rawLocation ? cleaned.name : DEFAULT_LOCATION,
					address: cleaned.address,
					city,
				},
				sourceName: SOURCE_NAME,
				originalUrl: vevent.url || DEFAULT_EVENTS_URL,
				imageUrl: undefined,
				category,
				updatedAt: new Date(),
			});
		}

		return events;
	}
}
