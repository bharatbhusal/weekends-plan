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

// ponytail: sanitizeHtml, computeEventAgeHours, isUpcoming removed — unused exports
