"""Turn uploads into a clean list of 2-D uint8 slices, and slices into model tensors.

Supported inputs
  * one or more 2-D images (png / jpg / bmp / tif / webp) -> "image" or "image_series"
  * a .zip archive of 2-D images                           -> "image_series"
  * a single NIfTI volume (.nii / .nii.gz)                 -> "volume" (axial slices)
"""
from __future__ import annotations

import io
import os
import re
import tempfile
import zipfile
from dataclasses import dataclass

import numpy as np
import torch
from PIL import Image

from .config import Settings

Image.MAX_IMAGE_PIXELS = 50_000_000

IMAGE_EXT = (".png", ".jpg", ".jpeg", ".bmp", ".tif", ".tiff", ".webp")
NIFTI_EXT = (".nii", ".nii.gz")
MAX_SINGLE_IMAGE_BYTES = 50 * 1024 * 1024


class InvalidStudy(ValueError):
    """The upload cannot be interpreted as an MRI study. The message is safe to show to users."""


@dataclass
class Study:
    slices: list[np.ndarray]      # 2-D uint8 arrays
    indices: list[int]            # 1-based position of each analysed slice in the original study
    total_slices: int             # slices in the original study
    input_type: str               # image | image_series | volume


# --------------------------------------------------------------------------- helpers
def natural_key(text: str) -> list:
    return [int(t) if t.isdigit() else t.lower() for t in re.split(r"(\d+)", text)]


def normalize_to_uint8(arr: np.ndarray, lo_pct: float = 0.5, hi_pct: float = 99.5) -> np.ndarray:
    """Robust intensity window: percentile clip on non-zero voxels, scaled to 0-255."""
    arr = np.nan_to_num(arr.astype(np.float32), nan=0.0, posinf=0.0, neginf=0.0)
    ref = arr[arr != 0]
    if ref.size < 100:
        ref = arr.ravel()
    if ref.size == 0:
        return np.zeros(arr.shape, np.uint8)
    lo, hi = np.percentile(ref, [lo_pct, hi_pct])
    if hi <= lo:
        return np.zeros(arr.shape, np.uint8)
    return (np.clip((arr - lo) / (hi - lo), 0, 1) * 255).astype(np.uint8)


def brain_fraction(slice_u8: np.ndarray) -> float:
    return float((slice_u8 > 15).mean())


def _decode_image(data: bytes, name: str) -> np.ndarray:
    try:
        with Image.open(io.BytesIO(data)) as im:
            im.load()
            if im.mode in ("I;16", "I", "F"):
                return normalize_to_uint8(np.asarray(im))
            return np.asarray(im.convert("L"), dtype=np.uint8)
    except Exception as exc:  # PIL raises many types (OSError, ValueError, DecompressionBombError)
        raise InvalidStudy(f"'{name}' could not be read as an image.") from exc


def _evenly_subsample(items: list, limit: int) -> list:
    if len(items) <= limit:
        return items
    picks = np.unique(np.linspace(0, len(items) - 1, limit).round().astype(int))
    return [items[i] for i in picks]


def _finalise(arrays: list[np.ndarray], positions: list[int], total: int, input_type: str,
              settings: Settings, drop_blank: bool) -> Study:
    pairs = list(zip(arrays, positions))
    if drop_blank:
        kept = [p for p in pairs if brain_fraction(p[0]) >= settings.min_brain_fraction]
        pairs = kept or pairs  # never end up with nothing
    pairs = _evenly_subsample(pairs, settings.max_slices)
    return Study([p[0] for p in pairs], [p[1] for p in pairs], total, input_type)


# --------------------------------------------------------------------------- loaders
def _load_nifti(data: bytes, name: str) -> np.ndarray:
    import nibabel as nib

    suffix = ".nii.gz" if name.lower().endswith(".gz") else ".nii"
    with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as tmp:
        tmp.write(data)
        path = tmp.name
    try:
        img = nib.as_closest_canonical(nib.load(path))
        volume = np.asarray(img.dataobj, dtype=np.float32)
    except Exception as exc:
        raise InvalidStudy(f"'{name}' is not a valid NIfTI file.") from exc
    finally:
        os.unlink(path)

    if volume.ndim == 4:
        volume = volume[..., 0]
    if volume.ndim != 3:
        raise InvalidStudy("The NIfTI file must contain a 3-D volume.")
    return volume


def _study_from_volume(data: bytes, name: str, settings: Settings) -> Study:
    volume = normalize_to_uint8(_load_nifti(data, name))
    depth = volume.shape[2]
    if depth < 1:
        raise InvalidStudy("The volume has no slices.")
    arrays = [np.rot90(volume[:, :, k]).copy() for k in range(depth)]  # anterior up
    return _finalise(arrays, list(range(1, depth + 1)), depth, "volume", settings, drop_blank=True)


def _images_from_zip(data: bytes, settings: Settings) -> list[tuple[str, bytes]]:
    try:
        zf = zipfile.ZipFile(io.BytesIO(data))
    except zipfile.BadZipFile as exc:
        raise InvalidStudy("The .zip archive is corrupted.") from exc

    with zf:
        infos = [
            i for i in zf.infolist()
            if not i.is_dir()
            and "__MACOSX" not in i.filename
            and not os.path.basename(i.filename).startswith(".")
            and i.filename.lower().endswith(IMAGE_EXT)
        ]
        if not infos:
            raise InvalidStudy("The .zip archive contains no supported images (png, jpg, bmp, tif, webp).")
        if len(infos) > settings.max_files:
            raise InvalidStudy(f"The archive holds {len(infos)} images; the limit is {settings.max_files}.")
        if sum(i.file_size for i in infos) > settings.max_zip_uncompressed_mb * 1024 * 1024:
            raise InvalidStudy("The archive is too large once extracted.")

        out: list[tuple[str, bytes]] = []
        for info in infos:
            with zf.open(info) as fh:
                blob = fh.read(MAX_SINGLE_IMAGE_BYTES + 1)  # guards against forged size headers
            if len(blob) > MAX_SINGLE_IMAGE_BYTES:
                raise InvalidStudy(f"'{info.filename}' is too large.")
            out.append((info.filename, blob))
        return out


def build_study(files: list[tuple[str, bytes]], settings: Settings) -> Study:
    """files: list of (filename, raw bytes)."""
    if not files:
        raise InvalidStudy("No files were uploaded.")

    lowered = [n.lower() for n, _ in files]

    if len(files) == 1 and lowered[0].endswith(NIFTI_EXT):
        return _study_from_volume(files[0][1], files[0][0], settings)

    if len(files) == 1 and lowered[0].endswith(".zip"):
        files = _images_from_zip(files[0][1], settings)
    elif any(n.endswith(NIFTI_EXT) or n.endswith(".zip") for n in lowered):
        raise InvalidStudy("Upload either one NIfTI file, one .zip archive, or image files - not a mix.")
    elif len(files) > settings.max_files:
        raise InvalidStudy(f"Too many files ({len(files)}); the limit is {settings.max_files}.")

    bad = [n for n, _ in files if not n.lower().endswith(IMAGE_EXT)]
    if bad:
        raise InvalidStudy(
            f"'{bad[0]}' is not a supported file type. Use png, jpg, bmp, tif, webp, .nii, .nii.gz or .zip."
        )

    files = sorted(files, key=lambda f: natural_key(f[0]))
    arrays = [_decode_image(blob, name) for name, blob in files]
    n = len(arrays)
    input_type = "image" if n == 1 else "image_series"
    return _finalise(arrays, list(range(1, n + 1)), n, input_type, settings, drop_blank=n > 1)


# --------------------------------------------------------------------------- tensors
def pad_to_square(img: Image.Image) -> Image.Image:
    """Letter-box to a square on a black canvas so resizing never distorts anatomy."""
    w, h = img.size
    if w == h:
        return img
    side = max(w, h)
    canvas = Image.new(img.mode, (side, side), 0)
    canvas.paste(img, ((side - w) // 2, (side - h) // 2))
    return canvas


def slice_to_pil(slice_u8: np.ndarray, size: int) -> Image.Image:
    return pad_to_square(Image.fromarray(slice_u8, "L")).resize((size, size), Image.BICUBIC)


def slices_to_tensor(slices: list[np.ndarray], size: int, mean, std) -> torch.Tensor:
    """-> float tensor [N, 3, size, size], ImageNet-normalised."""
    batch = np.stack([np.asarray(slice_to_pil(s, size)) for s in slices]).astype(np.float32) / 255.0
    t = torch.from_numpy(batch).unsqueeze(1).repeat(1, 3, 1, 1)
    m = torch.tensor(mean, dtype=torch.float32).view(1, 3, 1, 1)
    s = torch.tensor(std, dtype=torch.float32).view(1, 3, 1, 1)
    return (t - m) / s