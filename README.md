# NeuroScan — Brain Tumor Detection from MRI

A full-stack brain tumor screening platform: a trained deep learning model, a FastAPI backend, and a Next.js frontend, built end to end as a research and learning project.

**Research and educational use only — this is not a medical device.** Every result must be reviewed by a qualified radiologist, and the app makes this explicit throughout.

## Why this exists

Most brain tumor detection demos stop at a probability score. That's not very useful to someone looking at a concerning scan — they need to know what to do next, not just a number. NeuroScan tries to close that gap:

- It explains its reasoning with **Grad-CAM heat-maps**, not just a confidence score.
- It refuses to guess on images that aren't brain MRIs in the first place, instead of confidently "diagnosing" the wrong thing.
- When it flags a possible tumor, it points toward real **neurosurgery and oncology hospitals in Pakistan**, so a result actually leads somewhere.

## Features

- **Two-stage detection pipeline**
  1. An MRI validity gate checks the upload is actually a brain MRI before anything else runs, and rejects chest X-rays, photos, screenshots, and other non-brain images.
  2. A ResNet-18 classifier scores every slice as glioma, meningioma, pituitary tumor, or no tumor.
- **Flexible uploads**: a single image, a series of slices, a `.zip` archive, or a full NIfTI (`.nii` / `.nii.gz`) volume.
- **Study-level verdict**: a slice is flagged at a tumor score ≥ 0.70; a study is positive when ≥ 11% of its slices are flagged — both adjustable per request.
- **Explainability**: Grad-CAM activation maps on the most suspicious slices, plus a per-slice score strip across the whole scan.
- **Hospital guidance**: on a tumor-suspected result, a curated, verified list of Pakistani hospitals (neurosurgery and oncology), filterable by province and ranked by relevance to the detected tumor type.
- **Accounts and history**: Firebase email/password and Google sign-in, with every scan saved to Firestore and viewable later.
- **Doctor feedback loop**: a "was this correct?" prompt on every result, aggregated into a live Metrics page alongside the model's own held-out test performance.
- **Dark mode, responsive layout**, and a printable PDF-style report for each result.

## Results

**Tumor classifier** — ResNet-18, ImageNet transfer learning, tested on 1,600 held-out images it never trained on:

| Metric | Result |
|---|---|
| Accuracy | 95.6% |
| Sensitivity (tumors caught) | 98.1% |
| Specificity (healthy cleared) | 100% |
| Per-class recall | glioma 84.5%, meningioma 98.5%, pituitary 99.5%, no tumor 100% |

**MRI validity gate** — a second ResNet-18, trained to distinguish brain MRIs from chest X-rays, photos, textures, and generated non-medical images. At its operating threshold: 100% of held-out brain MRIs accepted, ≥ 99.7% of every non-brain source rejected.

See [Limitations](#limitations) for what these numbers do and don't mean.

## Tech stack

**Backend**: Python, FastAPI, PyTorch, torchvision, nibabel (NIfTI), Grad-CAM
**Frontend**: Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4, Firebase (Auth + Firestore)
**Model**: ResNet-18, transfer learning from ImageNet, trained on the Brain Tumor MRI Dataset (Kaggle)

## Project structure

```
backend/
  app/            FastAPI app: model, gate, preprocessing, Grad-CAM, inference, auth
  training/        Training script for the tumor classifier
  weights/         Model checkpoints (not committed — see below)
  test_run.py      Analyse one image from the command line
frontend/
  src/app/         Pages (landing, login, dashboard, scan, results, history, metrics)
  src/components/  UI components
  src/lib/         API client, validation, Firestore access, hospital data
```

## Running it locally

### Backend
```bash
cd backend
python -m venv .venv
.venv\Scripts\Activate.ps1          # Windows; use `source .venv/bin/activate` on macOS/Linux
pip install torch torchvision --index-url https://download.pytorch.org/whl/cpu
pip install -r requirements-dev.txt
uvicorn app.main:app --port 8000
```
Model weights (`brain_resnet18.pt`, `brain_gate.pt`) go in `backend/weights/` — see [Model weights](#model-weights) below.

### Frontend
```bash
cd frontend
npm install
npm run dev
```
Create `frontend/.env.local` with:
```
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...
```
Then open `http://localhost:3000`.

## Model weights

Trained weights aren't committed to this repo (they're large binary files). Train your own with `backend/training/train.py` against the [Brain Tumor MRI Dataset](https://www.kaggle.com/datasets/masoudnickparvar/brain-tumor-mri-dataset) on Kaggle or Colab, or host your own checkpoint and point `NEURO_WEIGHTS_URL` / `NEURO_GATE_WEIGHTS_PATH` at it.


## Credits

- **Brain Tumor MRI Dataset** — Masoud Nickparvar (Kaggle), combining data from figshare, SARTAJ, and Br35H
- **Chest X-Ray Images (Pneumonia)** — Paul Mooney (Kaggle), originally from Kermany et al.
- **Flowers102** and **DTD** textures — Oxford VGG, via torchvision
- ResNet-18 ImageNet weights — torchvision

## License

Add a license of your choice (MIT is common for student projects) — see [choosealicense.com](https://choosealicense.com/).
