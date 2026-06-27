const CITY_ALIASES: [string, string[]][] = [
	[
		"Hyderabad",
		[
			"hyderabad",
			"hydrabad",
			"hyd",
			"gandipet",
			"secunderabad",
			"gachibowli",
			"hitec city",
			"hiteccity",
			"kukatpally",
			"madhapur",
			"miyapur",
			"begumpet",
			"jubilee hills",
			"jubileehills",
			"banjara hills",
			"banjarahills",
			"kondapur",
			"ameerpet",
		],
	],
	[
		"Bengaluru",
		[
			"bengaluru",
			"bangalore",
			"whitefield",
			"indiranagar",
			"koramangala",
			"marathahalli",
			"electronic city",
			"electroniccity",
			"btm layout",
			"btmlayout",
			"jayanagar",
			"mg road",
			"mgroad",
			"hsr layout",
			"hsrlayout",
			"bannerghatta",
			"yeshwanthpur",
			"hebbal",
			"bellandur",
			"sarjapur",
			"yelahanka",
		],
	],
	[
		"Mumbai",
		[
			"mumbai",
			"bombay",
			"andheri",
			"bandra",
			"powai",
			"borivali",
			"dadar",
			"colaba",
			"goregaon",
			"malad",
			"thane",
			"navi mumbai",
			"navimumbai",
			"vashi",
			"kanjur",
			"kurla",
			"lower parel",
			"lowerparel",
			"worli",
			"bkc",
		],
	],
	[
		"New Delhi",
		[
			"delhi",
			"new delhi",
			"newdelhi",
			"new-delhi",
			"connaught place",
			"connaughtplace",
			"dwarka",
			"saket",
			"rohini",
			"lajpat nagar",
			"lajpatnagar",
			"nehru place",
			"nehruplace",
			"gurgaon",
			"noida",
			"ghaziabad",
			"faridabad",
			"vasant kunj",
			"vasantkunj",
			"karol bagh",
			"karolbagh",
			"janakpuri",
			"pitampura",
		],
	],
	[
		"Pune",
		[
			"pune",
			"hinjewadi",
			"kharadi",
			"baner",
			"koregaon park",
			"koregaonpark",
			"aundh",
			"shivajinagar",
			"wakad",
			"magarpatta",
			"viman nagar",
			"vimannagar",
			"kalyani nagar",
			"kalyaninagar",
			"hadapsar",
			"pimpri",
			"chinchwad",
		],
	],
	[
		"Chennai",
		[
			"chennai",
			"madras",
			"omr",
			"velachery",
			"t nagar",
			"tnagar",
			"adyar",
			"anna nagar",
			"annanagar",
			"guindy",
			"porur",
			"tambaram",
			"chromepet",
			"mylapore",
			"thoraipakkam",
			"sholinganallur",
			"perungudi",
			"egmore",
		],
	],
];

const CITY_PATTERNS: [string, string][] = [];
for (const [canonical, aliases] of CITY_ALIASES) {
	for (const alias of aliases) {
		CITY_PATTERNS.push([canonical, alias]);
	}
}

export function matchCity(
	raw: string | null | undefined,
): string | null {
	if (!raw) return null;
	const cleaned = raw
		.trim()
		.toLowerCase()
		.replace(/[-_]+/g, "")
		.trim();
	if (!cleaned) return null;
	for (const [canonical, pattern] of CITY_PATTERNS) {
		if (
			cleaned.includes(pattern) ||
			pattern.includes(cleaned)
		) {
			return canonical;
		}
	}
	return null;
}

export function generalizeCity(
	raw: string | null | undefined,
): string | null {
	if (!raw) return null;
	const cleaned = raw.trim();
	if (!cleaned) return null;

	const normalized = cleaned
		.toLowerCase()
		.replace(/[-_]+/g, "")
		.trim();

	for (const [canonical, pattern] of CITY_PATTERNS) {
		if (
			normalized.includes(pattern) ||
			pattern.includes(normalized)
		) {
			return canonical;
		}
	}

	return null;
}
