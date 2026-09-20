from typing import Literal

from pydantic import BaseModel, Field


class Thresholds(BaseModel):
    slice_threshold: float
    affected_ratio_cutoff: float


class SliceScore(BaseModel):
    index: int = Field(description="1-based slice number in the uploaded study")
    tumor_prob: float
    flagged: bool


class KeySlice(BaseModel):
    index: int
    tumor_prob: float
    predicted_class: str
    original: str = Field(description="data: URL (JPEG) of the slice")
    overlay: str = Field(description="data: URL (JPEG) of the slice with the Grad-CAM heat-map")


class PredictionResponse(BaseModel):
    scan_id: str
    filename: str
    input_type: Literal["image", "image_series", "volume"]
    model_status: Literal["trained", "demo"]
    brain_confidence: float | None = None
    gate_status: Literal["passed", "rejected", "disabled"] = "disabled"
    verdict: Literal["tumor_suspected", "no_tumor_detected", "not_brain_mri"]
    confidence: float
    borderline: bool
    tumor_type: str | None
    class_probabilities: dict[str, float]
    slices_total: int
    slices_analyzed: int
    slices_flagged: int
    affected_ratio: float
    thresholds: Thresholds
    slice_scores: list[SliceScore]
    key_slices: list[KeySlice]
    inference_ms: int
    disclaimer: str


class HealthResponse(BaseModel):
    status: Literal["ok", "degraded"]
    model_status: Literal["trained", "demo", "unavailable"]
    device: str | None = None
    gate_loaded: bool = False
    detail: str | None = None


class ModelInfo(BaseModel):
    architecture: str
    classes: list[str]
    input_size: int
    model_status: Literal["trained", "demo"]
    defaults: Thresholds
    metrics: dict
    gate_enabled: bool = False
    gate_threshold: float | None = None
    gate_metrics: dict = {}
    accepted_formats: list[str]
    max_upload_mb: int