import { NormalizedEvent } from "@/types/event";

export enum CalendarIntent {
  Going = "going",
  Reminder = "reminder",
}

export function isIntentGoing(intent: CalendarIntent): boolean {
  return intent === CalendarIntent.Going;
}

export enum CalendarPlatform {
  Apple = "apple",
  Google = "google",
}

function toDate(value: Date | string): Date {
  return new Date(value);
}

function icsDateTime(d: Date): string {
  return d.toISOString().replace(/[-:]/g, "").slice(0, 15) + "Z";
}

function escapeText(text: string): string {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n");
}

function foldLine(line: string, maxLen = 72): string {
  const lines: string[] = [];
  for (let i = 0; i < line.length; i += maxLen) {
    lines.push(line.slice(i, i + maxLen));
  }
  return lines.join("\r\n ");
}

function toPlain(text: string): string {
  return text
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/[`*_>#]/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

// --- Location -------------------------------------------------------------

function addressParts(event: NormalizedEvent): string {
  return [event.location.name, event.location.address, event.location.city]
    .filter((x) => x && x.length > 0)
    .join(", ");
}

function coordinates(event: NormalizedEvent): string | undefined {
  const c = event.location.coordinates;
  if (c && Number.isFinite(c.lat) && Number.isFinite(c.lng)) {
    return `${c.lat.toFixed(6)}, ${c.lng.toFixed(6)}`;
  }
  return undefined;
}

function eventLocation(event: NormalizedEvent, platform: CalendarPlatform): string {
  if (event.eventType === "online") return "Online";
  const address = addressParts(event);
  const coords = coordinates(event);
  if (platform === CalendarPlatform.Apple) {
    return address || coords || "";
  }
  return coords || address;
}

function venueUrl(event: NormalizedEvent): string | undefined {
  const query = (q: string) =>
    `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;
  const c = event.location.coordinates;
  if (c && Number.isFinite(c.lat) && Number.isFinite(c.lng)) {
    return query(`${c.lat.toFixed(6)},${c.lng.toFixed(6)}`);
  }
  const address = addressParts(event);
  return address ? query(address) : undefined;
}

// --- Shared description ---------------------------------------------------

function buildDescription(event: NormalizedEvent, intent: CalendarIntent): string {
  const parts: string[] = [];
  if (!isIntentGoing(intent)) {
    parts.push("NOT REGISTERED YET", "");
  }
  if (event.description) parts.push(toPlain(event.description));
  return parts.join("\n").trim();
}

// --- Apple Calendar (ICS) ---------------------------------------------------

const CAL_PRODID = "-//Weekends Plan//Events//EN";

function buildICS(event: NormalizedEvent, intent: CalendarIntent): string {
  const start = toDate(event.startDateTime);
  const summary = isIntentGoing(intent) ? event.title : `Reminder: ${event.title}`;
  const description = buildDescription(event, intent);
  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    `PRODID:${CAL_PRODID}`,
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${event._id}@weekends-plan`,
    `DTSTAMP:${icsDateTime(new Date())}`,
    `DTSTART:${icsDateTime(start)}`,
  ];

  if (event.endDateTime) {
    lines.push(`DTEND:${icsDateTime(toDate(event.endDateTime))}`);
  }

  lines.push(`SUMMARY:${escapeText(summary)}`);
  lines.push(`LOCATION:${escapeText(eventLocation(event, CalendarPlatform.Apple))}`);
  lines.push(`DESCRIPTION:${foldLine(escapeText(description))}`);

  const url = isIntentGoing(intent) ? venueUrl(event) : event.originalUrl;
  if (url) lines.push(`URL:${url}`);

  const coords = coordinates(event);
  if (coords) {
    const c = event.location.coordinates!;
    lines.push(`GEO:${c.lat.toFixed(6)};${c.lng.toFixed(6)}`);
  }

  if (!isIntentGoing(intent)) {
    lines.push(
      "BEGIN:VALARM",
      "ACTION:DISPLAY",
      `DESCRIPTION:${escapeText(summary)}`,
      "TRIGGER:-P1D",
      "END:VALARM",
    );
  }

  lines.push("END:VEVENT", "END:VCALENDAR");
  return lines.join("\r\n") + "\r\n";
}

// --- Google Calendar ---------------------------------------------------------

function detailsWithOriginalUrl(event: NormalizedEvent, intent: CalendarIntent): string {
  const base = buildDescription(event, intent);
  if (event.description?.includes(event.originalUrl)) return base;
  return `${base}\n\nOriginal Registration Url: ${event.originalUrl}`;
}

export function toGoogleCalendar(event: NormalizedEvent, intent: CalendarIntent): string {
  const start = toDate(event.startDateTime);
  const end = event.endDateTime
    ? toDate(event.endDateTime)
    : new Date(start.getTime() + 60 * 60 * 1000);
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: isIntentGoing(intent) ? event.title : `Reminder: ${event.title}`,
    dates: `${icsDateTime(start)}/${icsDateTime(end)}`,
    details: isIntentGoing(intent)
      ? buildDescription(event, intent)
      : detailsWithOriginalUrl(event, intent),
    location: eventLocation(event, CalendarPlatform.Google),
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

// --- Exports ------------------------------------------------------------------

export function toAppleCalendar(event: NormalizedEvent, intent: CalendarIntent): string {
  return buildICS(event, intent);
}