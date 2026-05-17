"use client";

import { X } from "lucide-react";
import LoadingRing from "./LoadingRing";

const STAGE_LABEL: Record<string, string> = {
  extract: "Reading slides",
  voice: "Scanning for AI voice",
  density: "Checking density",
  headlines: "Judging headlines",
  takeaway: "Finding takeaways",
  redundancy: "Spotting redundancy",
};

type Props = {
  slideCount: number;
  stage: string;
  current: number;
  total: number;
  etaSec: number;
  onCancel: () => void;
};

export default function AuditLoading({
  slideCount,
  stage,
  current,
  total,
  etaSec,
  onCancel,
}: Props) {
  const stageLabel = STAGE_LABEL[stage] || "Analyzing";
  const pct = total > 0 ? Math.round((current / total) * 100) : 0;
  return (
    <div className="card p-10 flex flex-col items-center text-center animate-fade-in gap-6">
      <LoadingRing size={200} />
      <div>
        <div className="text-2xl font-bold text-ink-high tracking-tight">
          Analyzing {slideCount} slides…
        </div>
        <div className="text-ink-low mt-2">
          {stageLabel}
          {total > 0 && stage !== "extract" && (
            <>
              {" "}
              <span className="text-ink-muted">·</span>{" "}
              <span className="text-ink-mid">
                {current}/{total} ({pct}%)
              </span>
            </>
          )}
        </div>
        <div className="text-ink-muted text-sm mt-1">
          Estimated time: {Math.max(0, Math.round(etaSec))} s
        </div>
      </div>
      <button
        onClick={onCancel}
        className="btn-secondary px-5 py-2.5 flex items-center gap-2"
      >
        <X size={16} />
        Cancel Audit
      </button>
    </div>
  );
}
