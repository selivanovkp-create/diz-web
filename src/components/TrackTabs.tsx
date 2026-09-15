"use client";

import { ConfirmDialog } from "@/components/ConfirmDialog";
import { cn } from "@/lib/utils";
import Link from "next/link";
import type { FocusTrack } from "@/lib/types";
import { useState } from "react";

export function TrackTabs({
  tracks,
  activeTrackId,
  onSelect,
  onDelete,
  addHref = "/onboarding?new=1",
}: {
  tracks: FocusTrack[];
  activeTrackId: string | null;
  onSelect: (id: string) => void;
  onDelete?: (id: string) => void;
  addHref?: string;
}) {
  const [pendingDelete, setPendingDelete] = useState<FocusTrack | null>(null);
  const active = tracks.find((t) => t.id === activeTrackId) ?? null;

  if (tracks.length === 0) return null;

  return (
    <>
      <div className="rise mb-5">
        <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {tracks.map((t) => {
            const isActive = t.id === activeTrackId;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => onSelect(t.id)}
                className={cn(
                  "shrink-0 rounded-full border px-4 py-2 text-[14px] font-medium transition",
                  isActive
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

        {active && onDelete ? (
          <button
            type="button"
            onClick={() => setPendingDelete(active)}
            className="mt-2 text-[13px] text-muted underline-offset-2 hover:text-danger hover:underline"
          >
            Удалить тему «{active.label}»
          </button>
        ) : null}
      </div>

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title={`Удалить «${pendingDelete?.label ?? "тему"}»?`}
        body={
          tracks.length <= 1
            ? "Это последняя тема. Пропадут её план и прогресс. Можно будет пройти онбординг заново."
            : "План и прогресс по этой теме удалятся. Остальные темы останутся."
        }
        confirmLabel="Удалить"
        cancelLabel="Оставить"
        onCancel={() => setPendingDelete(null)}
        onConfirm={() => {
          if (pendingDelete && onDelete) onDelete(pendingDelete.id);
          setPendingDelete(null);
        }}
      />
    </>
  );
}
