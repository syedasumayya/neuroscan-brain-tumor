export type Verdict = "tumor_suspected" | "no_tumor_detected" | "not_brain_mri";

export type SliceScoreEntry = { index: number; tumor_prob: number; flagged: boolean };

export type KeySlice = {
  index: number;
  tumor_prob: number;
  predicted_class: string;
  original: string;   // data: URL
  overlay: string;     // data: URL
};

export type PredictionResponse = {
  scan_id: string;
  filename: string;
  input_type: "image" | "image_series" | "volume";
  model_status: "trained" | "demo";
  brain_confidence: number | null;
  gate_status: "passed" | "rejected" | "disabled";
  verdict: Verdict;
  confidence: number;
  borderline: boolean;
  tumor_type: string | null;
  class_probabilities: Record<string, number>;
  slices_total: number;
  slices_analyzed: number;
  slices_flagged: number;
  affected_ratio: number;
  thresholds: { slice_threshold: number; affected_ratio_cutoff: number };
  slice_scores: SliceScoreEntry[];
  key_slices: KeySlice[];
  inference_ms: number;
  disclaimer: string;
};

export class PredictError extends Error {
  constructor(message: string, public status?: number) {
    super(message);
    this.name = "PredictError";
  }
}

function messageForStatus(status: number, detail: string | undefined): string {
  if (detail) return detail;
  if (status === 413) return "That upload is too large for the server to accept.";
  if (status === 422) return "That file couldn't be read as an MRI study.";
  if (status === 503) return "The model isn't loaded on the server right now.";
  return `The server answered with an unexpected error (HTTP ${status}).`;
}

type SubmitOptions = {
  sliceThreshold?: number;
  affectedRatioCutoff?: number;
  onProgress?: (fraction: number) => void;
  signal?: AbortSignal;
};

/** Uses XMLHttpRequest (not fetch) because only XHR reports upload progress for large files. */
export function submitScan(files: File[], options: SubmitOptions = {}): Promise<PredictionResponse> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", `${apiUrl}/api/v1/predict`);

    const form = new FormData();
    for (const f of files) form.append("files", f);
    if (options.sliceThreshold != null) form.append("slice_threshold", String(options.sliceThreshold));
    if (options.affectedRatioCutoff != null) form.append("affected_ratio_cutoff", String(options.affectedRatioCutoff));

    if (options.onProgress) {
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) options.onProgress!(e.loaded / e.total);
      };
    }

    if (options.signal) {
      if (options.signal.aborted) {
        reject(new PredictError("Cancelled."));
        return;
      }
      options.signal.addEventListener("abort", () => xhr.abort());
    }

    xhr.onabort = () => reject(new PredictError("Cancelled."));
    xhr.onerror = () => reject(new PredictError("Could not reach the backend. Is it running on port 8000?"));
    xhr.ontimeout = () => reject(new PredictError("The server took too long to respond."));

    xhr.onload = () => {
      let body: unknown;
      try {
        body = xhr.responseText ? JSON.parse(xhr.responseText) : undefined;
      } catch {
        body = undefined;
      }
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(body as PredictionResponse);
      } else {
        const detail = typeof body === "object" && body !== null && "detail" in body
          ? String((body as { detail: unknown }).detail)
          : undefined;
        reject(new PredictError(messageForStatus(xhr.status, detail), xhr.status));
      }
    };

    xhr.send(form);
  });
}