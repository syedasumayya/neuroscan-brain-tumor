"use client";

import { Trash2 } from "lucide-react";
import VerdictBadge from "@/components/VerdictBadge";
import type { ScanRecord } from "@/lib/scanRecords";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

export default function ScanListItem({
  record,
  onOpen,
  onDelete,
}: {
  record: ScanRecord;
  onOpen: () => void;
  onDelete?: () => void;
}) {
  return (
    <div className="flex items-center gap-2 rounded-xl border border-line bg-white p-3 pl-4">
      <button type="button" onClick={onOpen} className="flex min-w-0 flex-1 items-center justify-between gap-4 text-left">
        <div className="min-w-0">
          <p className="truncate font-medium">{record.patient.fullName.trim() || "Unnamed patient"}</p>
          <p className="mt-0.5 text-xs text-muted">
            {record.patient.age} yrs - {formatDate(record.createdAt)}
          </p>
        </div>
        <VerdictBadge verdict={record.result.verdict} />
      </button>
      {onDelete && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          aria-label="Delete scan"
          className="shrink-0 rounded-lg p-2 text-muted transition hover:bg-signal-soft hover:text-signal"
        >
          <Trash2 size={16} aria-hidden />
        </button>
      )}
    </div>
  );
}