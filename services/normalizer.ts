import { NormalizedEvent } from "@/types/event";

export function extractCity(
	locationStr?: string,
): string | undefined {
	if (!locationStr) return undefined;
	const parts = locationStr.split(",").map((s) => s.trim());
	return parts[parts.length - 1];
}

export function truncateDescription(
	text: string,
	maxLen = 500,
): string {
	if (text.length <= maxLen) return text;
	return (
		text.slice(0, maxLen).replace(/\s+\S*$/, "") + "..."
	);
}

export function sanitizeHtml(text: string): string {
	return text
		.replace(/<[^>]*>/g, "")
		.replace(/&amp;/g, "&")
		.replace(/&lt;/g, "<")
		.replace(/&gt;/g, ">")
		.replace(/&quot;/g, '"')
		.replace(/&#39;/g, "'");
}

export function computeEventAgeHours(
	event: NormalizedEvent,
): number {
	const now = Date.now();
	const eventTime = new Date(event.startDateTime).getTime();
	return (eventTime - now) / (1000 * 60 * 60);
}

export function isUpcoming(
	event: NormalizedEvent,
): boolean {
	return computeEventAgeHours(event) > -24;
}
