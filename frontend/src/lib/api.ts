export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export type Health = {
  status: "ok" | "degraded";
  model_status: "trained" | "demo" | "unavailable";
  device: string | null;
  gate_loaded: boolean;
  detail: string | null;
};

export type ModelMetrics = {
  accuracy?: number;
  macro_f1?: number;
  recall?: number[];
  confusion_matrix?: number[][];
  sensitivity?: number;
  specificity?: number;
};

export type ModelInfo = {
  architecture: string;
  classes: string[];
  input_size: number;
  model_status: "trained" | "demo";
  defaults: { slice_threshold: number; affected_ratio_cutoff: number };
  metrics: { test?: ModelMetrics; validation?: ModelMetrics; trained_at?: string; epochs?: number };
  gate_enabled: boolean;
  gate_threshold: number | null;
  gate_metrics: {
    test_by_threshold?: Record<string, { brain_accepted: number; rejected: Record<string, number> }>;
    val_accuracy?: number;
    trained_at?: string;
  };
  accepted_formats: string[];
  max_upload_mb: number;
};

async function getJson<T>(path: string, signal?: AbortSignal): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, { signal, cache: "no-store" });
  if (!res.ok) throw new Error(`Backend answered HTTP ${res.status}`);
  return res.json();
}

export const fetchHealth = (signal?: AbortSignal) => getJson<Health>("/health", signal);
export const fetchModelInfo = (signal?: AbortSignal) => getJson<ModelInfo>("/api/v1/model", signal);