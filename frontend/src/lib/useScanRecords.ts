"use client";

import { useCallback, useEffect, useState } from "react";
import { listScanRecords, type ScanRecord } from "@/lib/scanRecords";

export type ScanRecordsState =
  | { status: "loading" }
  | { status: "ready"; records: ScanRecord[] }
  | { status: "error"; message: string };

export function useScanRecords(uid: string | undefined, max = 50): { state: ScanRecordsState; refresh: () => void } {
  const [state, setState] = useState<ScanRecordsState>({ status: "loading" });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!uid) return;
    let alive = true;
    listScanRecords(uid, max)
      .then((records) => {
        if (alive) setState({ status: "ready", records });
      })
      .catch(() => {
        if (alive) setState({ status: "error", message: "Could not load scan history." });
      });
    return () => {
      alive = false;
    };
  }, [uid, max, attempt]);

  const refresh = useCallback(() => {
    setState({ status: "loading" });
    setAttempt((n) => n + 1);
  }, []);

  return { state, refresh };
}