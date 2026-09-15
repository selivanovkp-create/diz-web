"use client";

import { cn } from "@/lib/utils";

export function ProgressRing({
  value,
  size = 112,
  stroke = 8,
  label,
  caption,
  className,
}: {
  value: number;
  size?: number;
  stroke?: number;
  label: string;
  caption?: string;
  className?: string;
}) {
  const pct = Math.max(0, Math.min(100, Math.round(value)));
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (pct / 100) * c;

  return (
    <div className={cn("flex flex-col items-center text-center", className)}>
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90" aria-hidden>
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke="var(--line)"
            strokeWidth={stroke}
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke="var(--accent)"
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={c}
            strokeDashoffset={offset}
            className="transition-[stroke-dashoffset] duration-700 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-display text-[1.65rem] leading-none tabular-nums tracking-tight">
            {pct}
            <span className="text-base text-muted">%</span>
          </span>
        </div>
      </div>
      <p className="mt-3 text-[15px] font-medium text-ink">{label}</p>
      {caption ? (
        <p className="mt-1 max-w-[14ch] text-xs leading-snug text-muted">{caption}</p>
      ) : null}
    </div>
  );
}
