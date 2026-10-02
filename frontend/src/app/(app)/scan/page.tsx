"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowRight, LoaderCircle, ScanLine, TriangleAlert } from "lucide-react";
import Dropzone from "@/components/Dropzone";
import PatientForm from "@/components/PatientForm";
import { classLabel } from "@/lib/format";
import { useAuth } from "@/components/AuthProvider";
import { EMPTY_PATIENT, GENDER_OPTIONS, isPatientValid, validatePatient, type PatientInfo } from "@/lib/patient";
import { PredictError, submitScan } from "@/lib/predict";
import { saveResult } from "@/lib/resultStore";
import { saveScanRecord } from "@/lib/scanRecords";
import { KIND_LABEL, type FileSelection } from "@/lib/scan-files";
import { useModelInfo } from "@/lib/useModelInfo";

function formatBytes(bytes: number): string {
  return bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function ScanPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [patient, setPatient] = useState<PatientInfo>(EMPTY_PATIENT);
  const [touched, setTouched] = useState<Partial<Record<keyof PatientInfo, boolean>>>({});
  const [selection, setSelection] = useState<FileSelection | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [preview, setPreview] = useState<{ patient: PatientInfo; selection: FileSelection } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const { state: modelState } = useModelInfo();
  const maxUploadMb = modelState.status === "ready" ? modelState.info.max_upload_mb : undefined;
  const classes = modelState.status === "ready" ? modelState.info.classes : null;

  const errors = validatePatient(patient);
  const patientOk = isPatientValid(patient);
  const anyTouched = Boolean(touched.fullName || touched.age || touched.gender);
  const showMissingFileHint = anyTouched && patientOk && selection === null;

  function markAllTouched() {
    setTouched({ fullName: true, age: true, gender: true });
  }

  // The button stays enabled even when the form is incomplete: a disabled button cannot be
  // clicked, so it could never explain to a first-time visitor what is still missing.
  function handleContinue() {
    markAllTouched();
    if (!patientOk || !selection) return;
    setPreview({ patient, selection });
  }

  async function handleAnalyse() {
    if (!preview) return;
    setSubmitting(true);
    setSubmitError(null);
    setProgress(0);
    try {
            const result = await submitScan(preview.selection.files, {
        onProgress: setProgress,
      });
      saveResult({ patient: preview.patient, result });
      if (user) {
        // Best-effort: the result is already viewable via sessionStorage even if this fails
        // (e.g. Firestore not yet enabled for this project).
        saveScanRecord(user.uid, preview.patient, result).catch(() => {});
      }
      router.push("/results");
    } catch (err) {
      setSubmitError(err instanceof PredictError ? err.message : "Something went wrong. Please try again.");
      setSubmitting(false);
    }
  }

  if (preview) {
    return (
      <div>
        <h1 className="text-3xl font-semibold">Ready to analyse</h1>
        <p className="mt-1 text-muted">Check the details below, then run the detection pipeline.</p>

        <section className="mt-8 max-w-xl rounded-2xl border border-line bg-film p-6">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-muted">Patient</h2>
          <dl className="mt-3 grid grid-cols-3 gap-4 text-sm">
            <div>
              <dt className="text-muted">Name</dt>
              <dd className="mt-0.5 font-medium">{preview.patient.fullName.trim()}</dd>
            </div>
            <div>
              <dt className="text-muted">Age</dt>
              <dd className="mt-0.5 font-medium">{preview.patient.age}</dd>
            </div>
            <div>
              <dt className="text-muted">Gender</dt>
              <dd className="mt-0.5 font-medium">
                {GENDER_OPTIONS.find((g) => g.value === preview.patient.gender)?.label ?? preview.patient.gender}
              </dd>
            </div>
          </dl>

          <h2 className="mt-6 text-xs font-semibold uppercase tracking-wide text-muted">Upload</h2>
          <p className="mt-3 text-sm">
            {KIND_LABEL[preview.selection.kind]} - {preview.selection.files.length}{" "}
            {preview.selection.files.length === 1 ? "file" : "files"}, {formatBytes(preview.selection.totalBytes)}
          </p>
          <ul className="mt-2 max-h-32 space-y-1 overflow-y-auto text-xs text-muted">
            {preview.selection.files.slice(0, 8).map((f) => (
              <li key={f.name} className="truncate">
                {f.name}
              </li>
            ))}
            {preview.selection.files.length > 8 && <li>and {preview.selection.files.length - 8} more</li>}
          </ul>

          {classes && (
            <p className="mt-6 text-xs text-muted">
              The model will look for: {classes.map(classLabel).join(", ")}.
            </p>
          )}
        </section>

        {submitError && (
          <p role="alert" className="mt-6 flex items-start gap-2 rounded-lg border border-signal/30 bg-signal-soft px-4 py-3 text-sm text-signal">
            <TriangleAlert size={16} className="mt-0.5 shrink-0" aria-hidden /> {submitError}
          </p>
        )}

        {submitting && (
          <div className="mt-6 max-w-xl" aria-live="polite">
            <div className="flex justify-between text-xs text-muted">
              <span>Uploading</span>
              <span>{Math.round(progress * 100)}%</span>
            </div>
            <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-line">
              <div className="h-full rounded-full bg-cortex transition-[width]" style={{ width: `${progress * 100}%` }} />
            </div>
          </div>
        )}

        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={handleAnalyse}
            disabled={submitting}
            className="inline-flex items-center gap-2 rounded-lg bg-cortex px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-cortex-dark disabled:cursor-not-allowed disabled:opacity-70"
          >
            {submitting ? (
              <>
                <LoaderCircle size={16} className="animate-spin" aria-hidden /> Analysing...
              </>
            ) : (
              <>
                Analyse scan <ArrowRight size={16} aria-hidden />
              </>
            )}
          </button>
          <button
            type="button"
            onClick={() => setPreview(null)}
            disabled={submitting}
            className="rounded-lg border border-line bg-white px-4 py-2.5 text-sm font-medium transition hover:bg-lightbox disabled:cursor-not-allowed disabled:opacity-70"
          >
            Back and edit
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-3">
        <ScanLine size={22} className="text-cortex" aria-hidden />
        <h1 className="text-3xl font-semibold">New scan</h1>
      </div>
      <p className="mt-1 text-muted">Enter patient details and upload a brain MRI study.</p>

      <div className="mt-8 max-w-3xl space-y-6">
        <PatientForm
          value={patient}
          onChange={setPatient}
          errors={errors}
          touched={touched}
          onBlur={(field) => setTouched((t) => ({ ...t, [field]: true }))}
        />

        <section aria-labelledby="upload-heading" className="rounded-2xl border border-line bg-film p-6">
          <h2 id="upload-heading" className="text-xs font-semibold uppercase tracking-wide text-muted">
            MRI study
          </h2>
          <div className="mt-4">
            <Dropzone
              selection={selection}
              onSelect={(s) => {
                setSelection(s);
                setFileError(null);
              }}
              onClear={() => {
                setSelection(null);
                setFileError(null);
              }}
              maxUploadMb={maxUploadMb}
              error={fileError}
              onError={(message) => {
                setFileError(message);
                setSelection(null);
              }}
            />
          </div>
        </section>

        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={handleContinue}
            className="inline-flex items-center gap-2 rounded-lg bg-cortex px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-cortex-dark"
          >
            Continue <ArrowRight size={16} aria-hidden />
          </button>
          {showMissingFileHint && <p className="text-sm text-muted">Choose a file to continue.</p>}
        </div>
      </div>
    </div>
  );
}