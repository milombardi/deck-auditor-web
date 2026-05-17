import { ScoreBand } from "@/lib/api";

const COLORS: Record<ScoreBand, string> = {
  ready: "text-band-ready bg-band-ready/10 border-band-ready/30",
  close: "text-band-close bg-band-close/10 border-band-close/30",
  "needs work": "text-band-needsWork bg-band-needsWork/10 border-band-needsWork/30",
  rebuild: "text-band-rebuild bg-band-rebuild/10 border-band-rebuild/30",
};

export function bandColor(band: ScoreBand): string {
  return {
    ready: "#16a34a",
    close: "#3b82f6",
    "needs work": "#f59e0b",
    rebuild: "#ef4444",
  }[band];
}

export default function BandPill({ band }: { band: ScoreBand }) {
  return (
    <span
      className={`inline-flex items-center px-3 py-1 rounded-full border text-xs font-bold uppercase tracking-wider ${COLORS[band]}`}
    >
      {band}
    </span>
  );
}
