"use client";

import {
  Feather,
  Lightbulb,
  AudioWaveform,
  Coins,
  Layers,
  Download,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import { AuditResult } from "@/lib/api";
import ScoreGauge from "./ScoreGauge";
import SubScoreCard from "./SubScoreCard";
import FindingsSection from "./FindingsSection";

type Props = {
  result: AuditResult;
  deckName: string;
  onReset: () => void;
};

export default function AuditResults({ result, deckName, onReset }: Props) {
  const { scores, sections, report_md, cost_summary, elapsed } = result;

  const download = () => {
    const blob = new Blob([report_md], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const base = deckName.replace(/\.pptx$/i, "");
    a.download = `${base}-audit.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      {/* Score gauge */}
      <div className="card p-10 flex flex-col items-center text-center gap-2 relative">
        <ScoreGauge score={scores.total} band={scores.band} size={260} />
        <p className="text-ink-low text-sm">
          {result.slide_count} slides analyzed · {elapsed.toFixed(1)}s
        </p>
        <Sparkles
          size={20}
          className="absolute bottom-4 right-4 text-accent-purple/40"
        />
      </div>

      {/* Sub-scores */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <SubScoreCard
          label="Narrative"
          score={scores.narrative}
          icon={Feather}
          band={scores.band}
        />
        <SubScoreCard
          label="Takeaway"
          score={scores.takeaway}
          icon={Lightbulb}
          band={scores.band}
        />
        <SubScoreCard
          label="Voice"
          score={scores.voice}
          icon={AudioWaveform}
          band={scores.band}
        />
        <SubScoreCard
          label="Density"
          score={scores.density}
          icon={Coins}
          band={scores.band}
        />
        <SubScoreCard
          label="Redundancy"
          score={scores.redundancy}
          icon={Layers}
          band={scores.band}
        />
      </div>

      {/* Sections */}
      <div className="flex flex-col gap-3">
        <FindingsSection
          title="Top 5 Fixes"
          markdown={sections["Top 5 fixes"] || "_No findings._"}
          defaultOpen
        />
        <FindingsSection
          title="Deck-Level Findings"
          markdown={sections["Deck-level findings"] || "_No findings._"}
        />
        <FindingsSection
          title="Slide-by-Slide Detail"
          markdown={sections["Slide-by-slide"] || "_No findings._"}
        />
      </div>

      {/* Actions + cost */}
      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={download}
          className="btn-gradient py-3 px-5 flex items-center justify-center gap-2 flex-1"
        >
          <Download size={18} />
          Download full markdown report
        </button>
        <button
          onClick={onReset}
          className="btn-secondary py-3 px-5 flex items-center justify-center gap-2"
        >
          <RotateCcw size={16} />
          Run another
        </button>
      </div>
      <p className="text-ink-muted text-xs text-center">
        Run cost: {cost_summary}
      </p>
    </div>
  );
}
