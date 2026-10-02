"use client";

import { useSyncExternalStore } from "react";
import { ChartColumn, RefreshCw, TriangleAlert } from "lucide-react";
import ConfusionMatrix from "@/components/ConfusionMatrix";
import { classLabel, pct } from "@/lib/format";
import { computeFeedbackMetrics } from "@/lib/metrics";
import { loadFeedback } from "@/lib/resultStore";
import { useModelInfo } from "@/lib/useModelInfo";

const noSubscription = () => () => {};

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-line bg-film p-4">
      <dd className="font-display text-2xl font-semibold tabular-nums">{value}</dd>
      <dt className="mt-0.5 text-xs text-muted">{label}</dt>
    </div>
  );
}

export default function MetricsPage() {
  const { state, retry } = useModelInfo();
  const feedback = useSyncExternalStore(noSubscription, loadFeedback, () => []);
  const fm = computeFeedbackMetrics(feedback);

  return (
    <div>
      <div className="flex items-center gap-3">
        <ChartColumn size={22} className="text-cortex" aria-hidden />
        <h1 className="text-3xl font-semibold">Metrics</h1>
      </div>
      <p className="mt-1 text-muted">How well the models perform.</p>

      {/* ---------------- Tumor classifier: held-out test set ---------------- */}
      <section aria-labelledby="classifier-heading" className="mt-8 rounded-2xl border border-line bg-film p-6">
        <h2 id="classifier-heading" className="font-display text-lg font-semibold">
          Tumor classifier - held-out test set
        </h2>

        {state.status === "loading" && (
          <div className="mt-5 h-32 animate-pulse rounded-xl bg-lightbox" aria-busy="true" aria-label="Loading model metrics" />
        )}

        {state.status === "error" && (
          <div className="mt-4 text-sm">
            <p className="flex items-center gap-2 text-signal">
              <TriangleAlert size={16} aria-hidden /> {state.message}
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

        {state.status === "ready" && !state.info.metrics.test && (
          <p className="mt-4 text-sm text-muted">
            No test results are stored with this model{state.info.model_status === "demo" ? " (it is running with untrained demo weights)" : ""}.
          </p>
        )}

        {state.status === "ready" && state.info.metrics.test && (
          <>
            <dl className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Stat label="Accuracy" value={pct(state.info.metrics.test.accuracy)} />
              <Stat label="Macro F1" value={pct(state.info.metrics.test.macro_f1)} />
              <Stat label="Tumors caught" value={pct(state.info.metrics.test.sensitivity)} />
              <Stat label="Healthy cleared" value={pct(state.info.metrics.test.specificity)} />
            </dl>

            {state.info.metrics.test.confusion_matrix && (
              <div className="mt-6">
                <p className="mb-2 text-xs font-medium text-muted">
                  Confusion matrix (rows: true class, columns: predicted class)
                </p>
                <ConfusionMatrix classes={state.info.classes} matrix={state.info.metrics.test.confusion_matrix} />
              </div>
            )}

            {state.info.metrics.test.recall && (
              <div className="mt-6 grid gap-2 sm:grid-cols-2">
                {state.info.classes.map((c, i) => (
                  <div key={c} className="flex items-center justify-between rounded-lg border border-line bg-white px-3 py-2 text-sm">
                    <span>{classLabel(c)}</span>
                    <span className="font-medium tabular-nums">{pct(state.info.metrics.test!.recall![i])}</span>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </section>

      {/* ---------------- MRI gate: held-out test set ---------------- */}
      {state.status === "ready" && state.info.gate_enabled && state.info.gate_metrics?.test_by_threshold && (
        <section aria-labelledby="gate-heading" className="mt-6 rounded-2xl border border-line bg-film p-6">
          <h2 id="gate-heading" className="font-display text-lg font-semibold">
            MRI check - held-out test set
          </h2>
          <p className="mt-1 text-sm text-muted">
            In use at threshold {state.info.gate_threshold?.toFixed(2)}. Higher thresholds reject more
            non-brain images but risk rejecting real brain MRIs too.
          </p>
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full border-separate border-spacing-0 text-sm">
              <thead>
                <tr>
                  <th scope="col" className="p-2 text-left text-xs font-medium text-muted">Threshold</th>
                  <th scope="col" className="border-b border-line p-2 text-center text-xs font-medium text-muted">Brain MRIs accepted</th>
                  {Object.keys(Object.values(state.info.gate_metrics.test_by_threshold)[0]?.rejected ?? {}).map((source) => (
                    <th key={source} scope="col" className="border-b border-line p-2 text-center text-xs font-medium capitalize text-muted">
                      {source} rejected
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {Object.entries(state.info.gate_metrics.test_by_threshold)
                  .sort(([a], [b]) => Number(a) - Number(b))
                  .map(([threshold, row]) => (
                    <tr key={threshold} className={Number(threshold) === state.info.gate_threshold ? "bg-cortex-soft" : ""}>
                      <th scope="row" className="border-r border-line p-2 text-left font-medium">{threshold}</th>
                      <td className="p-2 text-center tabular-nums">{pct(row.brain_accepted)}</td>
                      {Object.values(row.rejected).map((v, i) => (
                        <td key={i} className="p-2 text-center tabular-nums">{pct(v)}</td>
                      ))}
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* ---------------- Doctor feedback: this browser ---------------- */}
      <section aria-labelledby="feedback-heading" className="mt-6 rounded-2xl border border-line bg-film p-6">
        <h2 id="feedback-heading" className="font-display text-lg font-semibold">
          Doctor feedback
        </h2>
        <p className="mt-1 text-sm text-muted">
          From the &quot;Was this prediction correct?&quot; answers given on the Results page, in this browser.
        </p>

        {fm.total === 0 ? (
          <p className="mt-4 text-sm text-muted">No feedback recorded yet. Answer on a scan&apos;s Results page to see it here.</p>
        ) : (
          <>
            <dl className="mt-4 grid grid-cols-3 gap-3">
              <Stat label="Scans reviewed" value={String(fm.total)} />
              <Stat label="Marked correct" value={String(fm.agreed)} />
              <Stat label="Agreement rate" value={pct(fm.agreementPct)} />
            </dl>
            <div className="mt-4 space-y-2">
              {Object.entries(fm.byVerdict).map(([verdict, v]) => (
                <div key={verdict} className="flex items-center justify-between rounded-lg border border-line bg-white px-3 py-2 text-sm">
                  <span className="capitalize">{verdict.replace(/_/g, " ")}</span>
                  <span className="text-muted">
                    {v.agreed} of {v.total} agreed ({pct(v.agreed / v.total)})
                  </span>
                </div>
              ))}
            </div>
          </>
        )}

        <p className="mt-4 text-xs text-muted">
          This feedback is stored only in this browser for now, so it does not reflect other doctors&apos; reviews.
        </p>
      </section>
    </div>
  );
}