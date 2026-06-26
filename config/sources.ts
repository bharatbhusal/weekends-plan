import { SourceConfig } from "@/types/event";

export const sourceConfigs: SourceConfig[] = [
	{
		id: "luma",
		name: "Luma",
		type: "API",
		enabled: true,
	},
	{
		id: "foss_united_ics",
		name: "FOSS United (Calendar)",
		type: "ICS",
		enabled: false,
	},
	{
		id: "foss_united_rss",
		name: "FOSS United (RSS)",
		type: "RSS",
		enabled: false,
	},
	{
		id: "meetup",
		name: "Meetup",
		type: "API",
		enabled: false,
	},
	{
		id: "eventbrite",
		name: "Eventbrite",
		type: "API",
		enabled: false,
	},
];
