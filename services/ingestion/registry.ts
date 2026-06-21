import { Ingester } from "./base";
import { LumaClient } from "./clients/luma";
import { FossUnitedIcsClient } from "./clients/foss-united-ics";
import { FossUnitedRssClient } from "./clients/foss-united-rss";
import { SourceConfig } from "@/types/event";

const registry = new Map<string, new () => Ingester>();

function register(id: string, ctor: new () => Ingester) {
	registry.set(id, ctor);
}

register("luma", LumaClient);
register("foss_united_ics", FossUnitedIcsClient);
register("foss_united_rss", FossUnitedRssClient);

export function createIngester(
	source: SourceConfig,
): Ingester | null {
	const ctor = registry.get(source.id);
	if (!ctor) return null;
	return new ctor();
}

export function getRegisteredSources(): string[] {
	return Array.from(registry.keys());
}
