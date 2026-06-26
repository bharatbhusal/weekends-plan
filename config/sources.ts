import { SourceConfig } from "@/types/event";

export const sourceConfigs: SourceConfig[] = [
	{
		id: "luma",
		name: "Luma",
		type: "API",
		enabled: false,
	},
	{
		id: "foss",
		name: "FOSS",
		type: "RSS",
		enabled: true,
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
