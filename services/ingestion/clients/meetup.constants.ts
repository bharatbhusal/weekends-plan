export const CATEGORIES: Record<string, string> = {
	technology: "546",
	career: "405",
	science: "436",
	games: "535",
};
export const CITIES: Record<string, string> = {
	bengaluru: "in--Bangalore", // https://www.meetup.com/find/?source=EVENTS&location=in--Bangalore&distance=hundredMiles&categoryId=546
	hyderabad: "in--Hyderabad", // https://www.meetup.com/find/?source=EVENTS&location=in--Hyderabad&distance=hundredMiles&categoryId=546
	new_delhi: "in--Delhi", // https://www.meetup.com/find/?source=EVENTS&location=in--Delhi&distance=hundredMiles&categoryId=546
	mumbai: "in--Mumbai", // https://www.meetup.com/find/?source=EVENTS&location=in--Mumbai&distance=hundredMiles&categoryId=546
};

export const BASE_URL =
	"https://www.meetup.com/find?source=EVENTS&distance=hundredMiles";
export const TIMEOUT_MS = 15000;

export const HEADERS = {
	"User-Agent": "Mozilla/5.0 (compatible; WeekendsPlan/1.0)",
	Accept: "text/html",
};

export const SOURCE_NAME = "meetup";
export const ID_PREFIX = "meetup";
export const DEFAULT_CATEGORY = "Meetup";
