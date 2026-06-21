const CITY_ALIASES: Record<string, string> = {
  // Bengaluru
  bengaluru: "Bengaluru",
  bangalore: "Bengaluru",
  banglore: "Bengaluru",
  बेंगलुरु: "Bengaluru",
  ಬೆಂಗಳೂರು: "Bengaluru",

  // Mumbai
  mumbai: "Mumbai",
  bombay: "Mumbai",
  मुंबई: "Mumbai",

  // Delhi
  delhi: "Delhi",
  "new delhi": "Delhi",
  "new-delhi": "Delhi",
  "new delhi ": "Delhi",
  दिल्ली: "Delhi",

  // Gurugram
  gurugram: "Gurugram",
  gurgaon: "Gurugram",

  // Hyderabad
  hyderabad: "Hyderabad",
  हैदराबाद: "Hyderabad",

  // Pune
  pune: "Pune",
  पुणे: "Pune",

  // Chennai
  chennai: "Chennai",
  madras: "Chennai",
  चेन्नई: "Chennai",

  // Kolkata
  kolkata: "Kolkata",
  calcutta: "Kolkata",
  कोलकाता: "Kolkata",

  // Noida
  noida: "Noida",

  // Lucknow
  lucknow: "Lucknow",
  लखनऊ: "Lucknow",

  // Kochi
  kochi: "Kochi",
  cochin: "Kochi",
  कोच्चि: "Kochi",

  // Jaipur
  jaipur: "Jaipur",
  जयपुर: "Jaipur",

  // Ahmedabad
  ahmedabad: "Ahmedabad",
  अहमदाबाद: "Ahmedabad",

  // Chandigarh
  chandigarh: "Chandigarh",

  // Indore
  indore: "Indore",

  // Bhopal
  bhopal: "Bhopal",

  // Surat
  surat: "Surat",

  // Nagpur
  nagpur: "Nagpur",

  // Goa
  goa: "Goa",
  panaji: "Goa",

  // Guwahati
  guwahati: "Guwahati",

  // Visakhapatnam
  visakhapatnam: "Visakhapatnam",
  vizag: "Visakhapatnam",

  // Bhubaneswar
  bhubaneswar: "Bhubaneswar",
  bhubaneshwar: "Bhubaneswar",

  // Coimbatore
  coimbatore: "Coimbatore",

  // Mangaluru
  mangalore: "Mangaluru",
  mangaluru: "Mangaluru",

  // Mysuru
  mysore: "Mysuru",
  mysuru: "Mysuru",

  // Vadodara
  vadodara: "Vadodara",
  baroda: "Vadodara",

  // Nashik
  nashik: "Nashik",

  // Ranchi
  ranchi: "Ranchi",

  // Jamshedpur
  jamshedpur: "Jamshedpur",

  // Dehradun
  dehradun: "Dehradun",

  // Thiruvananthapuram
  thiruvananthapuram: "Thiruvananthapuram",
  trivandrum: "Thiruvananthapuram",

  // Kozhikode
  kozhikode: "Kozhikode",
  calicut: "Kozhikode",
};

const INDIAN_CITIES_SET = new Set(
  Object.values(CITY_ALIASES).filter((v, i, a) => a.indexOf(v) === i),
);

const NEIGHBORHOOD_MAP: Record<string, string> = {
  // Bengaluru neighborhoods
  hebbagodi: "Bengaluru",
  thirumenahalli: "Bengaluru",
  kadubeesanahalli: "Bengaluru",
  bellandur: "Bengaluru",
  hsr: "Bengaluru",
  "hsr layout": "Bengaluru",
  kormangala: "Bengaluru",
  koramangala: "Bengaluru",
  indiranagar: "Bengaluru",
  jayanagar: "Bengaluru",
  whitefield: "Bengaluru",
  marathahalli: "Bengaluru",
  sarjapur: "Bengaluru",
  electroniccity: "Bengaluru",
  "electronic city": "Bengaluru",
  btm: "Bengaluru",
  "btm layout": "Bengaluru",
  banashankari: "Bengaluru",
  yeshwanthpur: "Bengaluru",
  yelahanka: "Bengaluru",
  rajajinagar: "Bengaluru",
  malleshwaram: "Bengaluru",
  peenya: "Bengaluru",
  domlur: "Bengaluru",
  hal: "Bengaluru",
  "jp nagar": "Bengaluru",

  // Delhi neighborhoods
  connaught: "Delhi",
  "connaught place": "Delhi",
  dwarka: "Delhi",
  rohini: "Delhi",
  saket: "Delhi",
  lajpat: "Delhi",
  "lajpat nagar": "Delhi",
  hauz: "Delhi",
  "hauz khas": "Delhi",
  pitampura: "Delhi",
  mayur: "Delhi",
  "mayur vihar": "Delhi",
  pragati: "Delhi",
  "pragati maidan": "Delhi",

  // Mumbai neighborhoods
  lower: "Mumbai",
  "lower parel": "Mumbai",
  bandra: "Mumbai",
  andheri: "Mumbai",
  powai: "Mumbai",
  goregaon: "Mumbai",
  malad: "Mumbai",
  thane: "Mumbai",
  navi: "Mumbai",
  "navi mumbai": "Mumbai",
  vile: "Mumbai",
  "vile parle": "Mumbai",
  kurla: "Mumbai",
  bkc: "Mumbai",
  "bandra kurla complex": "Mumbai",
  colaba: "Mumbai",
  churchgate: "Mumbai",
  dadar: "Mumbai",
  borivali: "Mumbai",

  // Hyderabad
  madhapur: "Hyderabad",
  gachibowli: "Hyderabad",
  hitech: "Hyderabad",
  "hitech city": "Hyderabad",
  kondapur: "Hyderabad",
  kukatpally: "Hyderabad",
  banjara: "Hyderabad",
  "banjara hills": "Hyderabad",
  jubilee: "Hyderabad",
  "jubilee hills": "Hyderabad",
  miyapur: "Hyderabad",

  // Pune neighborhoods
  kharadi: "Pune",
  hinjawadi: "Pune",
  hinjewadi: "Pune",
  baner: "Pune",
  viman: "Pune",
  "viman nagar": "Pune",
  koregaon: "Pune",
  "koregaon park": "Pune",
  shivajinagar: "Pune",
  mg: "Pune",
  "mg road": "Pune",
  camp: "Pune",
  aundh: "Pune",

  // Chennai neighborhoods
  nungambakkam: "Chennai",
  adyar: "Chennai",
  besant: "Chennai",
  "besant nagar": "Chennai",
  velachery: "Chennai",
  tambaram: "Chennai",
  guindy: "Chennai",
  t: "Chennai",
  "t nagar": "Chennai",
  ooty: "Chennai",
  omr: "Chennai",

  // Kolkata neighborhoods
  salt: "Kolkata",
  "salt lake": "Kolkata",
  "salt lake city": "Kolkata",
  "new town": "Kolkata",
  rajarhat: "Kolkata",
  "new town kolkata": "Kolkata",

  // Noida neighborhoods
  sector: "Noida",
};

const NON_CITY_VALUES = new Set([
  "online",
  "online event",
  "various",
  "various locations",
  "tba",
  "to be announced",
  "",
  "stist",
  "samagata foundation",
  "uttar pradesh",
  "india",
  "karnataka",
  "maharashtra",
  "telangana",
  "tamil nadu",
  "kerala",
  "west bengal",
]);

export function normalizeCity(city: string | null | undefined): string | null {
  if (!city) return null;

  const trimmed = city.trim();
  if (!trimmed) return null;

  const lower = trimmed.toLowerCase();
  const alias = CITY_ALIASES[lower];
  if (alias) return alias;

  const neighborhood = NEIGHBORHOOD_MAP[lower];
  if (neighborhood) return neighborhood;

  if (NON_CITY_VALUES.has(lower)) return null;

  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
}

export function isIndianCity(city: string | null | undefined): boolean {
  const normalized = normalizeCity(city);
  if (!normalized) return false;
  if (normalized === "Online") return true;
  return INDIAN_CITIES_SET.has(normalized);
}

export { INDIAN_CITIES_SET as INDIAN_CITIES };
