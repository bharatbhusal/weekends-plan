const CITY_ALIASES: [string, string[]][] = [
	["Bengaluru", ["bengaluru", "bangalore"]],
	["Hyderabad", ["hyderabad", "hydrabad", "hyd"]],
	["Mumbai", ["mumbai", "bombay"]],
	["Delhi", ["delhi"]],
	["Pune", ["pune"]],
	["Chennai", ["chennai", "madras"]],
	["Kolkata", ["kolkata", "calcutta"]],
	["Ahmedabad", ["ahmedabad"]],
	["Jaipur", ["jaipur"]],
	["Lucknow", ["lucknow"]],
];

const CITY_PATTERNS: [string, string][] = [];
for (const [canonical, aliases] of CITY_ALIASES) {
	for (const alias of aliases) {
		CITY_PATTERNS.push([canonical, alias]);
	}
}

export function generalizeCity(
	raw: string | null | undefined,
): string | null {
	if (!raw) return null;
	const cleaned = raw.trim();
	if (!cleaned) return null;

	const normalized = cleaned
		.toLowerCase()
		.replace(/[-_]+/g, "")
		.trim();

	for (const [canonical, pattern] of CITY_PATTERNS) {
		if (
			normalized.includes(pattern) ||
			pattern.includes(normalized)
		) {
			return canonical;
		}
	}

	return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
}
