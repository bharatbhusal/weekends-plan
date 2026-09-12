import { SourceConfig } from "@/types/event";

export const sourceConfigs: SourceConfig[] = [
	{
		id: "luma",
		name: "Luma",
		type: "API",
		enabled: true,
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
		enabled: true,
	},
	{
		id: "eventbrite",
		name: "Eventbrite",
		type: "API",
		enabled: true,
	},
	{
		id: "goavo",
		name: "GoAvo",
		type: "API",
		enabled: true,
	},
	{
		id: "communitie",
		name: "Communitie",
		type: "SCRAPE",
		enabled: false,
	},
	{
		id: "konfhub",
		name: "KonfHub",
		type: "API",
		enabled: true,
	},
];
