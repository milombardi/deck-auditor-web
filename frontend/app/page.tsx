"use client";

import { useEffect, useRef, useState } from "react";
import PasswordGate from "@/components/PasswordGate";
import AuditConfig from "@/components/AuditConfig";
import AuditLoading from "@/components/AuditLoading";
import AuditResults from "@/components/AuditResults";
import {
  AuditResult,
  cancelJob,
  estimateDeck,
  runAudit,
} from "@/lib/api";
import { clearToken, loadToken } from "@/lib/session";

type Phase = "config" | "loading" | "result";

export default function Home() {
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    if (loadToken()) setAuthed(true);
  }, []);

  if (!authed) return <PasswordGate onAuth={() => setAuthed(true)} />;

  return <Workspace onSignOut={() => { clearToken(); setAuthed(false); }} />;
}

function Workspace({ onSignOut }: { onSignOut: () => void }) {
  const [apiKey, setApiKey] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [meetingMinutes, setMeetingMinutes] = useState(30);
  const [maxCost, setMaxCost] = useState(3.0);

  const [phase, setPhase] = useState<Phase>("config");
  const [slideCount, setSlideCount] = useState(0);
  const [stage, setStage] = useState("extract");
  const [current, setCurrent] = useState(0);
  const [total, setTotal] = useState(0);
  const [etaSec, setEtaSec] = useState(0);
  const [result, setResult] = useState<AuditResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [costPrompt, setCostPrompt] =
    useState<{ slides: number; cost: number } | null>(null);

  const abortRef = useRef<AbortController | null>(null);
  const jobIdRef = useRef<string | null>(null);
  const etaTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  function resetToConfig() {
    setPhase("config");
    setResult(null);
    setError(null);
    setStage("extract");
    setCurrent(0);
    setTotal(0);
    jobIdRef.current = null;
    abortRef.current = null;
    if (etaTimerRef.current) clearInterval(etaTimerRef.current);
  }

  async function handleRun() {
    if (!file) return;
    setError(null);
    const token = loadToken();
    if (!token) {
      onSignOut();
      return;
    }
    // Estimate first.
    let est;
    try {
      est = await estimateDeck(token, file);
    } catch (e: any) {
      setError(e?.message || "Failed to estimate.");
      return;
    }
    if (est.estimated_cost > maxCost && !costPrompt) {
      setCostPrompt({ slides: est.slide_count, cost: est.estimated_cost });
      return;
    }
    setCostPrompt(null);
    startAudit(token, est.slide_count);
  }

  function startAudit(token: string, slides: number) {
    setSlideCount(slides);
    setPhase("loading");
    setStage("extract");
    setCurrent(0);
    setTotal(slides);
    const initialEta = Math.max(15, slides * 4);
    setEtaSec(initialEta);

    if (etaTimerRef.current) clearInterval(etaTimerRef.current);
    etaTimerRef.current = setInterval(() => {
      setEtaSec((s) => Math.max(0, s - 1));
    }, 1000);

    runAudit(token, file!, apiKey, meetingMinutes, {
      onJob: (id) => {
        jobIdRef.current = id;
      },
      onProgress: (ev) => {
        setStage(ev.stage);
        setCurrent(ev.current);
        setTotal(ev.total);
      },
      onResult: (r) => {
        if (etaTimerRef.current) clearInterval(etaTimerRef.current);
        setResult(r);
        setPhase("result");
      },
      onError: (m) => {
        if (etaTimerRef.current) clearInterval(etaTimerRef.current);
        setError(m);
        setPhase("config");
      },
      onCancelled: () => {
        if (etaTimerRef.current) clearInterval(etaTimerRef.current);
        setPhase("config");
      },
    }).then((ctrl) => {
      abortRef.current = ctrl;
    });
  }

  async function handleCancel() {
    const token = loadToken();
    if (token && jobIdRef.current) {
      try {
        await cancelJob(token, jobIdRef.current);
      } catch {
        // ignore
      }
    }
    abortRef.current?.abort();
    if (etaTimerRef.current) clearInterval(etaTimerRef.current);
    setPhase("config");
  }

  return (
    <div className="min-h-screen px-4 sm:px-6 py-10 sm:py-16">
      <header className="max-w-3xl mx-auto mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-ink-high tracking-tight">
            Deck Auditor
          </h1>
          <p className="text-ink-low mt-2 max-w-xl">
            Audits PowerPoint decks for narrative quality, AI voice, density,
            and clarity.
          </p>
        </div>
        <button
          onClick={onSignOut}
          className="text-ink-low hover:text-ink-mid text-sm"
        >
          Sign out
        </button>
      </header>

      <main className="max-w-3xl mx-auto">
        {error && (
          <div className="card p-4 mb-4 border border-band-rebuild/40 text-band-rebuild bg-band-rebuild/10">
            {error}
          </div>
        )}

        {costPrompt && phase === "config" && (
          <div className="card p-5 mb-4 border border-band-needsWork/40 bg-band-needsWork/10 flex flex-col gap-3">
            <p className="text-ink-high">
              Estimated cost is{" "}
              <strong>${costPrompt.cost.toFixed(2)}</strong>, above your cap of{" "}
              <strong>${maxCost.toFixed(2)}</strong>. Proceed anyway?
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  const token = loadToken();
                  if (token) {
                    setCostPrompt(null);
                    startAudit(token, costPrompt.slides);
                  }
                }}
                className="btn-gradient px-5 py-2"
              >
                Run anyway
              </button>
              <button
                onClick={() => setCostPrompt(null)}
                className="btn-secondary px-5 py-2"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {phase === "config" && (
          <AuditConfig
            apiKey={apiKey}
            setApiKey={setApiKey}
            file={file}
            setFile={setFile}
            meetingMinutes={meetingMinutes}
            setMeetingMinutes={setMeetingMinutes}
            maxCost={maxCost}
            setMaxCost={setMaxCost}
            onRun={handleRun}
            busy={false}
          />
        )}

        {phase === "loading" && (
          <AuditLoading
            slideCount={slideCount}
            stage={stage}
            current={current}
            total={total}
            etaSec={etaSec}
            onCancel={handleCancel}
          />
        )}

        {phase === "result" && result && (
          <AuditResults
            result={result}
            deckName={file?.name || "deck.pptx"}
            onReset={resetToConfig}
          />
        )}
      </main>
    </div>
  );
}
