"use client";

import { useState } from "react";
import { Eye, EyeOff, SearchCheck } from "lucide-react";
import { authenticate } from "@/lib/api";
import { saveToken } from "@/lib/session";

export default function PasswordGate({ onAuth }: { onAuth: () => void }) {
  const [pw, setPw] = useState("");
  const [show, setShow] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e?: React.FormEvent) {
    e?.preventDefault();
    if (!pw || busy) return;
    setBusy(true);
    setErr(null);
    try {
      const token = await authenticate(pw);
      saveToken(token);
      onAuth();
    } catch (e: any) {
      setErr(e?.message || "Sign in failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-md card p-10 flex flex-col items-center text-center">
        <div className="w-20 h-20 rounded-2xl bg-primary-gradient flex items-center justify-center mb-6 shadow-glow">
          <SearchCheck size={40} className="text-white" strokeWidth={2} />
        </div>
        <h1 className="text-4xl font-extrabold text-ink-high tracking-tight mb-3">
          Deck Auditor
        </h1>
        <p className="text-ink-low mb-8 leading-relaxed">
          Audits PowerPoint decks for narrative quality, AI voice, density,
          and clarity.
        </p>
        <form onSubmit={submit} className="w-full flex flex-col gap-4">
          <div>
            <label className="field-label text-left">Password</label>
            <div className="relative">
              <input
                type={show ? "text" : "password"}
                value={pw}
                onChange={(e) => setPw(e.target.value)}
                disabled={busy}
                autoFocus
                className="input-base w-full px-4 py-3 pr-12"
              />
              <button
                type="button"
                onClick={() => setShow((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-low hover:text-ink-mid"
                tabIndex={-1}
              >
                {show ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>
          {err && (
            <div className="text-band-rebuild text-sm bg-band-rebuild/10 border border-band-rebuild/30 rounded-lg px-3 py-2">
              {err}
            </div>
          )}
          <button
            type="submit"
            disabled={!pw || busy}
            className="btn-gradient w-full py-3 text-base"
          >
            {busy ? "Signing in…" : "Sign in"}
          </button>
          <a
            href="https://console.anthropic.com/settings/keys"
            target="_blank"
            rel="noreferrer"
            className="text-ink-low text-sm hover:text-ink-mid underline mt-2"
          >
            Get an Anthropic API key
          </a>
        </form>
      </div>
    </div>
  );
}
