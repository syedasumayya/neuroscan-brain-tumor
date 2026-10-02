"use client";

import { CircleCheck, ImageOff, TriangleAlert } from "lucide-react";
import { classLabel, pct } from "@/lib/format";
import type { PredictionResponse } from "@/lib/predict";

const CONFIG = {
  tumor_suspected: { Icon: TriangleAlert, label: "Tumor suspected", tone: "signal" as const },
  no_tumor_detected: { Icon: CircleCheck, label: "No tumor detected", tone: "clear" as const },
  not_brain_mri: { Icon: ImageOff, label: "Not a brain MRI", tone: "caution" as const },
};

export default function VerdictCard({ result }: { result: PredictionResponse }) {
  const { Icon, label, tone } = CONFIG[result.verdict];

  return (
    <section
      className={`rounded-2xl border p-8 text-center ${
        tone === "signal"
          ? "border-signal/30 bg-signal-soft text-signal"
          : tone === "clear"
            ? "border-clear/30 bg-clear-soft text-clear"
            : "border-caution/30 bg-caution-soft text-caution"
      }`}
    >
      <Icon size={40} className="mx-auto" aria-hidden />
      <h1 className="mt-3 font-display text-3xl font-semibold">{label}</h1>
      <p className="mt-1 text-sm opacity-80">{result.filename}</p>

      {result.verdict === "tumor_suspected" && result.tumor_type && (
        <p className="mt-4 text-lg font-medium text-ink">{classLabel(result.tumor_type)}</p>
      )}

      {result.verdict !== "not_brain_mri" && (
        <div className="mx-auto mt-5 max-w-sm">
          <div className="flex justify-between text-xs font-medium text-ink/70">
            <span>Confidence</span>
            <span>{pct(result.confidence)}</span>
          </div>
          <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-white/60">
            <div
              className={`h-full rounded-full ${tone === "signal" ? "bg-signal" : "bg-clear"}`}
              style={{ width: pct(result.confidence) }}
            />
          </div>
        </div>
      )}

      {result.borderline && (
        <p className="mx-auto mt-4 max-w-sm rounded-lg border border-caution/40 bg-white/60 px-3 py-2 text-xs text-caution">
          This result is close to the decision threshold. Review it carefully.
        </p>
      )}

      {result.verdict === "not_brain_mri" && (
        <p className="mx-auto mt-4 max-w-sm text-sm text-ink/70">
          This image was not recognised as a brain MRI, so no tumor analysis was run. Upload a brain MRI
          image, series, .zip or NIfTI volume.
        </p>
      )}
    </section>
  );
}