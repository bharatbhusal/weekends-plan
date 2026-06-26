import { Ingester } from "../base";
import { NormalizedEvent } from "@/types/event";
import { makeEventId } from "@/lib/hash";
import { cleanLocation } from "../location-cleaner";

const NEXT_DATA_RE =
	/<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/;

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
			events.push(val as MeetupRawEvent);
		}
	}
	return events;
}

function meetupCitySlug(city: string): string {
	const map: Record<string, string> = {
		bengaluru: "bengaluru",
		mumbai: "mumbai",
		"new-delhi": "new-delhi--india",
		hyderabad: "hyderabad",
		pune: "pune",
		chennai: "chennai",
		kolkata: "kolkata",
		ahmedabad: "ahmedabad",
		jaipur: "jaipur",
		lucknow: "lucknow",
		gurugram: "gurugram",
		noida: "noida",
		kochi: "kochi",
		chandigarh: "chandigarh",
	};
	return map[city] || `${city}--india`;
}

export class MeetupClient implements Ingester {
	readonly id = "meetup";

	async fetch(
		config: Record<string, unknown>,
	): Promise<NormalizedEvent[]> {
		const cities = (config.cities as string[]) || [];
		const results: NormalizedEvent[] = [];

		for (const city of cities) {
			try {
				const events = await this.fetchCity(city);
				results.push(...events);
			} catch (err) {
				console.warn(
					`Meetup [${city}]: ${err instanceof Error ? err.message : String(err)}`,
				);
			}
		}

		return results;
	}

	private async fetchCity(
		city: string,
	): Promise<NormalizedEvent[]> {
		const slug = meetupCitySlug(city);
		const url = `https://www.meetup.com/find/?keywords=tech,workshop,hackathon,conference,startup&location=${slug}&source=EVENTS&eventType=inPerson,online`;

		const res = await fetch(url, {
			headers: {
				"User-Agent":
					"Mozilla/5.0 (compatible; WeekendsPlan/1.0)",
				Accept: "text/html",
			},
			signal: AbortSignal.timeout(15000),
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
		return rawEvents.map((e) => this.normalize(e, city));
	}

	private normalize(
		raw: MeetupRawEvent,
		city: string,
	): NormalizedEvent {
		const deterministicId = makeEventId("meetup", raw.id);

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
			sourceName: "meetup",
			originalUrl:
				raw.eventUrl ||
				`https://www.meetup.com/find/?keywords=tech&location=${city}`,
			imageUrl: raw.image?.url || undefined,
			category: "Meetup",
			updatedAt: new Date(),
		};
	}
}
