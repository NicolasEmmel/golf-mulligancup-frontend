"use client";

import { useCallback, useRef, useState } from "react";
import {
  CLUB_WHEEL_SEGMENT_COUNT,
  clubNumberFromRotation,
  pickRandomClubNumber,
  rotationForClubNumber,
} from "@/lib/clubRandomizer";

const SLICE = 360 / CLUB_WHEEL_SEGMENT_COUNT;
const WHEEL_COLORS = [
  "#2e7d32",
  "#388e3c",
  "#43a047",
  "#4caf50",
  "#66bb6a",
  "#81c784",
  "#2e7d32",
  "#388e3c",
  "#43a047",
  "#4caf50",
  "#66bb6a",
  "#81c784",
  "#1b5e20",
  "#33691e",
];

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function segmentPath(cx: number, cy: number, r: number, index: number): string {
  const start = index * SLICE;
  const end = (index + 1) * SLICE;
  const startPt = polarToCartesian(cx, cy, r, start);
  const endPt = polarToCartesian(cx, cy, r, end);
  return `M ${cx} ${cy} L ${startPt.x} ${startPt.y} A ${r} ${r} 0 0 1 ${endPt.x} ${endPt.y} Z`;
}

type Props = {
  onResult?: (clubNumber: number) => void;
};

export function ClubRandomizerWheel({ onResult }: Props) {
  const [rotation, setRotation] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState<number | null>(null);
  const pendingTarget = useRef<number | null>(null);

  const handleSpin = useCallback(() => {
    if (spinning) return;
    const target = pickRandomClubNumber();
    pendingTarget.current = target;
    setSpinning(true);
    setResult(null);
    setRotation((current) => rotationForClubNumber(current, target));
  }, [spinning]);

  const handleTransitionEnd = () => {
    if (!spinning) return;
    setSpinning(false);
    const club =
      pendingTarget.current ?? clubNumberFromRotation(rotation);
    pendingTarget.current = null;
    setResult(club);
    onResult?.(club);
  };

  const size = 280;
  const cx = size / 2;
  const cy = size / 2;
  const radius = size / 2 - 4;

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size + 16 }}>
        <div
          className="absolute left-1/2 top-0 z-10 -translate-x-1/2"
          aria-hidden
        >
          <div className="h-0 w-0 border-x-[12px] border-b-[20px] border-x-transparent border-b-primary drop-shadow-sm" />
        </div>
        <div
          className="absolute left-0 top-4 will-change-transform"
          style={{
            width: size,
            height: size,
            transform: `rotate(${rotation}deg)`,
            transition: spinning
              ? "transform 4.2s cubic-bezier(0.15, 0.85, 0.15, 1)"
              : "none",
          }}
          onTransitionEnd={handleTransitionEnd}
        >
          <svg
            width={size}
            height={size}
            viewBox={`0 0 ${size} ${size}`}
            className="drop-shadow-[var(--shadow-soft)]"
            role="img"
            aria-label="Schläger-Rad mit Nummern 1 bis 14"
          >
            {Array.from({ length: CLUB_WHEEL_SEGMENT_COUNT }, (_, index) => {
              const midAngle = index * SLICE + SLICE / 2;
              const label = polarToCartesian(cx, cy, radius * 0.62, midAngle);
              return (
                <g key={index}>
                  <path
                    d={segmentPath(cx, cy, radius, index)}
                    fill={WHEEL_COLORS[index % WHEEL_COLORS.length]}
                    stroke="#ffffff"
                    strokeWidth={1.5}
                  />
                  <text
                    x={label.x}
                    y={label.y}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill="#ffffff"
                    fontSize={16}
                    fontWeight={800}
                    transform={`rotate(${midAngle}, ${label.x}, ${label.y})`}
                  >
                    {index + 1}
                  </text>
                </g>
              );
            })}
            <circle
              cx={cx}
              cy={cy}
              r={radius * 0.18}
              fill="var(--surface)"
              stroke="var(--primary)"
              strokeWidth={3}
            />
          </svg>
        </div>
      </div>

      {result != null && !spinning && (
        <p className="mt-6 text-center">
          <span className="text-sm font-semibold text-muted">Verlorener Schläger</span>
          <span className="mt-1 block text-5xl font-black tabular-nums text-primary">
            {result}
          </span>
        </p>
      )}

      <button
        type="button"
        onClick={handleSpin}
        disabled={spinning}
        className="mt-8 rounded-2xl bg-primary px-10 py-3 text-sm font-bold uppercase tracking-wide text-primary-foreground shadow-[var(--shadow-soft)] transition hover:opacity-95 disabled:opacity-50"
      >
        {spinning ? "Dreht…" : "Rad drehen"}
      </button>
    </div>
  );
}
