"use client";

import { useCallback, useEffect, useState } from "react";
import { fetchModelInfo, type ModelInfo } from "@/lib/api";

export type ModelInfoState =
  | { status: "loading" }
  | { status: "ready"; info: ModelInfo }
  | { status: "error"; message: string };

/** Loads /api/v1/model once, with a manual retry. */
export function useModelInfo(): { state: ModelInfoState; retry: () => void } {
  const [state, setState] = useState<ModelInfoState>({ status: "loading" });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 6000);
    fetchModelInfo(controller.signal)
      .then((info) => setState({ status: "ready", info }))
      .catch(() =>
        setState({ status: "error", message: "Could not reach the backend. Is it running on port 8000?" }),
      )
      .finally(() => clearTimeout(timer));
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [attempt]);

  const retry = useCallback(() => {
    setState({ status: "loading" });
    setAttempt((n) => n + 1);
  }, []);

  return { state, retry };
}