"""Audit endpoint that streams progress as Server-Sent Events.

Flow:
1. Client POSTs deck + api_key + meeting_minutes.
2. Server creates a job_id, starts the audit on a worker thread, and immediately
   begins streaming SSE events to the client.
3. Events:
     event: job       data: {"job_id": "..."}
     event: progress  data: {"stage": "voice", "current": 12, "total": 49}
     event: result    data: {"scores": {...}, "sections": {...}, "report_md": "...", "cost_summary": "...", "elapsed": 12.3}
     event: error     data: {"message": "..."}
     event: cancelled data: {}
4. Client can POST /api/cancel/{job_id} to cooperatively stop the job.
"""

import asyncio
import json
import os
import queue
import secrets
import tempfile
import threading
import time
import uuid
from dataclasses import asdict

from anthropic import Anthropic
from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from sse_starlette.sse import EventSourceResponse

# audit modules (sys.path was extended in main.py)
import config as audit_config
import density
import extractor
import narrative
import redundancy
import report as report_mod
import scoring
import takeaway
import voice
from cost import CostTracker
from _cancel import JobCancelled

from .auth import require_token

router = APIRouter()

# Active jobs: job_id -> { "cancel": threading.Event, "queue": queue.Queue }
_JOBS: dict = {}


def _split_sections(md: str) -> dict:
    out, current, buf = {}, None, []
    for line in md.splitlines():
        if line.startswith("## "):
            if current is not None:
                out[current] = "\n".join(buf).strip()
            current = line[3:].strip()
            buf = []
        else:
            if current is not None:
                buf.append(line)
    if current is not None:
        out[current] = "\n".join(buf).strip()
    return out


def _run_audit_worker(
    deck_path: str,
    api_key: str,
    meeting_minutes: int,
    job_id: str,
    cancel_event: threading.Event,
    out_q: "queue.Queue[dict]",
):
    """Runs in a background thread. Pushes events onto out_q for the SSE generator."""
    def should_cancel() -> bool:
        return cancel_event.is_set()

    def emit(event: str, data: dict):
        out_q.put({"event": event, "data": data})

    try:
        emit("job", {"job_id": job_id})

        slides = extractor.extract(deck_path)
        total = len(slides)
        if total == 0:
            emit("error", {"message": "Deck has no slides."})
            return

        if total > audit_config.SLIDE_HARD_STOP:
            emit("error", {
                "message": f"Deck has {total} slides, above hard stop of "
                           f"{audit_config.SLIDE_HARD_STOP}.",
            })
            return

        emit("progress", {"stage": "extract", "current": total, "total": total})

        client = Anthropic(api_key=api_key)
        tracker = CostTracker()
        start = time.time()

        # Voice regex (instant)
        voice_results = {
            "regex": voice.regex_scan(slides),
            "deck_construction": voice.deck_construction_scan(slides),
            "api": [],
        }
        emit("progress", {"stage": "voice", "current": 0, "total": total})

        def voice_progress(i, n):
            emit("progress", {"stage": "voice", "current": i, "total": n})

        voice_results["api"] = voice.api_scan(
            slides, client, tracker,
            on_progress=voice_progress, should_cancel=should_cancel,
        )

        density_flags = density.run(slides, meeting_minutes)
        emit("progress", {"stage": "density", "current": total, "total": total})

        if should_cancel():
            raise JobCancelled()

        def head_progress(i, n):
            emit("progress", {"stage": "headlines", "current": i, "total": n})

        headline_flags = narrative.run(
            slides, client, tracker,
            on_progress=head_progress, should_cancel=should_cancel,
        )

        def take_progress(i, n):
            emit("progress", {"stage": "takeaway", "current": i, "total": n})

        takeaway_flags = takeaway.run(
            slides, client, tracker,
            on_progress=take_progress, should_cancel=should_cancel,
        )

        if should_cancel():
            raise JobCancelled()

        emit("progress", {"stage": "redundancy", "current": 0, "total": 1})
        redundancy_flags = redundancy.run(slides, client, tracker)
        emit("progress", {"stage": "redundancy", "current": 1, "total": 1})

        scores = scoring.score(
            slides, headline_flags, takeaway_flags,
            voice_results, density_flags, redundancy_flags,
        )
        report_md = report_mod.build(
            deck_path=os.path.basename(deck_path),
            slides=slides,
            scores=scores,
            headline_flags=headline_flags,
            takeaway_flags=takeaway_flags,
            voice_flags=voice_results,
            density_flags=density_flags,
            redundancy_flags=redundancy_flags,
            actual_cost_summary=tracker.summary(),
        )
        elapsed = time.time() - start

        emit("result", {
            "scores": {
                "total": scores.total,
                "band": scores.band,
                "narrative": scores.narrative,
                "takeaway": scores.takeaway,
                "voice": scores.voice,
                "density": scores.density,
                "redundancy": scores.redundancy,
            },
            "sections": _split_sections(report_md),
            "report_md": report_md,
            "cost_summary": tracker.summary(),
            "cost": tracker.cost,
            "elapsed": round(elapsed, 2),
            "slide_count": total,
        })
    except JobCancelled:
        emit("cancelled", {})
    except Exception as e:
        emit("error", {"message": str(e)[:500]})
    finally:
        # Sentinel so the SSE generator knows to stop.
        out_q.put(None)
        try:
            os.unlink(deck_path)
        except OSError:
            pass


@router.post("/audit")
async def audit(
    deck: UploadFile = File(...),
    api_key: str = Form(...),
    meeting_minutes: int = Form(audit_config.DEFAULT_MEETING_MINUTES),
    _token: str = Depends(require_token),
):
    if not api_key.startswith("sk-ant-"):
        raise HTTPException(status_code=400, detail="API key must start with sk-ant-.")
    if not deck.filename or not deck.filename.lower().endswith(".pptx"):
        raise HTTPException(status_code=400, detail="Upload must be a .pptx file.")

    data = await deck.read()
    tmp = tempfile.NamedTemporaryFile(suffix=".pptx", delete=False)
    tmp.write(data)
    tmp.close()
    tmp_path = tmp.name

    job_id = uuid.uuid4().hex[:12]
    cancel_event = threading.Event()
    out_q: "queue.Queue[dict]" = queue.Queue()
    _JOBS[job_id] = {"cancel": cancel_event, "queue": out_q}

    thread = threading.Thread(
        target=_run_audit_worker,
        args=(tmp_path, api_key, int(meeting_minutes), job_id, cancel_event, out_q),
        daemon=True,
    )
    thread.start()

    async def event_generator():
        loop = asyncio.get_running_loop()
        try:
            while True:
                item = await loop.run_in_executor(None, out_q.get)
                if item is None:
                    break
                yield {
                    "event": item["event"],
                    "data": json.dumps(item["data"]),
                }
        finally:
            _JOBS.pop(job_id, None)

    return EventSourceResponse(event_generator())


@router.post("/cancel/{job_id}", status_code=204)
def cancel(job_id: str, _token: str = Depends(require_token)):
    j = _JOBS.get(job_id)
    if j:
        j["cancel"].set()
    return None
