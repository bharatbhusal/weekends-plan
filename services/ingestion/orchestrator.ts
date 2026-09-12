import { sourceConfigs } from "@/config/sources";
import { createIngester } from "./registry";
import { NormalizedEvent } from "@/types/event";
import { deduplicate } from "@/services/deduplicator";
import { generalizeCity } from "@/lib/city-aliases";

export interface IngestionResult {
	totalFetched: number;
	totalUnique: number;
	inserted: number;
	modified: number;
	sourceResults: Array<{
		source: string;
		count: number;
		error?: string;
	}>;
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
			const ingester = createIngester(source.id);
			if (!ingester) {
				throw new Error(
					`No ingester registered for source: ${source.id}`,
				);
			}

			console.log(
				`Fetching from [${source.name}] (${source.type})...`,
			);
			const events = await ingester.fetch();
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
			sourceResults,
		};
	}

	for (const event of allEvents) {
		event.location.city =
			generalizeCity(event.location.city) || undefined;
	}

	const uniqueEvents = deduplicate(allEvents);
	console.log(
		`Dedup: ${allEvents.length} -> ${uniqueEvents.length} unique events`,
	);

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

		const today = new Date();
		today.setHours(0, 0, 0, 0);
		const pastMain = await db
			.collection("municipal_events")
			.deleteMany({ startDateTime: { $lt: today } });
		console.log(
			`Cleaned up ${pastMain.deletedCount} past events from municipal_events`,
		);

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

		const mainResult = await writeBatch(
			uniqueEvents,
			"municipal_events",
		);

		console.log(
			`municipal_events: ${mainResult.upsertedCount} inserted, ${mainResult.modifiedCount} updated`,
		);

		return {
			totalFetched: allEvents.length,
			totalUnique: uniqueEvents.length,
			inserted: mainResult.upsertedCount,
			modified: mainResult.modifiedCount,
			sourceResults,
		};
	} finally {
		await client.close();
	}
}
