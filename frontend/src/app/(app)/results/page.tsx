"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState, useSyncExternalStore } from "react";
import { ArrowLeft, LoaderCircle, Printer, ScanLine, TriangleAlert } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import FeedbackBox from "@/components/FeedbackBox";
import GradCamViewer from "@/components/GradCamViewer";
import HospitalSuggestions from "@/components/HospitalSuggestions";
import ScoreTiles from "@/components/ScoreTiles";
import SliceStrip from "@/components/SliceStrip";
import VerdictCard from "@/components/VerdictCard";
import type { PatientInfo } from "@/lib/patient";
import type { PredictionResponse } from "@/lib/predict";
import { loadResult } from "@/lib/resultStore";
import { getScanRecord } from "@/lib/scanRecords";


const noSubscription = () => () => {}; // sessionStorage doesn't push change events we need here

function NoResult() {
  return (
    <div className="mx-auto max-w-md py-20 text-center">
      <h1 className="text-2xl font-semibold">No result to show</h1>
      <p className="mt-2 text-muted">
        Results only stay available for this browser tab. Run a new scan, or open one from History.
      </p>
      <Link
        href="/scan"
        className="mt-6 inline-flex items-center gap-2 rounded-lg bg-cortex px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-cortex-dark"
      >
        <ScanLine size={16} aria-hidden /> New scan
      </Link>
    </div>
  );
}

function ResultsView({ patient, result, backHref }: { patient: PatientInfo; result: PredictionResponse; backHref: string }) {
  return (
    <div className="mx-auto max-w-3xl print:max-w-none">
      <Link
        href={backHref}
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-muted hover:text-ink print:hidden"
      >
        <ArrowLeft size={15} aria-hidden /> Back
      </Link>

      <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2 text-sm text-muted">
        <span>
          {patient.fullName.trim()} - {patient.age} years - scan ID {result.scan_id.slice(0, 8)}
        </span>
        <span>{result.inference_ms} ms</span>
      </div>

      <VerdictCard result={result} />

      {result.verdict !== "not_brain_mri" && (
        <>
          <div className="mt-6">
            <ScoreTiles result={result} />
          </div>

          {result.slice_scores.length > 1 && (
            <section className="mt-6 rounded-2xl border border-line bg-film p-6">
              <h2 className="font-display text-lg font-semibold">Slices, in order</h2>
              <SliceStrip
                scores={result.slice_scores.map((s) => s.tumor_prob)}
                threshold={result.thresholds.slice_threshold}
                label="Tumor score for every analysed slice, in order"
                className="mt-4 h-24 w-full"
              />
            </section>
          )}

          {result.key_slices.length > 0 && (
            <div className="mt-6">
              <GradCamViewer slices={result.key_slices} />
            </div>
          )}
                    {result.verdict === "tumor_suspected" && (
            <div className="mt-6">
              <HospitalSuggestions tumorType={result.tumor_type} />
            </div>
          )}

          <div className="mt-6">
            <FeedbackBox scanId={result.scan_id} verdict={result.verdict} />
          </div>
        </>
      )}

      <div className="mt-6 flex flex-wrap gap-3 print:hidden">
        <button
          type="button"
          onClick={() => window.print()}
          className="inline-flex items-center gap-2 rounded-lg bg-cortex px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-cortex-dark"
        >
          <Printer size={16} aria-hidden /> Print / save as PDF
        </button>
        <Link
          href="/scan"
          className="inline-flex items-center gap-2 rounded-lg border border-line bg-white px-5 py-2.5 text-sm font-semibold transition hover:bg-lightbox"
        >
          <ScanLine size={16} aria-hidden /> New scan
        </Link>
      </div>

      <p className="mt-6 text-xs text-muted print:mt-10">{result.disclaimer}</p>
    </div>
  );
}

/** A scan just analysed in this tab: read from sessionStorage. */
function SessionResults() {
  // useSyncExternalStore (not useEffect+setState) so the server snapshot (null) and the first
  // client render agree, avoiding a hydration mismatch when reading sessionStorage.
  const entry = useSyncExternalStore(noSubscription, loadResult, () => null);
  if (!entry) return <NoResult />;
  return <ResultsView patient={entry.patient} result={entry.result} backHref="/scan" />;
}

/** A past scan opened from History: fetch it from Firestore by its id. */
function RemoteResults({ id }: { id: string }) {
  const { user } = useAuth();
  const [state, setState] = useState<
    | { status: "loading" }
    | { status: "ready"; patient: PatientInfo; result: PredictionResponse }
    | { status: "error"; message: string }
  >({ status: "loading" });

  useEffect(() => {
    if (!user) return;
    let alive = true;
    getScanRecord(user.uid, id)
      .then((record) => {
        if (!alive) return;
        if (record) setState({ status: "ready", patient: record.patient, result: record.result });
        else setState({ status: "error", message: "That scan could not be found." });
      })
      .catch(() => {
        if (alive) setState({ status: "error", message: "Could not load that scan." });
      });
    return () => {
      alive = false;
    };
  }, [id, user]);

  if (state.status === "loading") {
    return (
      <div className="flex justify-center py-20 text-muted">
        <LoaderCircle className="animate-spin" aria-label="Loading scan" />
      </div>
    );
  }

  if (state.status === "error") {
    return (
      <div className="mx-auto max-w-md py-20 text-center">
        <TriangleAlert size={28} className="mx-auto text-signal" aria-hidden />
        <h1 className="mt-3 text-2xl font-semibold">Couldn&apos;t load this scan</h1>
        <p className="mt-2 text-muted">{state.message}</p>
        <Link href="/history" className="mt-6 inline-block text-sm font-medium text-cortex hover:underline">
          Back to history
        </Link>
      </div>
    );
  }

  return <ResultsView patient={state.patient} result={state.result} backHref="/history" />;
}

function ResultsRouter() {
  const id = useSearchParams().get("id");
  return id ? <RemoteResults key={id} id={id} /> : <SessionResults />;
}

export default function ResultsPage() {
  // useSearchParams needs a Suspense boundary in the app router.
  return (
    <Suspense fallback={null}>
      <ResultsRouter />
    </Suspense>
  );
}