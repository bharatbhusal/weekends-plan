export const CITY_SLUGS: Record<string, string> = {
	bengaluru: "india--bengaluru",
	mumbai: "india--mumbai",
	"new-delhi": "india--new-delhi",
	hyderabad: "india--hyderabad",
	pune: "india--pune",
	chennai: "india--chennai",
	kolkata: "india--kolkata",
	ahmedabad: "india--ahmedabad",
	jaipur: "india--jaipur",
	lucknow: "india--lucknow",
};

export const CATEGORIES = [
	"science--tech",
	"tech",
	"business--professional",
];

export const BASE_URL = "https://www.eventbrite.com/d/";
export const TIMEOUT_MS = 15000;

export const HEADERS = {
	"User-Agent": "Mozilla/5.0 (compatible; WeekendsPlan/1.0)",
	Accept: "text/html",
};

export const SOURCE_NAME = "eventbrite";
export const ID_PREFIX = "eventbrite";
export const DEFAULT_CATEGORY = "Community";
