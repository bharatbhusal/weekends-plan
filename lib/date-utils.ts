function startOfDay(date: Date): Date {
	const d = new Date(date);
	d.setHours(0, 0, 0, 0);
	return d;
}

function addDays(date: Date, n: number): Date {
	const d = new Date(date);
	d.setDate(d.getDate() + n);
	return d;
}

function isSameDay(a: Date, b: Date): boolean {
	return startOfDay(a).getTime() === startOfDay(b).getTime();
}

function endOfMonth(date: Date): Date {
	const d = new Date(
		date.getFullYear(),
		date.getMonth() + 1,
		0,
		23,
		59,
		59,
		999,
	);
	return d;
}

export interface EventSection {
	label: string;
	key: string;
}

export function getSection(
	date: Date,
	now: Date,
	endDate?: Date,
): EventSection {
	if (endDate && date <= now && endDate >= now)
		return { label: "Live", key: "live" };

	const today = startOfDay(now);
	const eventDay = startOfDay(date);

	if (isSameDay(eventDay, today))
		return { label: "Today", key: "today" };

	const tomorrow = addDays(today, 1);
	if (isSameDay(eventDay, tomorrow))
		return { label: "Tomorrow", key: "tomorrow" };

	const weekEnd = addDays(today, 7);
	if (eventDay > tomorrow && eventDay <= weekEnd)
		return { label: "This Week", key: "this-week" };

	const monthEnd = endOfMonth(now);
	if (eventDay > weekEnd && eventDay <= monthEnd)
		return { label: "This Month", key: "this-month" };

	const monthName = new Intl.DateTimeFormat("en-IN", {
		month: "long",
		year: "numeric",
	}).format(date);
	return {
		label: monthName,
		key: `month-${date.getFullYear()}-${date.getMonth()}`,
	};
}

export const SECTION_ORDER = [
	"watch",
	"live",
	"today",
	"tomorrow",
	"this-week",
	"this-month",
];

export function isStaticSection(key: string): boolean {
	return SECTION_ORDER.includes(key);
}
