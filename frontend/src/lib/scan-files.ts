/** Mirrors backend/app/preprocessing.py so the browser can reject an obviously bad
 * upload before spending time sending it. The backend still re-checks everything. */

export const IMAGE_EXT = [".png", ".jpg", ".jpeg", ".bmp", ".tif", ".tiff", ".webp"] as const;
export const NIFTI_EXT = [".nii", ".nii.gz"] as const;
export const DEFAULT_MAX_UPLOAD_MB = 200; // matches backend/app/config.py's default

export type FileKind = "image" | "image_series" | "zip" | "volume";

export type FileSelection = {
  kind: FileKind;
  files: File[];
  totalBytes: number;
};

export type FileRejection = { ok: false; error: string };
export type FileAcceptance = { ok: true; selection: FileSelection };

function lowerName(f: File): string {
  return f.name.toLowerCase();
}

function hasExt(name: string, exts: readonly string[]): boolean {
  return exts.some((ext) => name.endsWith(ext));
}

function formatMb(bytes: number): string {
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** files: from an <input type="file"> or a drop event. maxUploadMb: from the backend, or the default. */
export function classifyFiles(files: File[], maxUploadMb: number = DEFAULT_MAX_UPLOAD_MB): FileAcceptance | FileRejection {
  if (files.length === 0) return { ok: false, error: "No files were selected." };

  const names = files.map(lowerName);
  const totalBytes = files.reduce((sum, f) => sum + f.size, 0);
  const limitBytes = maxUploadMb * 1024 * 1024;

  if (totalBytes > limitBytes) {
    return { ok: false, error: `That's ${formatMb(totalBytes)}; the limit is ${maxUploadMb} MB.` };
  }

  if (files.length === 1 && hasExt(names[0], NIFTI_EXT)) {
    return { ok: true, selection: { kind: "volume", files, totalBytes } };
  }

  if (files.length === 1 && names[0].endsWith(".zip")) {
    return { ok: true, selection: { kind: "zip", files, totalBytes } };
  }

  if (names.some((n) => hasExt(n, NIFTI_EXT) || n.endsWith(".zip"))) {
    return { ok: false, error: "Upload either one NIfTI file, one .zip archive, or image files - not a mix." };
  }

  const bad = files.find((f) => !hasExt(lowerName(f), IMAGE_EXT));
  if (bad) {
    return { ok: false, error: `'${bad.name}' is not a supported file type.` };
  }

  return {
    ok: true,
    selection: { kind: files.length === 1 ? "image" : "image_series", files, totalBytes },
  };
}

export const KIND_LABEL: Record<FileKind, string> = {
  image: "Single image",
  image_series: "Image series",
  zip: "Zip archive",
  volume: "NIfTI volume",
};

export function acceptAttribute(): string {
  return [...IMAGE_EXT, ...NIFTI_EXT, ".zip"].join(",");
}