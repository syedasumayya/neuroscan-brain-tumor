"""Study-level inference: gate -> per-slice classification -> aggregation -> explainability."""
from __future__ import annotations

import threading
import time
import uuid

import numpy as np
import torch
from PIL import Image

from .gate import LoadedGate, brain_probabilities
from .gradcam import grad_cam, render_overlay, to_data_url
from .model import LoadedModel
from .preprocessing import Study, slice_to_pil, slices_to_tensor

DISPLAY_SIZE = 256
BATCH_SIZE = 16
_LOCK = threading.Lock()  # one study at a time: keeps memory bounded and Grad-CAM hooks isolated

DISCLAIMER = (
    "Research and educational use only. This output is not a diagnosis and must not be used for "
    "clinical decisions. Results must be reviewed by a qualified radiologist."
)


@torch.inference_mode()
def _slice_probabilities(model: LoadedModel, x: torch.Tensor) -> np.ndarray:
    out = []
    for i in range(0, len(x), BATCH_SIZE):
        logits = model.net(x[i:i + BATCH_SIZE].to(model.device))
        out.append(torch.softmax(logits, dim=1).cpu())
    return torch.cat(out).numpy()


def predict_study(
    model: LoadedModel,
    study: Study,
    *,
    filename: str,
    slice_threshold: float,
    affected_ratio_cutoff: float,
    key_slice_count: int,
    gate: LoadedGate | None = None,
    gate_threshold: float = 0.5,
) -> dict:
    started = time.perf_counter()

    # ---- Stage 1: is this a brain MRI at all? -----------------------------------------
    brain_conf, gate_status = None, "disabled"
    if gate is not None:
        with _LOCK:
            p_brain = brain_probabilities(gate, study.slices)
        brain_conf = float(np.median(p_brain))
        gate_status = "passed" if brain_conf >= gate_threshold else "rejected"

    common = {
        "scan_id": uuid.uuid4().hex,
        "filename": filename,
        "input_type": study.input_type,
        "model_status": model.status,
        "brain_confidence": None if brain_conf is None else round(brain_conf, 4),
        "gate_status": gate_status,
        "slices_total": study.total_slices,
        "slices_analyzed": len(study.slices),
        "thresholds": {"slice_threshold": slice_threshold, "affected_ratio_cutoff": affected_ratio_cutoff},
        "disclaimer": DISCLAIMER,
    }

    if gate_status == "rejected":
        return {
            **common,
            "verdict": "not_brain_mri",
            "confidence": round(1.0 - brain_conf, 4),   # how sure we are that it is NOT a brain MRI
            "borderline": brain_conf >= 0.30,
            "tumor_type": None,
            "class_probabilities": {},
            "slices_flagged": 0,
            "affected_ratio": 0.0,
            "slice_scores": [],
            "key_slices": [],
            "inference_ms": int((time.perf_counter() - started) * 1000),
        }

    # ---- Stage 2: tumour detection ------------------------------------------------------
    x = slices_to_tensor(study.slices, model.image_size, model.mean, model.std)

    with _LOCK:
        probs = _slice_probabilities(model, x)

        nt = model.no_tumor_index
        tumor_prob = 1.0 - probs[:, nt]
        flagged = tumor_prob >= slice_threshold
        analysed, n_flagged = len(study.slices), int(flagged.sum())
        ratio = n_flagged / analysed
        positive = n_flagged >= 1 and ratio >= affected_ratio_cutoff

        basis = probs[flagged] if positive else probs
        mean_probs = basis.mean(axis=0)
        tumor_idx = model.tumor_indices
        tumor_type = model.classes[tumor_idx[int(np.argmax(mean_probs[tumor_idx]))]] if positive else None

        max_tumor = float(tumor_prob.max())
        confidence = float(tumor_prob[flagged].mean()) if positive else 1.0 - max_tumor
        borderline = (positive and confidence < 0.80) or (not positive and max_tumor >= 0.50)
        if brain_conf is not None and brain_conf < 0.75:   # gate passed, but only just
            borderline = True

        # ---- key slices with Grad-CAM -------------------------------------------------
        order = np.argsort(-tumor_prob)[: min(key_slice_count, analysed)]
        per_slice_class = [tumor_idx[int(np.argmax(probs[i][tumor_idx]))] for i in order]
        cams = grad_cam(model.net, x[order].to(model.device), per_slice_class)

    key_slices = []
    for rank, i in enumerate(order):
        gray = np.asarray(slice_to_pil(study.slices[i], DISPLAY_SIZE))
        cam_img = Image.fromarray((cams[rank] * 255).astype(np.uint8)).resize((DISPLAY_SIZE, DISPLAY_SIZE), Image.BICUBIC)
        cam = np.asarray(cam_img, dtype=np.float32) / 255.0
        key_slices.append({
            "index": study.indices[i],
            "tumor_prob": round(float(tumor_prob[i]), 4),
            "predicted_class": model.classes[per_slice_class[rank]],
            "original": to_data_url(gray),
            "overlay": to_data_url(render_overlay(gray, cam)),
        })

    return {
        **common,
        "verdict": "tumor_suspected" if positive else "no_tumor_detected",
        "confidence": round(confidence, 4),
        "borderline": bool(borderline),
        "tumor_type": tumor_type,
        "class_probabilities": {c: round(float(p), 4) for c, p in zip(model.classes, mean_probs)},
        "slices_flagged": n_flagged,
        "affected_ratio": round(ratio, 4),
        "slice_scores": [
            {"index": study.indices[i], "tumor_prob": round(float(tumor_prob[i]), 4), "flagged": bool(flagged[i])}
            for i in range(analysed)
        ],
        "key_slices": key_slices,
        "inference_ms": int((time.perf_counter() - started) * 1000),
    }