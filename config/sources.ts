import { SourceConfig } from "@/types/event";

const SUPPORTED_CITIES = [
	"bengaluru",
	"mumbai",
	"new-delhi",
	"hyderabad",
	"pune",
	"chennai",
	"kolkata",
	"ahmedabad",
	"jaipur",
	"lucknow",
] as const;

export const sourceConfigs: SourceConfig[] = [
	{
		id: "luma",
		name: "Luma",
		type: "API",
		enabled: true,
		config: {
			cities: [...SUPPORTED_CITIES],
			maxEventsPerCity: 40,
		},
	},
	{
		id: "foss_united_ics",
		name: "FOSS United (Calendar)",
		type: "ICS",
		enabled: false,
		config: {
			url: "https://fossunited.org/api/method/fossunited.api.chapter.upcoming_events_ics",
		},
	},
	{
		id: "foss_united_rss",
		name: "FOSS United (RSS)",
		type: "RSS",
		enabled: false,
		config: {
			url: "https://fossunited.org/events/timeline/rss.xml",
		},
	},
	{
		id: "meetup",
		name: "Meetup",
		type: "API",
		enabled: false,
		config: {
			cities: [...SUPPORTED_CITIES],
		},
	},
	{
		id: "eventbrite",
		name: "Eventbrite",
		type: "API",
		enabled: false,
		config: {
			cities: [...SUPPORTED_CITIES],
		},
	},
];
