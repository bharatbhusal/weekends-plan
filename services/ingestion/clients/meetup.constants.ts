export const CITY_SLUGS: Record<string, string> = {
	bengaluru: "bengaluru",
	mumbai: "mumbai",
	"new-delhi": "new-delhi--india",
	hyderabad: "hyderabad",
	pune: "pune",
	chennai: "chennai",
	kolkata: "kolkata",
	ahmedabad: "ahmedabad",
	jaipur: "jaipur",
	lucknow: "lucknow",
	gurugram: "gurugram",
	noida: "noida",
	kochi: "kochi",
	chandigarh: "chandigarh",
};

export const BASE_URL = "https://www.meetup.com/find/";
export const TIMEOUT_MS = 15000;
export const SEARCH_KEYWORDS =
	"tech,workshop,hackathon,conference,startup";

export const HEADERS = {
	"User-Agent": "Mozilla/5.0 (compatible; WeekendsPlan/1.0)",
	Accept: "text/html",
};

export const SOURCE_NAME = "meetup";
export const ID_PREFIX = "meetup";
export const DEFAULT_CATEGORY = "Meetup";
