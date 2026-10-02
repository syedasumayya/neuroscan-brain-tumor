import { pct } from "@/lib/format";
import type { PredictionResponse } from "@/lib/predict";

function Tile({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-xl border border-line bg-film p-4">
      <dd className="font-display text-2xl font-semibold tabular-nums">{value}</dd>
      <dt className="mt-0.5 text-xs text-muted">{label}</dt>
      {sub && <p className="mt-1 text-xs text-muted">{sub}</p>}
    </div>
  );
}

export default function ScoreTiles({ result }: { result: PredictionResponse }) {
  return (
    <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <Tile label="Slices analysed" value={String(result.slices_analyzed)} sub={`of ${result.slices_total} total`} />
      <Tile label="Slices flagged" value={String(result.slices_flagged)} sub={pct(result.affected_ratio, 0) + " of scan"} />
      <Tile label="Slice threshold" value={result.thresholds.slice_threshold.toFixed(2)} sub="tumor score cutoff" />
      <Tile
        label="MRI check"
        value={result.brain_confidence != null ? pct(result.brain_confidence) : "off"}
        sub={result.gate_status === "disabled" ? "not switched on" : "brain MRI score"}
      />
    </dl>
  );
}