"""Password gate -> short-lived bearer token.

Single-instance in-memory token store. Fine for the free-tier deploy where
the backend is a single uvicorn worker.
"""

import os
import secrets
import time
from typing import Set

from fastapi import APIRouter, Header, HTTPException, status
from pydantic import BaseModel

router = APIRouter()

# token -> created_at unix ts
_TOKENS: dict = {}
_TOKEN_TTL_SECS = 60 * 60 * 8  # 8 hours


class AuthRequest(BaseModel):
    password: str


class AuthResponse(BaseModel):
    token: str


def _expected_password() -> str:
    pw = os.environ.get("APP_PASSWORD")
    if not pw:
        raise HTTPException(
            status_code=500,
            detail="Server misconfigured: APP_PASSWORD is not set.",
        )
    return pw


def _prune():
    """Drop any tokens past TTL."""
    now = time.time()
    expired = [t for t, ts in _TOKENS.items() if now - ts > _TOKEN_TTL_SECS]
    for t in expired:
        _TOKENS.pop(t, None)


def issue_token() -> str:
    _prune()
    tok = secrets.token_urlsafe(32)
    _TOKENS[tok] = time.time()
    return tok


def require_token(authorization: str = Header(default="")) -> str:
    """FastAPI dependency. Returns the validated token or raises 401."""
    _prune()
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing bearer token.")
    tok = authorization[len("Bearer "):].strip()
    if tok not in _TOKENS:
        raise HTTPException(status_code=401, detail="Invalid or expired token.")
    return tok


@router.post("/auth", response_model=AuthResponse)
def auth(body: AuthRequest):
    if not secrets.compare_digest(body.password, _expected_password()):
        # Constant-time compare; small sleep would be overkill for this scope.
        raise HTTPException(status_code=401, detail="Incorrect password.")
    return AuthResponse(token=issue_token())
