import type { ModelInfo } from "@/lib/api";

/** 0.9564 -> "95.6%". Missing values show a dash. */
export function pct(value: number | null | undefined, digits = 1): string {
  return value == null || Number.isNaN(value) ? "-" : `${(value * 100).toFixed(digits)}%`;
}

const CLASS_LABELS: Record<string, string> = {
  glioma: "Glioma",
  meningioma: "Meningioma",
  pituitary: "Pituitary tumor",
  notumor: "No tumor",
};

export const classLabel = (name: string): string => CLASS_LABELS[name] ?? name;

/** "Dr. Amina Khan" -> "AK", "sumayya" -> "SU", no name -> from the email. */
export function initials(name: string | null | undefined, email: string | null | undefined): string {
  const source = name?.trim() || email?.split("@")[0] || "?";
  const parts = source.split(/[\s._-]+/).filter(Boolean);
  if (parts.length === 0) return "?";
  return (parts.length > 1 ? parts[0][0] + parts[1][0] : parts[0].slice(0, 2)).toUpperCase();
}

export type GateSummary = { accepted: number; worst: { source: string; rejected: number } | null };

/** Picks the gate test row closest to the threshold in use and reduces it to two numbers. */
export function gateSummary(info: ModelInfo): GateSummary | null {
  const table = info.gate_metrics?.test_by_threshold;
  if (!info.gate_enabled || !table || info.gate_threshold == null) return null;
  const keys = Object.keys(table);
  if (keys.length === 0) return null;
  const key = keys.reduce((best, k) =>
    Math.abs(Number(k) - info.gate_threshold!) < Math.abs(Number(best) - info.gate_threshold!) ? k : best,
  );
  const row = table[key];
  const entries = Object.entries(row.rejected ?? {});
  const worst = entries.length
    ? entries.reduce((a, b) => (b[1] < a[1] ? b : a))
    : null;
  return { accepted: row.brain_accepted, worst: worst ? { source: worst[0], rejected: worst[1] } : null };
}