import { Ingester } from "./base";
import { LumaClient } from "./clients/luma";
import { MeetupClient } from "./clients/meetup";
import { EventbriteClient } from "./clients/eventbrite";
import { FossClient } from "./clients/foss";

const INGESTERS: Record<string, new () => Ingester> = {
	luma: LumaClient,
	foss: FossClient,
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
