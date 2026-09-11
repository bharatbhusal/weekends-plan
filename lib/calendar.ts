import { NormalizedEvent } from "@/types/event";

export enum CalendarIntent {
  Going = "going",
  Reminder = "reminder",
}

export function isIntentGoing(intent: CalendarIntent): boolean {
  return intent === CalendarIntent.Going;
}

export interface CalendarTicket {
  file?: { name: string; mime: string; data: string };
}

export interface CalendarOptions {
  intent: CalendarIntent;
  ticket?: CalendarTicket;
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

function eventLocation(event: NormalizedEvent): string {
  if (event.eventType === "online") return "Online";
  return [event.location.name, event.location.address, event.location.city]
    .filter((x) => x && x.length > 0)
    .join(", ");
}

function venueUrl(event: NormalizedEvent): string | undefined {
  const query = (q: string) =>
    `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;
  const coords = event.location.coordinates;
  if (coords && Number.isFinite(coords.lat) && Number.isFinite(coords.lng)) {
    return query(`${coords.lat.toFixed(6)},${coords.lng.toFixed(6)}`);
  }
  const text = [event.location.name, event.location.address, event.location.city]
    .filter((x) => x && x.length > 0)
    .join(", ");
  return text ? query(text) : undefined;
}

function buildDescription(event: NormalizedEvent, opts: CalendarOptions): string {
  const parts: string[] = [];
  if (!isIntentGoing(opts.intent)) {
    parts.push(`NOT REGISTERED YET`);
    parts.push("");
  }
  if (event.description) parts.push(toPlain(event.description));
  return parts.join("\n").trim();
}

const CAL_PRODID = "-//Weekends Plan//Events//EN";

function buildBlock(event: NormalizedEvent, opts: CalendarOptions): string {
  const start = toDate(event.startDateTime);
  const summary = isIntentGoing(opts.intent) ? event.title : `Reminder: ${event.title}`;
  const description = buildDescription(event, opts);
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
  lines.push(`LOCATION:${escapeText(eventLocation(event))}`);
  lines.push(`DESCRIPTION:${foldLine(escapeText(description))}`);

  const url = isIntentGoing(opts.intent) ? venueUrl(event) : event.originalUrl;
  if (url) lines.push(`URL:${url}`);

  const coords = event.location.coordinates;
  if (coords && Number.isFinite(coords.lat) && Number.isFinite(coords.lng)) {
    lines.push(`GEO:${coords.lat.toFixed(6)};${coords.lng.toFixed(6)}`);
  }

  if (isIntentGoing(opts.intent) && opts.ticket?.file) {
    const base64 = opts.ticket.file.data;
    const folded = base64.match(/.{1,72}/g)?.join("\r\n ") || "";
    lines.push(`ATTACH;FMTTYPE=${opts.ticket.file.mime};ENCODING=BASE64;VALUE=BINARY:${folded}`);
  }

  if (!isIntentGoing(opts.intent)) {
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

export function toICS(event: NormalizedEvent, opts: CalendarOptions): string {
  return buildBlock(event, opts);
}

export function googleCalendarUrl(event: NormalizedEvent, opts: CalendarOptions): string {
  const start = toDate(event.startDateTime);
  const end = event.endDateTime
    ? toDate(event.endDateTime)
    : new Date(start.getTime() + 60 * 60 * 1000);
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: isIntentGoing(opts.intent) ? event.title : `Reminder: ${event.title}`,
    dates: `${icsDateTime(start)}/${icsDateTime(end)}`,
    details: buildDescription(event, opts),
    location: isIntentGoing(opts.intent)
      ? (venueUrl(event) ?? eventLocation(event))
      : eventLocation(event),
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

export function isIOS(): boolean {
  if (typeof navigator === "undefined") return false;
  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
  );
}
