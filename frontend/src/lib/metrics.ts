import type { FeedbackEntry } from "@/lib/resultStore";

export type FeedbackMetrics = {
  total: number;
  agreed: number;
  disagreed: number;
  agreementPct: number | null; // null when there is no feedback yet
  byVerdict: Record<string, { total: number; agreed: number }>;
};

/** Turns raw Yes/No feedback into summary numbers. Pure so it's easy to unit-test. */
export function computeFeedbackMetrics(entries: FeedbackEntry[]): FeedbackMetrics {
  const byVerdict: Record<string, { total: number; agreed: number }> = {};
  let agreed = 0;

  for (const e of entries) {
    const bucket = (byVerdict[e.verdict] ??= { total: 0, agreed: 0 });
    bucket.total += 1;
    if (e.agreed) {
      bucket.agreed += 1;
      agreed += 1;
    }
  }

  const total = entries.length;
  return {
    total,
    agreed,
    disagreed: total - agreed,
    agreementPct: total === 0 ? null : agreed / total,
    byVerdict,
  };
}