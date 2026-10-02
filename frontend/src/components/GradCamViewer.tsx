"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, Eye, EyeOff } from "lucide-react";
import { classLabel, pct } from "@/lib/format";
import type { KeySlice } from "@/lib/predict";

export default function GradCamViewer({ slices }: { slices: KeySlice[] }) {
  const [index, setIndex] = useState(0);
  const [showOverlay, setShowOverlay] = useState(true);

  if (slices.length === 0) return null;
  const slice = slices[Math.min(index, slices.length - 1)];

  return (
    <section aria-labelledby="gradcam-heading" className="rounded-2xl border border-line bg-film p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="gradcam-heading" className="font-display text-lg font-semibold">
          Grad-CAM activation map
        </h2>
        <button
          type="button"
          onClick={() => setShowOverlay((s) => !s)}
          className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-white px-3 py-1.5 text-xs font-medium transition hover:bg-lightbox"
        >
          {showOverlay ? <EyeOff size={14} aria-hidden /> : <Eye size={14} aria-hidden />}
          {showOverlay ? "Hide heat-map" : "Show heat-map"}
        </button>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <figure>
          <figcaption className="mb-1.5 text-xs font-medium text-muted">Original slice</figcaption>
          {/* Model-generated preview image (data: URL), not a user photo - a plain <img> is appropriate here. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={slice.original} alt={`Slice ${slice.index}, original`} className="w-full rounded-lg border border-line" />
        </figure>
        <figure>
          <figcaption className="mb-1.5 flex items-center justify-between text-xs font-medium text-muted">
            <span>Activation map</span>
            <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-semibold text-ink">Grad-CAM</span>
          </figcaption>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={showOverlay ? slice.overlay : slice.original}
            alt={showOverlay ? `Slice ${slice.index}, Grad-CAM overlay` : `Slice ${slice.index}, original`}
            className="w-full rounded-lg border border-line"
          />
        </figure>
      </div>

      <div className="mt-4 flex items-center justify-between text-sm">
        <button
          type="button"
          onClick={() => setIndex((i) => Math.max(0, i - 1))}
          disabled={index === 0}
          aria-label="Previous slice"
          className="rounded-lg border border-line bg-white p-2 transition hover:bg-lightbox disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ChevronLeft size={16} aria-hidden />
        </button>

        <div className="text-center">
          <p className="font-medium">
            Slice {slice.index} - {classLabel(slice.predicted_class)}
          </p>
          <p className="text-xs text-muted">
            Tumor score {pct(slice.tumor_prob)} - slice {index + 1} of {slices.length} shown
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIndex((i) => Math.min(slices.length - 1, i + 1))}
          disabled={index === slices.length - 1}
          aria-label="Next slice"
          className="rounded-lg border border-line bg-white p-2 transition hover:bg-lightbox disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ChevronRight size={16} aria-hidden />
        </button>
      </div>

      <p className="mt-3 text-xs text-muted">
        These are the {slices.length} slices the model found most suspicious, not necessarily consecutive.
        Red and orange areas influenced the tumor score most.
      </p>
    </section>
  );
}