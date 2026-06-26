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

export function timeUntilEvent(
	start: Date,
	end?: Date,
): { label: string; isLive: boolean } {
	const now = new Date();
	const startDate = new Date(start);
	const endDate = end ? new Date(end) : null;

	if (endDate && now >= startDate && now <= endDate) {
		return { label: "Live", isLive: true };
	}

	if (now > startDate) {
		return { label: "", isLive: false };
	}

	const diffMs = startDate.getTime() - now.getTime();
	const diffMins = Math.floor(diffMs / 60000);
	const diffHours = Math.floor(diffMins / 60);
	const diffDays = Math.floor(diffHours / 24);

	if (diffDays >= 1) {
		return { label: `In ${diffDays}d`, isLive: false };
	}
	if (diffHours >= 1) {
		const mins = diffMins % 60;
		return {
			label:
				mins > 0
					? `In ${diffHours}h ${mins}m`
					: `In ${diffHours}h`,
			isLive: false,
		};
	}
	if (diffMins >= 30) {
		return { label: `In ${diffMins}m`, isLive: false };
	}
	return { label: "Starting soon", isLive: false };
}
