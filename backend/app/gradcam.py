"""Grad-CAM for ResNet-18 (last residual block of layer4) plus overlay rendering."""
from __future__ import annotations

import base64
import io

import numpy as np
import torch
import torch.nn.functional as F
from PIL import Image

# Thermal ramp: transparent-ish indigo -> magenta -> orange -> pale yellow
_STOPS = np.array([0.0, 0.35, 0.60, 0.80, 1.0])
_COLORS = np.array([[30, 20, 90], [140, 30, 140], [230, 50, 110], [255, 150, 50], [255, 240, 130]], dtype=np.float32)
_LUT = np.stack([np.interp(np.linspace(0, 1, 256), _STOPS, _COLORS[:, c]) for c in range(3)], axis=1).astype(np.uint8)


def grad_cam(net: torch.nn.Module, batch: torch.Tensor, class_idx: list[int]) -> np.ndarray:
    """Return heat-maps [N, H, W] scaled to 0-1, one per sample, each for its own target class.

    BatchNorm runs in eval mode, so samples are independent and a single backward pass
    over the summed target logits yields per-sample gradients.
    """
    store: dict[str, torch.Tensor] = {}

    def on_forward(_module, _inputs, output):
        store["acts"] = output.detach()
        output.register_hook(lambda grad: store.__setitem__("grads", grad.detach()))

    handle = net.layer4[-1].register_forward_hook(on_forward)
    try:
        with torch.enable_grad():
            net.zero_grad(set_to_none=True)
            logits = net(batch)
            targets = torch.tensor(class_idx, device=logits.device).view(-1, 1)
            logits.gather(1, targets).sum().backward()
    finally:
        handle.remove()

    weights = store["grads"].mean(dim=(2, 3), keepdim=True)
    cam = F.relu((weights * store["acts"]).sum(dim=1, keepdim=True))
    cam = F.interpolate(cam, size=batch.shape[-2:], mode="bilinear", align_corners=False)[:, 0]
    flat = cam.flatten(1)
    lo, hi = flat.min(1).values.view(-1, 1, 1), flat.max(1).values.view(-1, 1, 1)
    return ((cam - lo) / (hi - lo + 1e-8)).cpu().numpy()


def render_overlay(gray_u8: np.ndarray, cam: np.ndarray) -> np.ndarray:
    """Blend a heat-map onto a grayscale slice. Both are square and the same size."""
    if cam.shape != gray_u8.shape:
        cam_img = Image.fromarray((cam * 255).astype(np.uint8)).resize(gray_u8.shape[::-1], Image.BICUBIC)
        cam = np.asarray(cam_img, dtype=np.float32) / 255.0
    heat = _LUT[(np.clip(cam, 0, 1) * 255).astype(np.uint8)].astype(np.float32)
    base = np.repeat(gray_u8[..., None], 3, axis=2).astype(np.float32)
    alpha = (np.clip(cam, 0, 1) ** 1.3 * 0.75)[..., None]
    return (base * (1 - alpha) + heat * alpha).astype(np.uint8)


def to_data_url(arr: np.ndarray, quality: int = 86) -> str:
    buf = io.BytesIO()
    Image.fromarray(arr).save(buf, format="JPEG", quality=quality)
    return "data:image/jpeg;base64," + base64.b64encode(buf.getvalue()).decode("ascii")