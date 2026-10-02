import { CircleCheck, ImageOff, TriangleAlert } from "lucide-react";
import type { Verdict } from "@/lib/predict";

const CONFIG = {
  tumor_suspected: { Icon: TriangleAlert, label: "Tumor suspected", cls: "bg-signal-soft text-signal border-signal/30" },
  no_tumor_detected: { Icon: CircleCheck, label: "No tumor detected", cls: "bg-clear-soft text-clear border-clear/30" },
  not_brain_mri: { Icon: ImageOff, label: "Not a brain MRI", cls: "bg-caution-soft text-caution border-caution/30" },
} as const;

export default function VerdictBadge({ verdict }: { verdict: Verdict }) {
  const { Icon, label, cls } = CONFIG[verdict];
  return (
    <span className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${cls}`}>
      <Icon size={13} aria-hidden /> {label}
    </span>
  );
}