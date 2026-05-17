"use client";

import { useState } from "react";
import { Eye, EyeOff, HelpCircle, Plus, Minus, Sparkles } from "lucide-react";
import DeckUploader from "./DeckUploader";

type Props = {
  apiKey: string;
  setApiKey: (v: string) => void;
  file: File | null;
  setFile: (f: File | null) => void;
  meetingMinutes: number;
  setMeetingMinutes: (n: number) => void;
  maxCost: number;
  setMaxCost: (n: number) => void;
  onRun: () => void;
  busy: boolean;
};

export default function AuditConfig({
  apiKey,
  setApiKey,
  file,
  setFile,
  meetingMinutes,
  setMeetingMinutes,
  maxCost,
  setMaxCost,
  onRun,
  busy,
}: Props) {
  const [showKey, setShowKey] = useState(false);
  const keyValid = apiKey.startsWith("sk-ant-");
  const ready = keyValid && !!file && !busy;

  return (
    <div className="card p-8 flex flex-col gap-8 animate-fade-in">
      {/* Integrations */}
      <section>
        <h2 className="section-title text-2xl mb-1">Integrations</h2>
        <div className="flex items-center justify-between mb-3 mt-4">
          <label className="text-ink-mid font-medium text-sm">
            Your Anthropic API key (required)
          </label>
          <a
            href="https://console.anthropic.com/settings/keys"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1 text-xs text-ink-low hover:text-ink-mid"
          >
            <HelpCircle size={14} />
            Where is my key?
          </a>
        </div>
        <div className="relative">
          <input
            type={showKey ? "text" : "password"}
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="sk-ant-..."
            className="input-base w-full px-4 py-3 pr-12 font-mono text-sm"
          />
          <button
            type="button"
            onClick={() => setShowKey((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-low hover:text-ink-mid"
            tabIndex={-1}
          >
            {showKey ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
        {apiKey && !keyValid && (
          <p className="text-band-rebuild text-xs mt-2">
            That doesn't look like an Anthropic key. It should start with{" "}
            <code className="font-mono">sk-ant-</code>.
          </p>
        )}
      </section>

      <div className="h-px bg-border" />

      {/* Deck */}
      <section>
        <h2 className="section-title text-2xl mb-4">Deck</h2>
        <DeckUploader file={file} onFile={setFile} />
      </section>

      <div className="h-px bg-border" />

      {/* Settings */}
      <section>
        <h2 className="section-title text-2xl mb-4">Audit Settings</h2>
        <div className="grid grid-cols-2 gap-4">
          <NumberField
            label="Meeting length (minutes)"
            value={meetingMinutes}
            min={1}
            max={600}
            step={5}
            onChange={setMeetingMinutes}
          />
          <NumberField
            label="Max cost ($)"
            value={maxCost}
            min={0.1}
            max={100}
            step={0.5}
            isFloat
            onChange={setMaxCost}
          />
        </div>
      </section>

      <button
        disabled={!ready}
        onClick={onRun}
        className="btn-gradient w-full py-4 text-base flex items-center justify-center gap-2"
      >
        <Sparkles size={18} />
        Run Audit
      </button>
    </div>
  );
}

function NumberField({
  label,
  value,
  min,
  max,
  step,
  isFloat,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  isFloat?: boolean;
  onChange: (n: number) => void;
}) {
  const clamp = (n: number) => Math.max(min, Math.min(max, n));
  const fmt = (n: number) => (isFloat ? n.toFixed(2) : String(Math.round(n)));
  return (
    <div>
      <label className="field-label">{label}</label>
      <div className="flex items-center gap-1 bg-surfaceAlt border border-border rounded-xl px-2 py-2">
        <input
          type="text"
          inputMode={isFloat ? "decimal" : "numeric"}
          value={fmt(value)}
          onChange={(e) => {
            const n = parseFloat(e.target.value);
            if (!isNaN(n)) onChange(clamp(n));
          }}
          className="flex-1 bg-transparent text-ink-high text-lg font-semibold px-2 outline-none w-0"
        />
        <button
          onClick={() => onChange(clamp(value - step))}
          className="w-8 h-8 rounded-lg hover:bg-border flex items-center justify-center text-ink-mid"
          aria-label="Decrease"
        >
          <Minus size={16} />
        </button>
        <button
          onClick={() => onChange(clamp(value + step))}
          className="w-8 h-8 rounded-lg hover:bg-border flex items-center justify-center text-ink-mid"
          aria-label="Increase"
        >
          <Plus size={16} />
        </button>
      </div>
    </div>
  );
}
