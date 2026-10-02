"use client";

import { useCallback, useId, useRef, useState } from "react";
import { CircleCheck, FileImage, TriangleAlert, Upload, X } from "lucide-react";
import { acceptAttribute, classifyFiles, IMAGE_EXT, KIND_LABEL, NIFTI_EXT, type FileSelection } from "@/lib/scan-files";

function formatBytes(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const CHIPS = [...IMAGE_EXT, ...NIFTI_EXT, ".zip"];

type Props = {
  selection: FileSelection | null;
  onSelect: (selection: FileSelection) => void;
  onClear: () => void;
  maxUploadMb?: number;
  error: string | null;
  onError: (message: string) => void;
};

export default function Dropzone({ selection, onSelect, onClear, maxUploadMb, error, onError }: Props) {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const describedById = useId();

  const handleFiles = useCallback(
    (list: FileList | null) => {
      if (!list || list.length === 0) return;
      const result = classifyFiles(Array.from(list), maxUploadMb);
      if (result.ok) onSelect(result.selection);
      else onError(result.error);
    },
    [maxUploadMb, onSelect, onError],
  );

  function openPicker() {
    inputRef.current?.click();
  }

  function onDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragging(false);
    handleFiles(e.dataTransfer.files);
  }

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        multiple
        accept={acceptAttribute()}
        onChange={(e) => {
          handleFiles(e.target.files);
          e.target.value = ""; // lets the same file be re-selected after Remove
        }}
        className="sr-only"
        aria-hidden="true"
        tabIndex={-1}
      />

      <div
        {...(!selection && {
          role: "button" as const,
          tabIndex: 0,
          onClick: openPicker,
          onKeyDown: (e: React.KeyboardEvent) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              openPicker();
            }
          },
          onDrop,
        })}
        aria-describedby={describedById}
        onDragOver={(e) => {
          e.preventDefault();
          if (!selection) setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        className={`flex min-h-64 flex-col items-center justify-center rounded-2xl border-2 border-dashed p-8 text-center transition ${
          selection
            ? "border-clear/40 bg-clear-soft"
            : dragging
              ? "border-cortex bg-cortex-soft"
              : error
                ? "border-signal/50 bg-signal-soft cursor-pointer"
                : "border-line bg-film cursor-pointer hover:border-cortex/50 hover:bg-cortex-soft/40"
        }`}
      >
        {selection ? (
          <>
            <FileImage size={36} className="text-clear" aria-hidden />
            <p className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-clear/15 px-3 py-1 text-xs font-semibold text-clear">
              <CircleCheck size={14} aria-hidden /> File ready
            </p>
            <p className="mt-3 max-w-full truncate font-medium">
              {selection.files.length === 1 ? selection.files[0].name : `${selection.files.length} images`}
            </p>
            <p className="mt-1 text-sm text-muted">
              {KIND_LABEL[selection.kind]} - {formatBytes(selection.totalBytes)}
            </p>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onClear();
              }}
              className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-muted hover:text-signal"
            >
              <X size={15} aria-hidden /> Remove file
            </button>
          </>
        ) : (
          <>
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-cortex-soft text-cortex">
              <Upload size={24} aria-hidden />
            </span>
            <p className="mt-4 font-semibold">Click or drag & drop</p>
            <p className="mt-1 text-sm text-muted">
              A brain MRI image, a series of slices, a .zip archive, or a NIfTI volume
            </p>
          </>
        )}

        <p id={describedById} className="sr-only">
          Accepted file types: {CHIPS.join(", ")}.{maxUploadMb ? ` Up to ${maxUploadMb} MB.` : ""}
        </p>
      </div>

      {error && (
        <p role="alert" className="mt-3 flex items-start gap-2 text-sm text-signal">
          <TriangleAlert size={16} className="mt-0.5 shrink-0" aria-hidden /> {error}
        </p>
      )}

      <div className="mt-3 flex flex-wrap gap-2">
        {CHIPS.map((ext) => (
          <span key={ext} className="rounded-full border border-line bg-white px-2.5 py-1 text-xs text-muted">
            {ext}
          </span>
        ))}
      </div>
    </div>
  );
}