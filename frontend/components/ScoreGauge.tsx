"use client";

import { useEffect, useState } from "react";
import { ScoreBand } from "@/lib/api";
import { bandColor } from "./BandPill";

type Props = {
  score: number; // 0..100
  band: ScoreBand;
  size?: number; // px
  strokeWidth?: number;
};

/**
 * SVG arc gauge. Background arc is a faint full track; foreground arc is
 * a band-colored stroke whose dasharray animates from 0 to score/100.
 */
export default function ScoreGauge({
  score,
  band,
  size = 260,
  strokeWidth = 14,
}: Props) {
  const color = bandColor(band);
  const cx = size / 2;
  const cy = size / 2;
  const r = (size - strokeWidth) / 2;
  // 240-degree arc (from 150° to 30° going clockwise via the bottom-right).
  // Convert to SVG path.
  const startAngle = 150;
  const endAngle = 30 + 360; // sweep clockwise back around to 30 (i.e. 240° arc)
  const sweep = endAngle - startAngle; // 240

  const polarToCartesian = (cxv: number, cyv: number, rv: number, deg: number) => {
    const rad = ((deg - 90) * Math.PI) / 180;
    return { x: cxv + rv * Math.cos(rad), y: cyv + rv * Math.sin(rad) };
  };

  const start = polarToCartesian(cx, cy, r, endAngle);
  const end = polarToCartesian(cx, cy, r, startAngle);
  const largeArc = sweep > 180 ? 1 : 0;

  // Use stroke-dasharray to animate. Compute path length analytically:
  const pathLen = (Math.PI * 2 * r * sweep) / 360;
  const filled = Math.max(0, Math.min(1, score / 100)) * pathLen;

  const [animated, setAnimated] = useState(0);
  useEffect(() => {
    const id = requestAnimationFrame(() => setAnimated(filled));
    return () => cancelAnimationFrame(id);
  }, [filled]);

  const d = [
    `M ${start.x} ${start.y}`,
    `A ${r} ${r} 0 ${largeArc} 0 ${end.x} ${end.y}`,
  ].join(" ");

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* Track */}
        <path
          d={d}
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />
        {/* Filled */}
        <path
          d={d}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={`${pathLen} ${pathLen}`}
          strokeDashoffset={pathLen - animated}
          style={{ transition: "stroke-dashoffset 900ms cubic-bezier(0.16, 1, 0.3, 1)" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="text-6xl font-extrabold tracking-tight" style={{ color }}>
          {score}
          <span className="text-2xl text-ink-low font-bold">/100</span>
        </div>
        <div
          className="text-sm font-bold uppercase tracking-[0.18em] mt-1"
          style={{ color }}
        >
          {band}
        </div>
      </div>
    </div>
  );
}
