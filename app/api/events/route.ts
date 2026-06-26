import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { NormalizedEvent } from "@/types/event";

export const revalidate = 86400;

export async function GET() {
	try {
		const db = await connectToDatabase();

		const events = await db
			.collection<NormalizedEvent>("municipal_events")
			.find()
			.sort({ startDateTime: 1 })
			.toArray();

		return NextResponse.json({
			success: true,
			count: events.length,
			data: events,
		});
	} catch (error) {
		const message =
			error instanceof Error
				? error.message
				: "Internal server error";
		return NextResponse.json(
			{ success: false, error: message },
			{ status: 500 },
		);
	}
}
