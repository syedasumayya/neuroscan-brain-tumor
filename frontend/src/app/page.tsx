import { Layers, ScanSearch, ShieldCheck } from "lucide-react";
import LandingActions from "@/components/LandingActions";
import SliceStrip, { SAMPLE_SCORES } from "@/components/SliceStrip";

const flagged = SAMPLE_SCORES.filter((v) => v >= 0.7).length;

const steps = [
  {
    Icon: ShieldCheck,
    title: "Check",
    text: "A small model first confirms the upload really is a brain MRI. Photos, screenshots and chest X-rays are turned away before any tumor analysis.",
  },
  {
    Icon: Layers,
    title: "Score",
    text: "A ResNet-18 classifier scores every slice as glioma, meningioma, pituitary tumor or no tumor.",
  },
  {
    Icon: ScanSearch,
    title: "Explain",
    text: "The study is flagged when enough slices cross the threshold. Grad-CAM heat-maps show where the model looked on the most suspicious slices.",
  },
];

const formats = [
  { name: "A single image", detail: "PNG, JPG, BMP, TIFF or WebP" },
  { name: "A series of slices", detail: "several images, or one .zip archive" },
  { name: "A 3D volume", detail: "NIfTI, .nii or .nii.gz" },
];

const limits = [
  "The models were trained on a public research dataset. On other scanners and hospitals, accuracy will be lower than the figures shown in the app.",
  "The decision thresholds are starting values, not clinically calibrated.",
  "The classifier looks at 2-D slices, so results on full 3-D volumes have not been validated.",
  "Every result needs review by a qualified radiologist. This is not a medical device.",
];

export default function Landing() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-5">
        <span className="font-display text-xl font-semibold tracking-tight">NeuroScan</span>
        <LandingActions variant="header" />
      </header>

      <main className="flex-1">
        <section className="mx-auto grid max-w-6xl items-center gap-12 px-6 pb-20 pt-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:pt-20">
          <div>
            <h1 className="text-5xl font-semibold leading-[1.05] sm:text-6xl">
              Screen brain MRI studies, one slice at a time.
            </h1>
            <p className="mt-6 max-w-xl text-lg text-muted">
              NeuroScan checks that a scan really is a brain MRI, scores every slice for glioma, meningioma and
              pituitary tumors, and shows where the model looked. Built for research and teaching.
            </p>
            <div className="mt-8">
              <LandingActions variant="hero" />
            </div>
            <p className="mt-5 text-xs text-muted">
              Research tool. Not a medical device. Use anonymized data only.
            </p>
          </div>

          <figure className="rounded-2xl border border-line bg-film p-6 shadow-[0_1px_0_rgba(19,35,48,0.04)]">
            <figcaption className="flex items-center justify-between text-xs text-muted">
              <span>Example output, not a real patient</span>
              <span>{SAMPLE_SCORES.length} slices</span>
            </figcaption>
            <SliceStrip
              scores={SAMPLE_SCORES}
              label="Example: tumor score for each of 40 slices, with a cluster above the 0.70 threshold"
              className="mt-5 h-40 w-full"
            />
            <div className="mt-3 flex items-center justify-between text-xs text-muted">
              <span>slice 1</span>
              <span>dashed line: 0.70 threshold</span>
              <span>slice {SAMPLE_SCORES.length}</span>
            </div>
            <div className="mt-5 flex items-center justify-between gap-4 rounded-xl border border-signal/30 bg-signal-soft px-4 py-3 text-sm text-signal">
              <span className="font-semibold">Tumor suspected</span>
              <span>
                {flagged} of {SAMPLE_SCORES.length} slices flagged
              </span>
            </div>
          </figure>
        </section>

        <section className="border-y border-line bg-film py-20">
          <div className="mx-auto max-w-6xl px-6">
            <h2 className="text-3xl font-semibold">From upload to verdict</h2>
            <ol className="mt-10 grid gap-10 md:grid-cols-3">
              {steps.map(({ Icon, title, text }, i) => (
                <li key={title} className="border-l-2 border-cortex pl-6">
                  <div className="flex items-center gap-3">
                    <span className="font-display text-3xl font-semibold text-cortex">{i + 1}</span>
                    <Icon size={22} className="text-muted" aria-hidden />
                  </div>
                  <h3 className="mt-3 text-xl font-semibold">{title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted">{text}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="mx-auto grid max-w-6xl gap-12 px-6 py-20 lg:grid-cols-2">
          <div>
            <h2 className="text-3xl font-semibold">Works with what you have</h2>
            <ul className="mt-8 divide-y divide-line border-y border-line">
              {formats.map((f) => (
                <li key={f.name} className="flex items-baseline justify-between gap-4 py-4">
                  <span className="font-medium">{f.name}</span>
                  <span className="text-sm text-muted">{f.detail}</span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className="text-3xl font-semibold">Honest about its limits</h2>
            <ul className="mt-8 space-y-4 rounded-2xl border border-caution/30 bg-caution-soft p-6 text-sm leading-relaxed text-ink/80">
              {limits.map((l) => (
                <li key={l} className="flex gap-3">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-caution" aria-hidden />
                  {l}
                </li>
              ))}
            </ul>
          </div>
        </section>
      </main>

      <footer className="border-t border-line py-6 text-center text-xs text-muted">
        NeuroScan is a research and teaching project. Datasets: Brain Tumor MRI Dataset (Masoud Nickparvar) and
        Chest X-Ray Images (Paul Mooney), via Kaggle.
      </footer>
    </div>
  );
}