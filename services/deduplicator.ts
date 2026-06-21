import { NormalizedEvent } from "@/types/event";

export class EventDeduplicator {
	private static calculateJaccardSimilarity(
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

	static deduplicate(
		events: NormalizedEvent[],
	): NormalizedEvent[] {
		const unique: NormalizedEvent[] = [];
		const twoHoursMs = 2 * 60 * 60 * 1000;

		for (const incoming of events) {
			let isDuplicate = false;

			for (const existing of unique) {
				const timeDiff = Math.abs(
					new Date(incoming.startDateTime).getTime() -
						new Date(existing.startDateTime).getTime(),
				);

				if (timeDiff <= twoHoursMs) {
					const similarity = this.calculateJaccardSimilarity(
						incoming.title,
						existing.title,
					);

					if (similarity > 0.85) {
						isDuplicate = true;
						existing.originalUrl = `${existing.originalUrl} | ${incoming.originalUrl}`;
						if (!existing.imageUrl && incoming.imageUrl) {
							existing.imageUrl = incoming.imageUrl;
						}
						break;
					}
				}
			}

			if (!isDuplicate) {
				unique.push(incoming);
			}
		}

		return unique;
	}
}
