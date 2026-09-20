"""NeuroScan API - brain-tumour screening from MRI (FastAPI)."""
from __future__ import annotations

import logging
from contextlib import asynccontextmanager

from fastapi import Depends, FastAPI, File, Form, HTTPException, Request, UploadFile, status
from fastapi.middleware.cors import CORSMiddleware

from .auth import current_user
from .config import Settings, get_settings
from .gate import load_gate
from .inference import predict_study
from .model import LoadedModel, ModelUnavailable, load_model
from .preprocessing import IMAGE_EXT, NIFTI_EXT, InvalidStudy, build_study
from .schemas import HealthResponse, ModelInfo, PredictionResponse, Thresholds

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s: %(message)s")
log = logging.getLogger("neuroscan")


@asynccontextmanager
async def lifespan(app: FastAPI):
    settings = get_settings()
    app.state.model = None
    app.state.gate = None
    app.state.model_error = None
    try:
        model = load_model(settings)
        gate = load_gate(settings, model.device)   # None if there is no gate file
        app.state.model, app.state.gate = model, gate
    except ModelUnavailable as exc:
        app.state.model_error = str(exc)
        log.error("Model unavailable: %s", exc)
    yield


app = FastAPI(
    title="NeuroScan API",
    version="1.1.0",
    description="Brain tumour screening from MRI slices, archives and NIfTI volumes.",
    lifespan=lifespan,
)

_settings = get_settings()
app.add_middleware(
    CORSMiddleware,
    allow_origins=_settings.cors_origin_list,
    allow_methods=["GET", "POST"],
    allow_headers=["Authorization", "Content-Type"],
    max_age=600,
)


def _model(request: Request) -> LoadedModel:
    model = request.app.state.model
    if model is None:
        raise HTTPException(status.HTTP_503_SERVICE_UNAVAILABLE,
                            request.app.state.model_error or "The model is not loaded.")
    return model


@app.get("/health", response_model=HealthResponse, tags=["system"])
def health(request: Request) -> HealthResponse:
    model: LoadedModel | None = request.app.state.model
    if model is None:
        return HealthResponse(status="degraded", model_status="unavailable", detail=request.app.state.model_error)
    return HealthResponse(status="ok", model_status=model.status, device=str(model.device),
                          gate_loaded=request.app.state.gate is not None)


@app.get("/api/v1/model", response_model=ModelInfo, tags=["system"])
def model_info(request: Request, settings: Settings = Depends(get_settings)) -> ModelInfo:
    model = _model(request)
    gate = request.app.state.gate
    return ModelInfo(
        architecture="ResNet-18 (ImageNet transfer learning, early layers frozen)",
        classes=model.classes,
        input_size=model.image_size,
        model_status=model.status,
        defaults=Thresholds(slice_threshold=settings.slice_threshold,
                            affected_ratio_cutoff=settings.affected_ratio_cutoff),
        metrics=model.metrics,
        gate_enabled=gate is not None,
        gate_threshold=settings.gate_threshold if gate is not None else None,
        gate_metrics=gate.metrics if gate is not None else {},
        accepted_formats=[*IMAGE_EXT, *NIFTI_EXT, ".zip"],
        max_upload_mb=settings.max_upload_mb,
    )


@app.post("/api/v1/predict", response_model=PredictionResponse, tags=["inference"])
def predict(
    request: Request,
    files: list[UploadFile] = File(..., description="Images, one .zip of images, or one NIfTI volume"),
    slice_threshold: float | None = Form(default=None, ge=0.05, le=0.99),
    affected_ratio_cutoff: float | None = Form(default=None, ge=0.0, le=1.0),
    settings: Settings = Depends(get_settings),
    _user: dict | None = Depends(current_user),
) -> PredictionResponse:
    model = _model(request)

    limit = settings.max_upload_mb * 1024 * 1024
    declared = request.headers.get("content-length")
    if declared and declared.isdigit() and int(declared) > limit + 1024 * 1024:
        raise HTTPException(413, f"Upload exceeds the {settings.max_upload_mb} MB limit.")

    payload: list[tuple[str, bytes]] = []
    total = 0
    for f in files:
        data = f.file.read(limit - total + 1)
        total += len(data)
        if total > limit:
            raise HTTPException(413, f"Upload exceeds the {settings.max_upload_mb} MB limit.")
        payload.append((f.filename or "upload", data))

    try:
        study = build_study(payload, settings)
    except InvalidStudy as exc:
        raise HTTPException(422, str(exc)) from exc

    label = payload[0][0] if len(payload) == 1 else f"{len(payload)} images"
    result = predict_study(
        model,
        study,
        filename=label,
        slice_threshold=slice_threshold if slice_threshold is not None else settings.slice_threshold,
        affected_ratio_cutoff=(affected_ratio_cutoff if affected_ratio_cutoff is not None
                               else settings.affected_ratio_cutoff),
        key_slice_count=settings.key_slice_count,
        gate=request.app.state.gate,
        gate_threshold=settings.gate_threshold,
    )
    log.info("scan=%s type=%s gate=%s slices=%d flagged=%d verdict=%s %dms", result["scan_id"], result["input_type"],
             result["gate_status"], result["slices_analyzed"], result["slices_flagged"], result["verdict"],
             result["inference_ms"])
    return PredictionResponse(**result)