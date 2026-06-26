import { Ingester } from "./base";
import { LumaClient } from "./clients/luma";
import { FossUnitedIcsClient } from "./clients/foss-united-ics";
import { FossUnitedRssClient } from "./clients/foss-united-rss";
import { MeetupClient } from "./clients/meetup";
import { EventbriteClient } from "./clients/eventbrite";
import { SourceConfig } from "@/types/event";

const INGESTERS: Record<string, new () => Ingester> = {
	luma: LumaClient,
	foss_united_ics: FossUnitedIcsClient,
	foss_united_rss: FossUnitedRssClient,
	meetup: MeetupClient,
	eventbrite: EventbriteClient,
};

export function createIngester(
	sourceId: string,
): Ingester | null {
	const Ctor = INGESTERS[sourceId];
	return Ctor ? new Ctor() : null;
}

export function getRegisteredSources(): string[] {
	return Object.keys(INGESTERS);
}
