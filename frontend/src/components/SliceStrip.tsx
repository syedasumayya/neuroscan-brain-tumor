type Props = {
  /** One tumor probability (0-1) per slice. */
  scores: number[];
  threshold?: number;
  tone?: "light" | "dark";
  /** Decorative strips are hidden from screen readers. */
  decorative?: boolean;
  label?: string;
  className?: string;
};

const BAR_W = 8;
const GAP = 4;
const H = 96;

/** The per-slice "contact strip": one bar per MRI slice, magenta where the score reaches the threshold. */
export default function SliceStrip({
  scores,
  threshold = 0.7,
  tone = "light",
  decorative = false,
  label = "Tumor score for each slice",
  className,
}: Props) {
  const width = scores.length * (BAR_W + GAP) - GAP;
  const lineY = H - threshold * (H - 8);
  const quiet = tone === "dark" ? "fill-white/25" : "fill-cortex/35";
  const guide = tone === "dark" ? "stroke-white/50" : "stroke-ink/40";

  return (
    <svg
      viewBox={`0 0 ${width} ${H}`}
      className={className}
      role={decorative ? undefined : "img"}
      aria-label={decorative ? undefined : label}
      aria-hidden={decorative || undefined}
      preserveAspectRatio="none"
    >
      {scores.map((v, i) => {
        const h = Math.max(3, v * (H - 8));
        return (
          <rect
            key={i}
            x={i * (BAR_W + GAP)}
            y={H - h}
            width={BAR_W}
            height={h}
            rx={2}
            className={v >= threshold ? "fill-signal" : quiet}
          />
        );
      })}
      <line x1={0} x2={width} y1={lineY} y2={lineY} strokeDasharray="4 4" className={guide} />
    </svg>
  );
}

/** Deterministic sample data for decoration (no Math.random, so server and browser render the same). */
export const SAMPLE_SCORES = Array.from({ length: 40 }, (_, i) => {
  const bump = Math.exp(-((i - 24) ** 2) / 34);
  const ripple = 0.8 + 0.2 * Math.sin(i * 1.9);
  return Math.min(0.97, 0.05 + 0.5 * Math.abs(Math.sin(i * 2.3)) * 0.35 + 0.92 * bump * ripple);
});