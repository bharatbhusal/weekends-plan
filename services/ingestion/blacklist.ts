export const BLACKLISTED_TITLES: string[] = [
  "VOCO Skill UP",
  "AI & DIGITAL TRANSFORMATION STRATEGIST",
  "15 Day Crash Course",
  "Master Salesforce Headless 360",
];

export function isBlacklisted(title: string): boolean {
  const t = title.toLowerCase();
  return BLACKLISTED_TITLES.some((b) => t.includes(b.toLowerCase()));
}
