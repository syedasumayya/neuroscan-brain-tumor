import type { PatientInfo } from "@/lib/patient";
import type { PredictionResponse } from "@/lib/predict";

const KEY = "neuroscan:last-result";

export type StoredResult = { patient: PatientInfo; result: PredictionResponse };

/** Holds the most recent scan result in this browser tab so the Results page survives a refresh.
 * No backend history exists yet (that's a later chunk), so this is intentionally single-slot. */
export function saveResult(entry: StoredResult): void {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(entry));
  } catch {
    // storage can be unavailable (private mode, quota) - the in-memory navigation still carries the data
  }
}

let cachedRaw: string | null = null;
let cachedValue: StoredResult | null = null;

/** Returns the same object reference until the underlying storage actually changes -
 * required for useSyncExternalStore, whose snapshot function must not allocate every call. */
export function loadResult(): StoredResult | null {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (raw !== cachedRaw) {
      cachedRaw = raw;
      cachedValue = raw ? (JSON.parse(raw) as StoredResult) : null;
    }
    return cachedValue;
  } catch {
    return null;
  }
}

const FEEDBACK_KEY = "neuroscan:feedback";

export type FeedbackEntry = { scanId: string; verdict: string; agreed: boolean; at: string };

/** Doctor's agree/disagree on a verdict. Kept locally until Firestore history exists. */
export function saveFeedback(entry: FeedbackEntry): void {
  try {
    const all = loadFeedback().filter((e) => e.scanId !== entry.scanId);
    all.push(entry);
    localStorage.setItem(FEEDBACK_KEY, JSON.stringify(all));
  } catch {
    // ignore
  }
}

let cachedFeedbackRaw: string | null = null;
let cachedFeedbackValue: FeedbackEntry[] = [];

/** Same caching as loadResult(): a stable reference is required for useSyncExternalStore. */
export function loadFeedback(): FeedbackEntry[] {
  try {
    const raw = localStorage.getItem(FEEDBACK_KEY);
    if (raw !== cachedFeedbackRaw) {
      cachedFeedbackRaw = raw;
      cachedFeedbackValue = raw ? (JSON.parse(raw) as FeedbackEntry[]) : [];
    }
    return cachedFeedbackValue;
  } catch {
    return [];
  }
}

export function feedbackFor(scanId: string): FeedbackEntry | null {
  return loadFeedback().find((e) => e.scanId === scanId) ?? null;
}