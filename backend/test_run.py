"""Quick check without the web server: analyse ONE image from the command line.

Usage:   python test_run.py my_image.jpg
"""
import base64
import sys
from pathlib import Path

from app.config import get_settings
from app.gate import load_gate
from app.inference import predict_study
from app.model import load_model
from app.preprocessing import build_study

if len(sys.argv) != 2:
    sys.exit("Usage: python test_run.py my_image.jpg")

path = Path(sys.argv[1])
settings = get_settings()

model = load_model(settings)
gate = load_gate(settings, model.device)
study = build_study([(path.name, path.read_bytes())], settings)
result = predict_study(
    model,
    study,
    filename=path.name,
    slice_threshold=settings.slice_threshold,
    affected_ratio_cutoff=settings.affected_ratio_cutoff,
    key_slice_count=settings.key_slice_count,
    gate=gate,
    gate_threshold=settings.gate_threshold,
)

print()
print("File            :", result["filename"])
if result["brain_confidence"] is None:
    print("Brain MRI check : DISABLED (no brain_gate.pt found)")
else:
    print("Brain MRI check :", result["gate_status"], f'(brain score {result["brain_confidence"] * 100:.1f}%)')
print("Verdict         :", result["verdict"])

if result["verdict"] == "not_brain_mri":
    print("\nThis image does not look like a brain MRI, so no tumour analysis was done.")
else:
    print("Tumour type     :", result["tumor_type"])
    print("Confidence      :", f'{result["confidence"] * 100:.1f}%')
    print("Low confidence? :", result["borderline"])
    print("Class scores    :", result["class_probabilities"])
    overlay = result["key_slices"][0]["overlay"].split(",", 1)[1]
    Path("gradcam_output.jpg").write_bytes(base64.b64decode(overlay))
    print("\nSaved gradcam_output.jpg  <- open it to see the heat-map")
print("Time            :", result["inference_ms"], "ms")