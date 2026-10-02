import { classLabel, pct } from "@/lib/format";
import { HOSPITALS, type Hospital, type Province } from "@/lib/hospitals";
import type { PatientInfo } from "@/lib/patient";
import type { PredictionResponse } from "@/lib/predict";

export type TumorKind = "glioma" | "meningioma" | "pituitary";

export function toTumorKind(value: string | null | undefined): TumorKind | null {
  return value === "glioma" || value === "meningioma" || value === "pituitary" ? value : null;
}

export const PROVINCES: Province[] = Array.from(new Set(HOSPITALS.map((h) => h.province))).sort();

/** How useful a hospital is for the surgical side of care, given the tumor type. Higher = better fit. */
function surgeryScore(h: Hospital, kind: TumorKind | null): number {
  const has = (c: Hospital["capabilities"][number]) => h.capabilities.includes(c);
  let score = 0;
  if (kind === "pituitary") {
    if (has("pituitary-surgery")) score += 4;
    if (has("brain-tumor-surgery")) score += 2;
    if (has("neurosurgery")) score += 1;
  } else {
    if (has("brain-tumor-surgery")) score += 3;
    if (has("neurosurgery")) score += 2;
  }
  return score;
}

export type CareGroup = { key: "surgery" | "oncology"; title: string; blurb: string; hospitals: Hospital[] };

/**
 * Groups hospitals into surgical care and (for glioma / unknown type) cancer treatment,
 * best fit first. `province` narrows the list; null means all provinces.
 */
export function groupHospitals(kind: TumorKind | null, province: Province | null): CareGroup[] {
  const pool = HOSPITALS.filter((h) => !province || h.province === province);

  const surgery = pool
    .filter((h) => surgeryScore(h, kind) > 0)
    .sort((a, b) => surgeryScore(b, kind) - surgeryScore(a, kind) || a.name.localeCompare(b.name) || a.city.localeCompare(b.city));

  const groups: CareGroup[] = [
    {
      key: "surgery",
      title: "Neurosurgery",
      blurb: "Surgeons who assess and operate on brain tumors.",
      hospitals: surgery,
    },
  ];

  if (kind === "glioma" || kind === null) {
    groups.push({
      key: "oncology",
      title: "Cancer treatment",
      blurb: "Oncology (radiation and medical treatment), usually after a diagnosis is confirmed.",
      hospitals: pool
        .filter((h) => h.capabilities.includes("cancer-treatment"))
        .sort((a, b) => a.name.localeCompare(b.name) || a.city.localeCompare(b.city)),
    });
  }

  return groups;
}

export type Guidance = { intro: string; specific: string | null; steps: string[]; redFlags: string[] };

const SPECIFIC: Record<TumorKind, string> = {
  glioma:
    "Gliomas are usually managed by a team: a neurosurgeon and an oncologist (radiation and medical oncology). Ask for a neuro-oncology opinion.",
  meningioma:
    "Many meningiomas grow slowly. A neurosurgeon will advise whether to watch with repeat scans, operate, or use radiation.",
  pituitary:
    "Pituitary tumors can affect hormones and vision. Along with a neurosurgeon, you will usually need an endocrinologist (hormone tests) and an eye check (visual fields).",
};

export function guidanceFor(kind: TumorKind | null): Guidance {
  return {
    intro:
      "This is a screening result from a research tool, not a diagnosis. A radiologist and a neurosurgeon need to review the actual MRI.",
    specific: kind ? SPECIFIC[kind] : null,
    steps: [
      "Bring the original MRI films or CD, the radiology report, and any earlier scans and medical records.",
      "Ask for a neurosurgeon's opinion. Specialists decide what comes next, such as a contrast MRI, more tests, monitoring, surgery or radiation.",
      "Get a second opinion if you are unsure. Hospitals below are a starting point, not a recommendation.",
    ],
    redFlags: [
      "a seizure",
      "a sudden, severe headache",
      "sudden weakness or numbness on one side",
      "confusion or drowsiness that is getting worse",
      "sudden loss of vision",
      "repeated vomiting together with a headache",
    ],
  };
}

const VERDICT_TEXT: Record<PredictionResponse["verdict"], string> = {
  tumor_suspected: "Tumor suspected",
  no_tumor_detected: "No tumor detected",
  not_brain_mri: "Not a brain MRI",
};

/** A plain-text summary for WhatsApp or a message to a doctor. Patient details are opt-in. */
export function buildShareText(
  result: PredictionResponse,
  options: { includePatient?: boolean; patient?: PatientInfo } = {},
): string {
  const lines = ["NeuroScan screening result (research tool, not a diagnosis)"];

  if (options.includePatient && options.patient) {
    lines.push(`Patient: ${options.patient.fullName.trim()}, ${options.patient.age} years`);
  }

  const verdict = VERDICT_TEXT[result.verdict];
  lines.push(`Result: ${verdict}${result.tumor_type ? ` (${classLabel(result.tumor_type)})` : ""}`);

  if (result.verdict !== "not_brain_mri") {
    lines.push(`Confidence: ${pct(result.confidence)}`);
    lines.push(`Slices flagged: ${result.slices_flagged} of ${result.slices_analyzed}`);
  }

  lines.push(`Scan ID: ${result.scan_id.slice(0, 8)}`);
  lines.push("Please review the original MRI before any decision.");
  return lines.join("\n");
}

export const whatsappUrl = (text: string): string => `https://wa.me/?text=${encodeURIComponent(text)}`;