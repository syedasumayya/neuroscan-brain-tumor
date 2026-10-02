"use client";

import { useState } from "react";
import { CircleCheck } from "lucide-react";
import { feedbackFor, saveFeedback } from "@/lib/resultStore";
import type { Verdict } from "@/lib/predict";

export default function FeedbackBox({ scanId, verdict }: { scanId: string; verdict: Verdict }) {
  const [saved, setSaved] = useState(() => feedbackFor(scanId));

  if (verdict === "not_brain_mri") return null;

  function answer(agreed: boolean) {
    const entry = { scanId, verdict, agreed, at: new Date().toISOString() };
    saveFeedback(entry);
    setSaved(entry);
  }

  if (saved) {
    return (
      <section className="flex items-center gap-3 rounded-2xl border border-clear/30 bg-clear-soft p-5 text-clear">
        <CircleCheck size={20} aria-hidden />
        <div>
          <p className="font-medium">Feedback recorded</p>
          <p className="text-sm opacity-80">
            You said this result was {saved.agreed ? "correct" : "incorrect"}. Thank you - this will feed
            into the Metrics page.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-line bg-film p-5">
      <p className="font-medium">Was this prediction correct?</p>
      <p className="mt-1 text-sm text-muted">Your feedback is used to calculate evaluation metrics.</p>
      <div className="mt-4 flex gap-3">
        <button
          type="button"
          onClick={() => answer(true)}
          className="flex-1 rounded-lg border border-line bg-white py-2.5 text-sm font-medium transition hover:bg-clear-soft hover:border-clear/40"
        >
          Yes, correct
        </button>
        <button
          type="button"
          onClick={() => answer(false)}
          className="flex-1 rounded-lg border border-line bg-white py-2.5 text-sm font-medium transition hover:bg-signal-soft hover:border-signal/40"
        >
          No, incorrect
        </button>
      </div>
    </section>
  );
}