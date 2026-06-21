import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

export function formatEventDate(date: Date): string {
	return new Intl.DateTimeFormat("en-IN", {
		weekday: "short",
		day: "numeric",
		month: "short",
		hour: "2-digit",
		minute: "2-digit",
	}).format(new Date(date));
}

export function formatDateRange(
	start: Date,
	end?: Date,
): string {
	const startStr = formatEventDate(start);
	if (!end) return startStr;
	const endStr = new Intl.DateTimeFormat("en-IN", {
		hour: "2-digit",
		minute: "2-digit",
	}).format(new Date(end));
	return `${startStr} - ${endStr}`;
}

export function timeAgo(date: Date): string {
	const now = new Date();
	const diffMs = now.getTime() - new Date(date).getTime();
	const diffMins = Math.floor(diffMs / 60000);
	if (diffMins < 60) return `${diffMins}m ago`;
	const diffHours = Math.floor(diffMins / 60);
	if (diffHours < 24) return `${diffHours}h ago`;
	const diffDays = Math.floor(diffHours / 24);
	return `${diffDays}d ago`;
}
