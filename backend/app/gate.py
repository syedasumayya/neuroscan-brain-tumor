"""Stage 1 gate: is the upload a brain MRI at all? (a small 2-class ResNet-18)"""
from __future__ import annotations

import logging
from dataclasses import dataclass, field

import numpy as np
import torch
import torch.nn as nn

from .config import Settings
from .model import ModelUnavailable, build_model
from .preprocessing import slices_to_tensor

log = logging.getLogger("neuroscan.gate")
BRAIN_CLASS = "brain_mri"
BATCH_SIZE = 16


@dataclass
class LoadedGate:
    net: nn.Module
    classes: list[str]
    image_size: int
    mean: tuple
    std: tuple
    device: torch.device
    metrics: dict = field(default_factory=dict)

    @property
    def brain_index(self) -> int:
        return self.classes.index(BRAIN_CLASS)


def load_gate(settings: Settings, device: torch.device) -> LoadedGate | None:
    """Return None (gate switched off) if there is no gate file. A broken gate file raises an error."""
    path = settings.gate_weights_path
    if not path.exists():
        log.warning("No gate weights at %s - the 'not a brain MRI' check is DISABLED.", path)
        return None
    try:
        ckpt = torch.load(path, map_location="cpu", weights_only=True)
        classes = list(ckpt.get("classes", []))
        if BRAIN_CLASS not in classes:
            raise ValueError(f"classes must include '{BRAIN_CLASS}', got {classes}")
        net = build_model(len(classes))
        net.load_state_dict(ckpt["state_dict"])
        net.to(device).eval()
        gate = LoadedGate(net, classes, int(ckpt.get("image_size", 224)), tuple(ckpt.get("mean", (0.485, 0.456, 0.406))),
                          tuple(ckpt.get("std", (0.229, 0.224, 0.225))), device, ckpt.get("metrics", {}))
    except Exception as exc:
        raise ModelUnavailable(f"Could not load the gate weights at {path}: {exc}") from exc
    log.info("Loaded gate weights from %s", path)
    return gate


@torch.inference_mode()
def brain_probabilities(gate: LoadedGate, slices: list[np.ndarray]) -> np.ndarray:
    """Probability (0-1) that each slice is a brain MRI."""
    x = slices_to_tensor(slices, gate.image_size, gate.mean, gate.std)
    out = []
    for i in range(0, len(x), BATCH_SIZE):
        logits = gate.net(x[i:i + BATCH_SIZE].to(gate.device))
        out.append(torch.softmax(logits, dim=1)[:, gate.brain_index].cpu())
    return torch.cat(out).numpy()