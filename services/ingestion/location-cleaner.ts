// ponytail: inline the 5 tiny one-caller helpers

function dedupeAndClean(s: string): string {
  const parts = s.replace(/https?:\/\/\S+/g, "").trim().split("\n")[0].trim().split(",").map(p => p.trim()).filter(Boolean);
  const seen = new Set<string>();
  return parts.filter(p => {
    const key = p.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  }).join(", ");
}

export function cleanLocation(rawName: string, rawAddress?: string, hasCoords?: boolean): { name: string; address: string } {
  const cleaned = dedupeAndClean(rawName || "");
  const parts = cleaned.split(",").filter(Boolean);
  const name = hasCoords ? cleaned : (parts.length > 1 ? parts[0].trim() : cleaned);
  const address = rawAddress ? dedupeAndClean(rawAddress) : name;
  return { name, address };
}
