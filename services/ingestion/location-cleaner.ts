const URL_RE = /https?:\/\/\S+/g;

function stripUrls(s: string): string {
  return s.replace(URL_RE, "").trim();
}

function firstLine(s: string): string {
  return s.split("\n")[0].trim();
}

function dedupeSegments(s: string): string {
  const parts = s.split(",").map((p) => p.trim()).filter(Boolean);
  const seen = new Set<string>();
  const result: string[] = [];
  for (const p of parts) {
    const key = p.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      result.push(p);
    }
  }
  return result.join(", ");
}

function shorten(s: string): string {
  const parts = s.split(",").map((p) => p.trim()).filter(Boolean);
  return parts.length > 1 ? parts[0] : s;
}

export function cleanLocation(
  rawName: string,
  rawAddress?: string,
  hasCoords?: boolean,
): { name: string; address: string } {
  const cleaned = dedupeSegments(stripUrls(firstLine(rawName || "")));
  const name = hasCoords ? cleaned : shorten(cleaned);
  const address = rawAddress
    ? dedupeSegments(stripUrls(firstLine(rawAddress)))
    : name;
  return { name, address };
}
