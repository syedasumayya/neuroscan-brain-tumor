"""Runtime configuration. Every value can be overridden with a NEURO_* env var."""
from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

BASE_DIR = Path(__file__).resolve().parent.parent


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_prefix="NEURO_", extra="ignore")

    # --- model -------------------------------------------------------------
    weights_path: Path = BASE_DIR / "weights" / "brain_resnet18.pt"
    weights_url: str | None = None          # optional: download weights on first start
    weights_sha256: str | None = None       # optional integrity check for the download
    demo_mode: bool = False                 # run with UNTRAINED weights (UI development only)
    device: str = "auto"                    # auto | cpu | cuda | mps
    image_size: int = 224
    gate_weights_path: Path = BASE_DIR / "weights" / "brain_gate.pt"
    gate_threshold: float = 0.50            # minimum "this is a brain MRI" score to continue

    # --- study-level decision logic ----------------------------------------
    slice_threshold: float = 0.70           # a slice is "flagged" at/above this tumour probability
    affected_ratio_cutoff: float = 0.11     # study is positive if flagged/analysed >= this
    max_slices: int = 64                    # volumes are sub-sampled to at most this many slices
    min_brain_fraction: float = 0.05        # skip near-empty slices of a volume
    key_slice_count: int = 6                # slices returned with Grad-CAM overlays

    # --- limits ------------------------------------------------------------
    max_upload_mb: int = 200
    max_files: int = 400
    max_zip_uncompressed_mb: int = 500

    # --- web ---------------------------------------------------------------
    cors_origins: str = "http://localhost:3000"
    require_auth: bool = False
    firebase_project_id: str | None = None

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()