"""Cost-estimate endpoint. Extracts the deck once and returns slide/word/cost."""

import os
import tempfile

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from pydantic import BaseModel

import extractor
import cost as cost_mod

from .auth import require_token

router = APIRouter()


class EstimateResponse(BaseModel):
    slide_count: int
    word_count: int
    estimated_cost: float


@router.post("/estimate", response_model=EstimateResponse)
async def estimate(
    deck: UploadFile = File(...),
    _token: str = Depends(require_token),
):
    if not deck.filename or not deck.filename.lower().endswith(".pptx"):
        raise HTTPException(status_code=400, detail="Upload must be a .pptx file.")
    data = await deck.read()
    with tempfile.NamedTemporaryFile(suffix=".pptx", delete=False) as tmp:
        tmp.write(data)
        tmp_path = tmp.name
    try:
        slides = extractor.extract(tmp_path)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to read deck: {e}")
    finally:
        try:
            os.unlink(tmp_path)
        except OSError:
            pass

    if not slides:
        raise HTTPException(status_code=400, detail="Deck has no slides.")

    est = cost_mod.estimate(slides)
    return EstimateResponse(
        slide_count=est.slide_count,
        word_count=est.word_count,
        estimated_cost=round(est.cost, 4),
    )
