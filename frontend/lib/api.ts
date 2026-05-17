// Thin client for the FastAPI backend. SSE consumer for the audit endpoint.

export const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

export type EstimateResponse = {
  slide_count: number;
  word_count: number;
  estimated_cost: number;
};

export type ScoreBand = "ready" | "close" | "needs work" | "rebuild";

export type Scores = {
  total: number;
  band: ScoreBand;
  narrative: number;
  takeaway: number;
  voice: number;
  density: number;
  redundancy: number;
};

export type AuditResult = {
  scores: Scores;
  sections: Record<string, string>;
  report_md: string;
  cost_summary: string;
  cost: number;
  elapsed: number;
  slide_count: number;
};

export type ProgressEvent = {
  stage: string;
  current: number;
  total: number;
};

export async function authenticate(password: string): Promise<string> {
  const r = await fetch(`${API_BASE}/api/auth`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ password }),
  });
  if (!r.ok) {
    const j = await r.json().catch(() => ({}));
    throw new Error(j.detail || `Auth failed (${r.status}).`);
  }
  const j = await r.json();
  return j.token as string;
}

export async function estimateDeck(
  token: string,
  deck: File
): Promise<EstimateResponse> {
  const fd = new FormData();
  fd.append("deck", deck);
  const r = await fetch(`${API_BASE}/api/estimate`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: fd,
  });
  if (!r.ok) {
    const j = await r.json().catch(() => ({}));
    throw new Error(j.detail || `Estimate failed (${r.status}).`);
  }
  return r.json();
}

export async function cancelJob(token: string, jobId: string): Promise<void> {
  await fetch(`${API_BASE}/api/cancel/${jobId}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
}

export type AuditCallbacks = {
  onJob: (jobId: string) => void;
  onProgress: (ev: ProgressEvent) => void;
  onResult: (r: AuditResult) => void;
  onError: (msg: string) => void;
  onCancelled: () => void;
};

/**
 * POST the deck and stream SSE events. The Fetch API doesn't natively give us
 * EventSource-style parsing, so we hand-parse the text/event-stream body line
 * by line. Returns an AbortController so the caller can cancel the connection.
 */
export async function runAudit(
  token: string,
  deck: File,
  apiKey: string,
  meetingMinutes: number,
  cbs: AuditCallbacks
): Promise<AbortController> {
  const fd = new FormData();
  fd.append("deck", deck);
  fd.append("api_key", apiKey);
  fd.append("meeting_minutes", String(meetingMinutes));

  const ctrl = new AbortController();
  fetch(`${API_BASE}/api/audit`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: fd,
    signal: ctrl.signal,
  })
    .then(async (r) => {
      if (!r.ok) {
        const j = await r.json().catch(() => ({}));
        cbs.onError(j.detail || `Audit failed (${r.status}).`);
        return;
      }
      if (!r.body) {
        cbs.onError("No response body.");
        return;
      }
      const reader = r.body.getReader();
      const dec = new TextDecoder();
      let buf = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buf += dec.decode(value, { stream: true });

        // SSE events are separated by a blank line.
        let idx: number;
        while ((idx = buf.indexOf("\n\n")) !== -1) {
          const chunk = buf.slice(0, idx);
          buf = buf.slice(idx + 2);
          parseEvent(chunk, cbs);
        }
      }
    })
    .catch((e) => {
      if (e?.name === "AbortError") return;
      cbs.onError(String(e?.message || e));
    });

  return ctrl;
}

function parseEvent(chunk: string, cbs: AuditCallbacks) {
  let event = "message";
  let dataLines: string[] = [];
  // Normalize CRLF -> LF so we handle either separator style.
  for (const rawLine of chunk.split(/\r?\n/)) {
    const line = rawLine.replace(/\r$/, "");
    if (!line) continue;
    if (line.startsWith(":")) continue; // SSE comment / keep-alive ping
    if (line.startsWith("event:")) event = line.slice(6).trim();
    else if (line.startsWith("data:")) dataLines.push(line.slice(5).trim());
  }
  if (dataLines.length === 0) return;
  const raw = dataLines.join("\n");
  let data: any;
  try {
    data = JSON.parse(raw);
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn("[sse] failed to parse data", { event, raw, error: e });
    return;
  }
  // eslint-disable-next-line no-console
  console.log("[sse]", event, data);
  switch (event) {
    case "job":
      cbs.onJob(data.job_id);
      break;
    case "progress":
      cbs.onProgress(data);
      break;
    case "result":
      cbs.onResult(data);
      break;
    case "error":
      cbs.onError(data.message || "Unknown error");
      break;
    case "cancelled":
      cbs.onCancelled();
      break;
  }
}
