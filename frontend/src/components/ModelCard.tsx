"use client";

import Link from "next/link";
import { ArrowRight, RefreshCw, TriangleAlert } from "lucide-react";
import type { ModelInfo } from "@/lib/api";
import { useModelInfo } from "@/lib/useModelInfo";
import { gateSummary, pct } from "@/lib/format";

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex-1 px-4 first:pl-0 last:pr-0">
      <dd className="font-display text-2xl font-semibold tabular-nums">{value}</dd>
      <dt className="mt-0.5 text-xs text-muted">{label}</dt>
    </div>
  );
}

export default function ModelCard() {
  const { state, retry } = useModelInfo();

  return (
    <section aria-labelledby="model-heading" className="rounded-2xl border border-line bg-film p-6">
      <h2 id="model-heading" className="font-display text-lg font-semibold">
        The models
      </h2>

      {state.status === "loading" && (
        <div className="mt-5 space-y-3" aria-busy="true" aria-label="Loading model details">
          <div className="h-8 w-full animate-pulse rounded bg-lightbox" />
          <div className="h-4 w-4/5 animate-pulse rounded bg-lightbox" />
          <div className="h-4 w-3/5 animate-pulse rounded bg-lightbox" />
        </div>
      )}

      {state.status === "error" && (
        <div className="mt-4 text-sm">
          <p className="flex items-start gap-2 text-signal">
            <TriangleAlert size={16} className="mt-0.5 shrink-0" aria-hidden /> {state.message}
          </p>
          <button
            type="button"
            onClick={retry}
            className="mt-3 inline-flex items-center gap-2 rounded-lg border border-line bg-white px-3 py-1.5 font-medium transition hover:bg-lightbox"
          >
            <RefreshCw size={14} aria-hidden /> Try again
          </button>
        </div>
      )}

      {state.status === "ready" && <Details info={state.info} />}
    </section>
  );
}

function Details({ info }: { info: ModelInfo }) {
  const test = info.metrics?.test;
  const gate = gateSummary(info);

  return (
    <div className="mt-4 text-sm">
      {info.model_status === "demo" && (
        <p className="mb-4 flex items-start gap-2 rounded-lg border border-caution/30 bg-caution-soft px-3 py-2 text-caution">
          <TriangleAlert size={16} className="mt-0.5 shrink-0" aria-hidden />
          Demo weights: results are not meaningful.
        </p>
      )}

      <p className="text-xs text-muted">Tumor classifier, tested on images it never saw</p>
      {test ? (
        <dl className="mt-3 flex divide-x divide-line">
          <Stat label="accuracy" value={pct(test.accuracy)} />
          <Stat label="tumors caught" value={pct(test.sensitivity)} />
          <Stat label="healthy cleared" value={pct(test.specificity)} />
        </dl>
      ) : (
        <p className="mt-2 text-muted">No test results are stored with this model.</p>
      )}

      <div className="mt-6 border-t border-line pt-4">
        <p className="font-medium">MRI check</p>
        {gate ? (
          <p className="mt-1 text-muted">
            On at {info.gate_threshold?.toFixed(2)}. Accepted {pct(gate.accepted)} of test brain MRIs
            {gate.worst ? `; rejected at least ${pct(gate.worst.rejected)} of every kind of non-brain image tested.` : "."}
          </p>
        ) : (
          <p className="mt-1 text-muted">{info.gate_enabled ? "On." : "Off: any image will be analysed."}</p>
        )}
      </div>

      <div className="mt-4 border-t border-line pt-4">
        <p className="font-medium">Decision rule</p>
        <p className="mt-1 text-muted">
          A slice is flagged at a tumor score of {info.defaults.slice_threshold.toFixed(2)} or more. A study
          is positive when {pct(info.defaults.affected_ratio_cutoff, 0)} or more of its slices are flagged.
        </p>
      </div>

      <div className="mt-4 border-t border-line pt-4">
        <p className="font-medium">Accepts</p>
        <p className="mt-1 text-muted">
          Images, a .zip of slices, or a NIfTI volume, up to {info.max_upload_mb} MB.
        </p>
      </div>

      <Link
        href="/metrics"
        className="mt-5 inline-flex items-center gap-1.5 font-medium text-cortex hover:underline"
      >
        Full evaluation <ArrowRight size={15} aria-hidden />
      </Link>
    </div>
  );
}