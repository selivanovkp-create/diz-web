"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import type { FocusTrack } from "@/lib/types";

export function TrackTabs({
  tracks,
  activeTrackId,
  onSelect,
  addHref = "/onboarding?new=1",
}: {
  tracks: FocusTrack[];
  activeTrackId: string | null;
  onSelect: (id: string) => void;
  addHref?: string;
}) {
  if (tracks.length === 0) return null;

  return (
    <div className="rise -mx-1 mb-6 flex gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {tracks.map((t) => {
        const active = t.id === activeTrackId;
        return (
          <button
            key={t.id}
            type="button"
            onClick={() => onSelect(t.id)}
            className={cn(
              "shrink-0 rounded-full border px-4 py-2 text-[14px] font-medium transition",
              active
                ? "border-ink bg-ink text-white"
                : "border-line bg-bg-elevated text-ink-soft",
            )}
          >
            {t.label}
          </button>
        );
      })}
      <Link
        href={addHref}
        className="shrink-0 rounded-full border border-dashed border-line bg-bg-elevated px-4 py-2 text-[14px] font-medium text-muted"
      >
        + Тема
      </Link>
    </div>
  );
}
