import { connectToDatabase } from "@/lib/mongodb";
import { NormalizedEvent } from "@/types/event";

export async function getEvents(
	collectionName: string,
): Promise<NormalizedEvent[]> {
	try {
		const db = await connectToDatabase();
		const events = await db
			.collection<NormalizedEvent>(collectionName)
			.find()
			.sort({ startDateTime: 1 })
			.limit(200)
			.toArray();
		return JSON.parse(JSON.stringify(events));
	} catch (err) {
		if (process.env.NODE_ENV === "development") {
			console.warn(
				"getEvents: Unable to fetch from database:",
				err,
			);
		}
		return [];
	}
}
