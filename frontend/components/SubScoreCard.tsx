import { LucideIcon } from "lucide-react";
import { ScoreBand } from "@/lib/api";
import { bandColor } from "./BandPill";

type Props = {
  label: string;
  score: number; // 0..20
  max?: number;
  icon: LucideIcon;
  band: ScoreBand;
};

function bandFromScore(s: number, max: number): ScoreBand {
  const pct = (s / max) * 100;
  if (pct >= 90) return "ready";
  if (pct >= 70) return "close";
  if (pct >= 50) return "needs work";
  return "rebuild";
}

export default function SubScoreCard({
  label,
  score,
  max = 20,
  icon: Icon,
  band,
}: Props) {
  const localBand = bandFromScore(score, max);
  const color = bandColor(localBand);
  const pct = Math.max(0, Math.min(100, (score / max) * 100));
  return (
    <div className="card p-5 flex flex-col gap-3 animate-fade-in">
      <div className="flex items-start justify-between">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ backgroundColor: `${color}20`, color }}
        >
          <Icon size={20} strokeWidth={2.2} />
        </div>
      </div>
      <div>
        <div className="text-xs uppercase tracking-wider text-ink-low font-semibold">
          {label}
        </div>
        <div className="text-3xl font-bold text-ink-high mt-1">
          {score}
          <span className="text-base text-ink-low font-semibold">/{max}</span>
        </div>
      </div>
      <div className="h-1.5 bg-surfaceAlt rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}
