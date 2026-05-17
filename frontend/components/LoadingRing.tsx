"use client";

import { FileText } from "lucide-react";
import { useMemo } from "react";

type Props = {
  size?: number;
  papers?: number;
};

export default function LoadingRing({ size = 200, papers = 12 }: Props) {
  const items = useMemo(() => Array.from({ length: papers }), [papers]);
  const radius = size / 2 - 22;
  return (
    <div
      className="relative animate-spin-slow"
      style={{ width: size, height: size }}
    >
      {items.map((_, i) => {
        const angle = (i / papers) * 2 * Math.PI;
        const x = size / 2 + radius * Math.cos(angle) - 12;
        const y = size / 2 + radius * Math.sin(angle) - 12;
        // Fade earlier dots to suggest motion blur.
        const opacity = 0.35 + ((i % papers) / papers) * 0.55;
        return (
          <div
            key={i}
            className="absolute"
            style={{
              left: x,
              top: y,
              width: 24,
              height: 24,
              opacity,
              color: "#f59e0b",
              transform: `rotate(${(angle * 180) / Math.PI + 90}deg)`,
            }}
          >
            <FileText size={24} strokeWidth={1.6} />
          </div>
        );
      })}
    </div>
  );
}
