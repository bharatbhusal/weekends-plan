import { NormalizedEvent } from "@/types/event";

const ALLOWED_CATEGORIES = new Set([
  "workshop",
  "conference",
  "meetup",
  "meet up",
  "hackathon",
  "tech talk",
  "show",
  "seminar",
  "technology",
  "coding",
  "programming",
  "summit",
  "developer",
  "startup",
]);

const GENERIC_CATEGORIES = new Set([
  "",
  "community",
  "open source",
  "general",
  "technology",
  "other",
]);

const TITLE_KEYWORDS = [
  /\bworkshop\b/i,
  /\bhackathon\b/i,
  /\bmeetup\b/i,
  /\bconference\b/i,
  /\btech\b/i,
  /\bcoding\b/i,
  /\bprogramming\b/i,
  /\bshow\b/i,
  /\bsummit\b/i,
  /\bdeveloper\b/i,
  /\bstartup\b/i,
  /\bai\b/i,
  /\bml\b/i,
  /\bdata\b/i,
  /\bcloud\b/i,
  /\bdevops\b/i,
  /\bpython\b/i,
  /\bjavascript\b/i,
  /\breact\b/i,
  /\bnode\.?js\b/i,
  /\bopen source\b/i,
  /\bengineering\b/i,
  /\bgolang\b/i,
  /\brust\b/i,
];

export function isEventAllowed(event: NormalizedEvent): boolean {
  const category = (event.category || "").toLowerCase().trim();

  if (ALLOWED_CATEGORIES.has(category)) return true;

  if (GENERIC_CATEGORIES.has(category)) {
    return TITLE_KEYWORDS.some((re) => re.test(event.title));
  }

  return false;
}

export function filterEvents(events: NormalizedEvent[]): NormalizedEvent[] {
  const before = events.length;
  const filtered = events.filter(isEventAllowed);
  const removed = before - filtered.length;
  if (removed > 0) {
    console.log(`Filter: removed ${removed} non-tech events`);
  }
  return filtered;
}
