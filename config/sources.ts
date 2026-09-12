import { SourceConfig } from "@/types/event";

export const sourceConfigs: SourceConfig[] = [
	{
		id: "luma",
		name: "Luma",
		type: "API",
		enabled: true,
		color: "purple",
	},
	{
		id: "foss",
		name: "FOSS",
		type: "RSS",
		enabled: true,
		color: "emerald",
	},
	{
		id: "meetup",
		name: "Meetup",
		type: "API",
		enabled: true,
		color: "red",
	},
	{
		id: "eventbrite",
		name: "Eventbrite",
		type: "API",
		enabled: true,
		color: "orange",
	},
	{
		id: "goavo",
		name: "GoAvo",
		type: "API",
		enabled: true,
		color: "teal",
	},
	{
		id: "communitie",
		name: "Communitie",
		type: "SCRAPE",
		enabled: false,
		color: "pink",
	},
	{
		id: "konfhub",
		name: "KonfHub",
		type: "API",
		enabled: true,
		color: "blue",
	},
];

export interface SourceStyle {
	label: string;
	badgeClass: string;
	gradient: string;
	initial: string;
}

export function getSourceStyle(sourceName: string): SourceStyle {
	const config = sourceConfigs.find(
		(c) => c.id === sourceName.toLowerCase(),
	);
	const label = config?.name || sourceName;
	const color = config?.color || "muted";
	if (color === "muted") {
		return {
			label,
			badgeClass:
				"border-transparent bg-secondary text-secondary-foreground",
			gradient: "from-muted to-muted/50",
			initial: label.charAt(0).toUpperCase() || "?",
		};
	}
	return {
		label,
		badgeClass: `border-transparent bg-${color}-600/20 text-${color}-400`,
		gradient: `from-${color}-600/30 to-${color}-900/20`,
		initial: label.charAt(0).toUpperCase() || "?",
	};
}