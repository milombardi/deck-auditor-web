"""Deck Auditor FastAPI backend.

Endpoints:
- POST /api/auth        -> {token} | 401
- POST /api/estimate    -> {slide_count, word_count, estimated_cost}
- POST /api/audit       -> SSE stream of progress + final result
- POST /api/cancel/{id} -> 204

The audit modules in ./audit/ are unchanged from the Streamlit version
(only three of them gained an optional should_cancel hook).
"""

import os
import sys
from contextlib import asynccontextmanager

# Make ./audit a sys.path entry so its flat imports (import config, etc.) work.
_THIS_DIR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(_THIS_DIR, "audit"))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routes import auth as auth_route
from routes import estimate as estimate_route
from routes import audit as audit_route


@asynccontextmanager
async def lifespan(app: FastAPI):
    yield


app = FastAPI(title="Deck Auditor API", version="1.0", lifespan=lifespan)

# CORS — defaults to "*" for local dev. In production, set CORS_ALLOWED_ORIGIN
# to the deployed frontend URL.
origin = os.environ.get("CORS_ALLOWED_ORIGIN", "*")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[origin] if origin != "*" else ["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_route.router, prefix="/api")
app.include_router(estimate_route.router, prefix="/api")
app.include_router(audit_route.router, prefix="/api")


@app.get("/api/health")
def health():
    return {"ok": True}
