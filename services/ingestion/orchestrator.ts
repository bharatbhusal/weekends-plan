import { sourceConfigs } from "@/config/sources";
import { createIngester } from "./registry";
import { NormalizedEvent } from "@/types/event";
import { deduplicate } from "@/services/deduplicator";
import { enrichLumaDescriptions } from "./clients/luma";

export interface IngestionResult {
	totalFetched: number;
	totalUnique: number;
	inserted: number;
	modified: number;
	otherInserted: number;
	otherModified: number;
	sourceResults: Array<{
		source: string;
		count: number;
		error?: string;
	}>;
}
function normalizeCity(
	city: string | null | undefined,
): string | null {
	if (!city) return null;

	const trimmed = city.trim();
	if (!trimmed) return null;

	return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
}

export async function runIngestionPipeline(): Promise<IngestionResult> {
	console.log("=== Starting ingestion pipeline ===");

	const enabledSources = sourceConfigs.filter(
		(s) => s.enabled,
	);
	const allEvents: NormalizedEvent[] = [];
	const sourceResults: IngestionResult["sourceResults"] = [];

	const tasks = enabledSources.map(async (source) => {
		try {
			const ingester = createIngester(source);
			if (!ingester) {
				throw new Error(
					`No ingester registered for source: ${source.id}`,
				);
			}

			console.log(
				`Fetching from [${source.name}] (${source.type})...`,
			);
			const events = await ingester.fetch(source.config);
			console.log(
				`  -> ${events.length} events from ${source.name}`,
			);

			sourceResults.push({
				source: source.name,
				count: events.length,
			});
			return events;
		} catch (err) {
			const msg =
				err instanceof Error ? err.message : String(err);
			console.error(`  -> Failed [${source.name}]: ${msg}`);
			sourceResults.push({
				source: source.name,
				count: 0,
				error: msg,
			});
			return [];
		}
	});

	const resolved = await Promise.allSettled(tasks);
	for (const r of resolved) {
		if (r.status === "fulfilled") allEvents.push(...r.value);
	}

	if (allEvents.length === 0) {
		console.log("No events fetched from any source.");
		return {
			totalFetched: 0,
			totalUnique: 0,
			inserted: 0,
			modified: 0,
			otherInserted: 0,
			otherModified: 0,
			sourceResults,
		};
	}

	const lumaEvents = allEvents.filter(
		(e) => e.sourceName === "luma" && !e.description,
	);
	if (lumaEvents.length > 0) {
		console.log(
			`Enriching ${lumaEvents.length} Luma event descriptions...`,
		);
		await enrichLumaDescriptions(lumaEvents);
	}

	for (const event of allEvents) {
		event.location.city =
			normalizeCity(event.location.city) || undefined;
	}

	const uniqueEvents = deduplicate(allEvents);
	console.log(
		`Dedup: ${allEvents.length} -> ${uniqueEvents.length} unique events`,
	);

	const indianTech: NormalizedEvent[] = [];
	const others: NormalizedEvent[] = [];
	for (const event of uniqueEvents) {
		indianTech.push(event);
	}

	const { MongoClient } = await import("mongodb");
	const uri = process.env.MONGODB_URI;
	if (!uri) throw new Error("MONGODB_URI not set");

	const client = new MongoClient(uri, {
		maxPoolSize: 5,
		minPoolSize: 0,
		maxIdleTimeMS: 5000,
		serverSelectionTimeoutMS: 5000,
	});

	try {
		await client.connect();
		const db = client.db("events_db");

		const writeBatch = async (
			events: NormalizedEvent[],
			collectionName: string,
		) => {
			if (events.length === 0)
				return { upsertedCount: 0, modifiedCount: 0 };
			const collection =
				db.collection<NormalizedEvent>(collectionName);
			const bulkOps = events.map((event) => ({
				updateOne: {
					filter: { _id: event._id },
					update: { $set: event },
					upsert: true,
				},
			}));
			return collection.bulkWrite(bulkOps, { ordered: false });
		};

		const [mainResult, otherResult] = await Promise.all([
			writeBatch(indianTech, "municipal_events"),
			writeBatch(others, "other_events"),
		]);

		console.log(
			`municipal_events: ${mainResult.upsertedCount} inserted, ${mainResult.modifiedCount} updated`,
		);
		console.log(
			`other_events: ${otherResult.upsertedCount} inserted, ${otherResult.modifiedCount} updated`,
		);

		return {
			totalFetched: allEvents.length,
			totalUnique: uniqueEvents.length,
			inserted: mainResult.upsertedCount,
			modified: mainResult.modifiedCount,
			otherInserted: otherResult.upsertedCount,
			otherModified: otherResult.modifiedCount,
			sourceResults,
		};
	} finally {
		await client.close();
	}
}
