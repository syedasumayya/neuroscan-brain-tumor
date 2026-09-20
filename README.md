# NeuroScan — Brain Tumor Detection from MRI

Research and educational project. **Not a medical device** — outputs are not a diagnosis and must be reviewed by a qualified radiologist.

## What it does
- Accepts a brain MRI as an **image**, a **.zip of slices**, or a **NIfTI volume** (.nii / .nii.gz)
- **Stage 1 – MRI gate:** checks that the upload is actually a brain MRI and rejects anything else (photos, screenshots, chest X-rays)
- **Stage 2 – Tumor classifier:** scores every slice as glioma, meningioma, pituitary tumor or no tumor
- **Study-level verdict:** a slice counts as flagged at tumor score ≥ 0.70; the study is positive when ≥ 11% of slices are flagged (both adjustable per request)
- **Grad-CAM heat-maps** on the most suspicious slices
- REST API built with FastAPI

## Results (held-out test images the models never saw)

**Tumor classifier** — ResNet-18, ImageNet transfer learning, 1,600 test images

| Metric | Result |
|---|---|
| Accuracy | 95.6% |
| Sensitivity (tumors caught) | 98.1% |
| Specificity (healthy scans cleared) | 100% |
| Recall per class | glioma 84.5%, meningioma 98.5%, pituitary 99.5%, no tumor 100% |

Weakest spot: 22 of 400 gliomas were classified as "no tumor".

**MRI gate** — ResNet-18, brain MRIs vs. chest X-rays, photos, textures and generated blank/screenshot-like images. At threshold 0.5, 100% of test brain MRIs were accepted and 99.7–100% of each non-brain source was rejected. Manual checks: a brain MRI from a web page was accepted; a chest scan, a website screenshot and a car photo were rejected.

## Limitations
- The public dataset combines three sources and the test split comes from the same distribution; performance on other scanners or hospitals is expected to be lower.
- The 0.70 / 0.11 thresholds are starting values, not calibrated on volumetric data.
- The classifier is 2-D; its behavior on slices from NIfTI volumes has not been validated.
- The gate has not been tested on other MRI body parts or on brain CT.
- Confidence values for healthy scans (~95%) are not calibrated probabilities.

## Project structure
```
backend/
  app/            FastAPI app (model, gate, preprocessing, Grad-CAM, inference)
  weights/        put brain_resnet18.pt and brain_gate.pt here (not stored in git)
  test_run.py     analyse one image from the command line
  requirements.txt
frontend/         (coming next)
```

## Run the backend locally (Windows PowerShell)
```powershell
cd backend
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install torch torchvision --index-url https://download.pytorch.org/whl/cpu
pip install -r requirements.txt
uvicorn app.main:app --port 8000
```
Then open http://localhost:8000/docs. The model files must be in `backend/weights/`.

## Datasets and credits
- **Brain Tumor MRI Dataset** — Masoud Nickparvar (Kaggle), combining figshare, SARTAJ and Br35H data
- **Chest X-Ray Images (Pneumonia)** — Paul Mooney (Kaggle), data originally from Kermany et al. (CC BY 4.0)
- **Flowers102** and **DTD** textures — Oxford VGG, via torchvision
- ResNet-18 ImageNet pretrained weights — torchvision