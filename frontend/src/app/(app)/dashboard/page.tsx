"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, FolderClock, ScanLine } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import ModelCard from "@/components/ModelCard";
import ScanListItem from "@/components/ScanListItem";
import { useScanRecords } from "@/lib/useScanRecords";

export default function DashboardPage() {
  const { user } = useAuth();
  const router = useRouter();
  const name = user?.displayName?.trim() || user?.email?.split("@")[0];
  const { state } = useScanRecords(user?.uid, 5);

  return (
    <div>
      <h1 className="text-3xl font-semibold">{name ? `Welcome, ${name}` : "Welcome"}</h1>
      <p className="mt-1 text-muted">Upload a brain MRI study to screen it for tumors.</p>

      <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <div className="space-y-6">
          <section className="flex flex-col gap-5 rounded-2xl bg-ink p-8 text-lightbox sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-display text-2xl font-semibold">Analyse a scan</h2>
              <p className="mt-2 max-w-md text-sm text-lightbox/70">
                A single image, a .zip of slices, or a NIfTI volume. The MRI check runs first, then every
                slice is scored.
              </p>
            </div>
            <Link
              href="/scan"
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-white px-5 py-3 text-sm font-semibold text-ink transition hover:bg-lightbox"
            >
              <ScanLine size={18} aria-hidden /> New scan <ArrowRight size={16} aria-hidden />
            </Link>
          </section>

          <section aria-labelledby="recent" className="rounded-2xl border border-line bg-film p-8">
            <div className="flex items-center justify-between">
              <h2 id="recent" className="font-display text-lg font-semibold">
                Recent scans
              </h2>
              {state.status === "ready" && state.records.length > 0 && (
                <Link href="/history" className="text-sm font-medium text-cortex hover:underline">
                  View all
                </Link>
              )}
            </div>

            {state.status === "loading" && (
              <div className="mt-6 space-y-3" aria-busy="true" aria-label="Loading recent scans">
                {[0, 1].map((i) => (
                  <div key={i} className="h-16 animate-pulse rounded-xl bg-lightbox" />
                ))}
              </div>
            )}

            {state.status === "error" && (
              <p className="mt-6 text-sm text-signal">{state.message}</p>
            )}

            {state.status === "ready" && state.records.length === 0 && (
              <div className="mt-6 flex flex-col items-center py-6 text-center">
                <FolderClock size={32} className="text-muted" aria-hidden />
                <p className="mt-3 font-medium">Nothing here yet</p>
                <p className="mt-1 max-w-sm text-sm text-muted">Analysed studies will be listed here.</p>
              </div>
            )}

            {state.status === "ready" && state.records.length > 0 && (
              <div className="mt-4 space-y-3">
                {state.records.map((r) => (
                  <ScanListItem key={r.id} record={r} onOpen={() => router.push(`/results?id=${r.id}`)} />
                ))}
              </div>
            )}
          </section>
        </div>

        <ModelCard />
      </div>
    </div>
  );
}