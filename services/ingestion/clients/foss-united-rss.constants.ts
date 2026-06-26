export const MONTHS: Record<string, number> = {
	jan: 0,
	january: 0,
	feb: 1,
	february: 1,
	mar: 2,
	march: 2,
	apr: 3,
	april: 3,
	may: 4,
	jun: 5,
	june: 5,
	jul: 6,
	july: 6,
	aug: 7,
	august: 7,
	sep: 8,
	september: 8,
	oct: 9,
	october: 9,
	nov: 10,
	november: 10,
	dec: 11,
	december: 11,
};

export const DATE_RE =
	/^(\d{1,2})\s+(\w+)\s+(\d{4}),\s*(\d{1,2}):(\d{2})\s+(AM|PM)$/i;
export const IST_OFFSET_MS = (5 * 60 + 30) * 60 * 1000;

export const DEFAULT_URL =
	"https://fossunited.org/events/timeline/rss.xml";
export const DEFAULT_EVENTS_URL =
	"https://fossunited.org/events";

export const HEADERS = { "User-Agent": "WeekendsPlan/1.0" };

export const SOURCE_NAME = "foss_united";
export const ID_PREFIX = "fossunited_rss";
export const DEFAULT_CATEGORY = "Technology";
export const DEFAULT_LOCATION = "FOSS United";
