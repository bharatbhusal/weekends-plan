export const SLUGS = [
	"bengaluru",
	"mumbai",
	"new-delhi",
	"tech",
	"ai",
	"crypto",
] as const;

export const BASE_URL =
	"https://api.luma.com/discover/get-paginated-events";
export const EVENT_URL_BASE = "https://lu.ma";
export const PAGE_LIMIT = 500;
export const MAX_TOTAL_EVENTS = 1000;

export const HEADERS = {
	"User-Agent": "Mozilla/5.0 (compatible; WeekendsPlan/1.0)",
	Origin: "https://luma.com",
	Referer: "https://luma.com/discover",
};

export const SOURCE_NAME = "luma";
export const ID_PREFIX = "luma";
export const DEFAULT_CATEGORY = "Community";
export const DEFAULT_LOCATION = "Online / Virtual";
