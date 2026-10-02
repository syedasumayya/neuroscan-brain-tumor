import Link from "next/link";
import SliceStrip, { SAMPLE_SCORES } from "@/components/SliceStrip";

export default function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
      <aside className="hidden flex-col justify-between bg-ink p-12 text-lightbox lg:flex">
        <Link href="/" className="font-display text-xl font-semibold tracking-tight">
          NeuroScan
        </Link>

        <div>
          <h2 className="font-display text-4xl font-semibold leading-tight">
            Every slice, scored.
          </h2>
          <p className="mt-4 max-w-sm text-lightbox/70">
            Upload a brain MRI study. NeuroScan first checks that it is a brain MRI, then scores each
            slice and shows where the model looked.
          </p>
          <div className="mt-10">
            <SliceStrip scores={SAMPLE_SCORES} tone="dark" decorative className="h-28 w-full" />
            <p className="mt-2 flex justify-between text-xs text-lightbox/55">
              <span>slice 1</span>
              <span>dashed line = 0.70 threshold</span>
              <span>slice 40</span>
            </p>
          </div>
        </div>

        <p className="text-xs text-lightbox/55">
          Research tool. Not a medical device. Use anonymized data only.
        </p>
      </aside>

      <main className="flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          <Link href="/" className="mb-8 block font-display text-xl font-semibold tracking-tight lg:hidden">
            NeuroScan
          </Link>
          {children}
        </div>
      </main>
    </div>
  );
}