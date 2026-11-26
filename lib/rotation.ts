// Non-Thai locales the main site supports (src/i18n/routing.ts minus "th").
export const NONTHAI = ["en", "lo", "vi", "id", "tl", "tr", "ar", "zh"] as const;

// Topic slugs rotated per post for content variety (SEO breadth, avoids duplicates).
export const TOPICS = [
  "what-is-diversified-ea-fund",
  "usdt-custody-safety",
  "forex-ea-risk-management",
  "monthly-performance-reporting",
  "drawdown-control",
  "copy-trading-vs-fund",
  "why-diversify-strategies",
  "automated-trading-basics",
] as const;

// Mon/Wed/Fri -> post slot 0/1/2 (UTC weekday).
const SLOT: Record<number, number> = { 1: 0, 3: 1, 5: 2 };
const DAY_MS = 86_400_000;
// A known Monday (2024-01-01 UTC) as the rotation epoch.
const BASE_MON = Math.floor(Date.UTC(2024, 0, 1) / DAY_MS);

export function pickSlot(
  date: Date,
): { lang: string; topic: string; postIndex: number } | null {
  const slot = SLOT[date.getUTCDay()];
  if (slot === undefined) return null;
  const epochDay = Math.floor(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()) / DAY_MS,
  );
  const weekIndex = Math.floor((epochDay - BASE_MON) / 7);
  const postIndex = weekIndex * 3 + slot;
  return {
    lang: NONTHAI[postIndex % NONTHAI.length],
    topic: TOPICS[postIndex % TOPICS.length],
    postIndex,
  };
}
