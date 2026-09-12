import { NormalizedEvent } from "@/types/event";

function pickMoreSpecific(a: string, b: string): string {
	const isGeneric = (u: string) => {
		try {
			const p = new URL(u);
			return p.pathname === "/" || p.pathname === "/events";
		} catch {
			return false;
		}
	};
	if (isGeneric(a)) return b;
	if (isGeneric(b)) return a;
	return a.length <= b.length ? a : b;
}

function calculateJaccardSimilarity(
	a: string,
	b: string,
): number {
	const tokenize = (s: string) =>
		new Set(
			s
				.toLowerCase()
				.replace(/[^a-z0-9\s]/g, "")
				.split(/\s+/)
				.filter(Boolean),
		);

	const setA = tokenize(a);
	const setB = tokenize(b);

	if (setA.size === 0 && setB.size === 0) return 1;
	if (setA.size === 0 || setB.size === 0) return 0;

	let intersection = 0;
	setA.forEach((token) => {
		if (setB.has(token)) intersection++;
	});

	const unionArr = Array.from(setA);
	setB.forEach((token) => {
		if (!setA.has(token)) unionArr.push(token);
	});
	const union = new Set(unionArr);
	return intersection / union.size;
}

export function deduplicate(
	events: NormalizedEvent[],
): NormalizedEvent[] {
	const unique: NormalizedEvent[] = [];
	const seenTitles = new Map<string, NormalizedEvent>();
	const twoHoursMs = 2 * 60 * 60 * 1000;

	const mergeInto = (target: NormalizedEvent, from: NormalizedEvent) => {
		target.originalUrl = pickMoreSpecific(
			target.originalUrl,
			from.originalUrl,
		);
		if (!target.imageUrl && from.imageUrl) {
			target.imageUrl = from.imageUrl;
		}
	};

	for (const incoming of events) {
		const titleKey = incoming.title.trim().toLowerCase();
		const titleMatch = seenTitles.get(titleKey);
		if (titleMatch) {
			mergeInto(titleMatch, incoming);
			continue;
		}

		let isDuplicate = false;

		for (const existing of unique) {
			const timeDiff = Math.abs(
				new Date(incoming.startDateTime).getTime() -
					new Date(existing.startDateTime).getTime(),
			);

			if (timeDiff <= twoHoursMs) {
				const similarity = calculateJaccardSimilarity(
					incoming.title,
					existing.title,
				);

				if (similarity > 0.85) {
					isDuplicate = true;
					mergeInto(existing, incoming);
					break;
				}
			}
		}

		if (!isDuplicate) {
			unique.push(incoming);
			seenTitles.set(titleKey, incoming);
		}
	}

	return unique;
}
