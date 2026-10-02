"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { History as HistoryIcon, RefreshCw, TriangleAlert } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import ScanListItem from "@/components/ScanListItem";
import { deleteScanRecord } from "@/lib/scanRecords";
import { useScanRecords } from "@/lib/useScanRecords";

export default function HistoryPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { state, refresh } = useScanRecords(user?.uid);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleDelete(id: string) {
    if (!user) return;
    if (!window.confirm("Delete this scan? This cannot be undone.")) return;
    setDeletingId(id);
    try {
      await deleteScanRecord(user.uid, id);
      refresh();
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div>
      <div className="flex items-center gap-3">
        <HistoryIcon size={22} className="text-cortex" aria-hidden />
        <h1 className="text-3xl font-semibold">History</h1>
      </div>
      <p className="mt-1 text-muted">Every study you have analysed, most recent first.</p>

      <div className="mt-8 max-w-2xl">
        {state.status === "loading" && (
          <div className="space-y-3" aria-busy="true" aria-label="Loading scan history">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-16 animate-pulse rounded-xl bg-film" />
            ))}
          </div>
        )}

        {state.status === "error" && (
          <div className="text-sm">
            <p className="flex items-center gap-2 text-signal">
              <TriangleAlert size={16} aria-hidden /> {state.message}
            </p>
            <button
              type="button"
              onClick={refresh}
              className="mt-3 inline-flex items-center gap-2 rounded-lg border border-line bg-white px-3 py-1.5 text-sm font-medium transition hover:bg-lightbox"
            >
              <RefreshCw size={14} aria-hidden /> Try again
            </button>
          </div>
        )}

        {state.status === "ready" && state.records.length === 0 && (
          <div className="rounded-2xl border border-dashed border-line bg-film p-8 text-center">
            <p className="font-medium">No scans yet</p>
            <p className="mt-1 text-sm text-muted">Analysed studies will appear here.</p>
          </div>
        )}

        {state.status === "ready" && state.records.length > 0 && (
          <div className="space-y-3">
            {state.records.map((r) => (
              <div key={r.id} className={deletingId === r.id ? "pointer-events-none opacity-50" : ""}>
                <ScanListItem
                  record={r}
                  onOpen={() => router.push(`/results?id=${r.id}`)}
                  onDelete={() => handleDelete(r.id)}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}