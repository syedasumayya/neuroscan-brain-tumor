"""Model definition and checkpoint loading."""
from __future__ import annotations

import hashlib
import logging
import urllib.request
from dataclasses import dataclass, field
from typing import Literal

import torch
import torch.nn as nn
from torchvision import models

from .config import Settings

log = logging.getLogger("neuroscan.model")

DEFAULT_CLASSES = ["glioma", "meningioma", "notumor", "pituitary"]
NO_TUMOR = "notumor"
IMAGENET_MEAN = (0.485, 0.456, 0.406)
IMAGENET_STD = (0.229, 0.224, 0.225)
FROZEN_PREFIXES = ("conv1", "bn1", "layer1", "layer2")


class ModelUnavailable(RuntimeError):
    """Raised when no trained weights exist and demo mode is off."""


def build_model(num_classes: int, pretrained: bool = False, freeze_early: bool = False) -> nn.Module:
    """ResNet-18 with a small dropout + linear head. Early layers can be frozen for transfer learning."""
    weights = models.ResNet18_Weights.IMAGENET1K_V1 if pretrained else None
    net = models.resnet18(weights=weights)
    net.fc = nn.Sequential(nn.Dropout(0.3), nn.Linear(net.fc.in_features, num_classes))
    if freeze_early:
        for name, param in net.named_parameters():
            if name.startswith(FROZEN_PREFIXES):
                param.requires_grad = False
    return net


@dataclass
class LoadedModel:
    net: nn.Module
    classes: list[str]
    image_size: int
    mean: tuple[float, float, float]
    std: tuple[float, float, float]
    device: torch.device
    status: Literal["trained", "demo"]
    metrics: dict = field(default_factory=dict)

    @property
    def no_tumor_index(self) -> int:
        return self.classes.index(NO_TUMOR)

    @property
    def tumor_indices(self) -> list[int]:
        return [i for i, c in enumerate(self.classes) if c != NO_TUMOR]


def resolve_device(name: str) -> torch.device:
    if name != "auto":
        return torch.device(name)
    if torch.cuda.is_available():
        return torch.device("cuda")
    if getattr(torch.backends, "mps", None) and torch.backends.mps.is_available():
        return torch.device("mps")
    return torch.device("cpu")


def _download_weights(settings: Settings) -> None:
    url = settings.weights_url
    if not url or not url.startswith("https://"):
        return
    dest = settings.weights_path
    dest.parent.mkdir(parents=True, exist_ok=True)
    log.info("Downloading weights from %s", url)
    tmp = dest.with_suffix(".download")
    urllib.request.urlretrieve(url, tmp)  # noqa: S310 - https enforced above
    if settings.weights_sha256:
        digest = hashlib.sha256(tmp.read_bytes()).hexdigest()
        if digest.lower() != settings.weights_sha256.lower():
            tmp.unlink(missing_ok=True)
            raise ModelUnavailable("Downloaded weights failed the SHA-256 integrity check.")
    tmp.replace(dest)


def load_model(settings: Settings) -> LoadedModel:
    device = resolve_device(settings.device)

    if not settings.weights_path.exists() and settings.weights_url:
        _download_weights(settings)

    if settings.weights_path.exists():
        ckpt = torch.load(settings.weights_path, map_location="cpu", weights_only=True)
        classes = list(ckpt.get("classes", DEFAULT_CLASSES))
        if NO_TUMOR not in classes:
            raise ModelUnavailable(f"Checkpoint classes must include '{NO_TUMOR}', got {classes}.")
        net = build_model(len(classes))
        net.load_state_dict(ckpt["state_dict"])
        status: Literal["trained", "demo"] = "trained"
        image_size = int(ckpt.get("image_size", settings.image_size))
        mean = tuple(ckpt.get("mean", IMAGENET_MEAN))
        std = tuple(ckpt.get("std", IMAGENET_STD))
        metrics = ckpt.get("metrics", {})
        log.info("Loaded trained weights from %s", settings.weights_path)
    elif settings.demo_mode:
        classes = list(DEFAULT_CLASSES)
        torch.manual_seed(0)
        net = build_model(len(classes))
        status, image_size, mean, std, metrics = "demo", settings.image_size, IMAGENET_MEAN, IMAGENET_STD, {}
        log.warning("DEMO MODE: running with untrained weights. Predictions are NOT meaningful.")
    else:
        raise ModelUnavailable(
            f"No weights found at {settings.weights_path}. Train a model (see training/train.py) "
            "or set NEURO_DEMO_MODE=true to run the API with untrained weights."
        )

    net.to(device).eval()
    return LoadedModel(net, classes, image_size, mean, std, device, status, metrics)