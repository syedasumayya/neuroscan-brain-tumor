"""Optional Firebase ID-token verification (no service account needed).

Enable with NEURO_REQUIRE_AUTH=true and NEURO_FIREBASE_PROJECT_ID=<your-project-id>.
Tokens are verified against Google's public securetoken certificates, which are cached for an hour.
"""
from __future__ import annotations

import threading
import time

import requests
from fastapi import Depends, Header, HTTPException, status
from google.auth import jwt

from .config import Settings, get_settings

CERTS_URL = "https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com"
_CACHE: dict = {"certs": None, "expires": 0.0}
_CACHE_LOCK = threading.Lock()


def _fetch_certs() -> dict:
    with _CACHE_LOCK:
        if _CACHE["certs"] and time.time() < _CACHE["expires"]:
            return _CACHE["certs"]
        resp = requests.get(CERTS_URL, timeout=5)
        resp.raise_for_status()
        _CACHE.update(certs=resp.json(), expires=time.time() + 3600)
        return _CACHE["certs"]


def verify_firebase_token(token: str, project_id: str) -> dict:
    claims = jwt.decode(token, certs=_fetch_certs(), audience=project_id)
    if claims.get("iss") != f"https://securetoken.google.com/{project_id}" or not claims.get("sub"):
        raise ValueError("Unexpected token issuer or subject.")
    return claims


def current_user(
    authorization: str | None = Header(default=None),
    settings: Settings = Depends(get_settings),
) -> dict | None:
    if not settings.require_auth:
        return None
    if not settings.firebase_project_id:
        raise HTTPException(status.HTTP_500_INTERNAL_SERVER_ERROR, "Server auth is misconfigured.")
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Sign in to analyse scans.",
                            headers={"WWW-Authenticate": "Bearer"})
    try:
        return verify_firebase_token(authorization[7:].strip(), settings.firebase_project_id)
    except Exception as exc:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Your session has expired. Sign in again.",
                            headers={"WWW-Authenticate": "Bearer"}) from exc