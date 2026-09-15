"use client";

import { Button, Screen, SectionTitle } from "@/components/ui";
import { useFormaStore } from "@/lib/store";
import { pct } from "@/lib/utils";
import { useEffect } from "react";

export default function WeeklyPage() {
  const weeklyReviews = useFormaStore((s) => s.weeklyReviews);
  const generateWeeklyReview = useFormaStore((s) => s.generateWeeklyReview);
  const review = weeklyReviews[weeklyReviews.length - 1];

  useEffect(() => {
    if (!review) void generateWeeklyReview();
  }, [review, generateWeeklyReview]);

  return (
    <Screen>
      <SectionTitle eyebrow="Weekly" title="Your week" subtitle="Короткий отчёт. Без театра." />

      {!review ? (
        <div className="card p-4 text-sm text-muted">Собираю неделю…</div>
      ) : (
        <>
          <div className="card rise mb-4 grid grid-cols-3 gap-3 p-4 text-center">
            <div>
              <p className="font-display text-3xl">{review.days}</p>
              <p className="text-[11px] text-muted">days</p>
            </div>
            <div>
              <p className="font-display text-3xl">{review.tasksTotal}</p>
              <p className="text-[11px] text-muted">tasks</p>
            </div>
            <div>
              <p className="font-display text-3xl">{review.tasksCompleted}</p>
              <p className="text-[11px] text-muted">done</p>
            </div>
          </div>

          <div className="card rise rise-delay-1 mb-4 p-4">
            <p className="text-sm text-muted">Completion</p>
            <p className="font-display text-4xl">{pct(review.completionRate * 100)}</p>
          </div>

          <div className="grid grid-cols-1 gap-3">
            <div className="card p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">
                Biggest win
              </p>
              <p className="mt-1 font-semibold">{review.biggestWin}</p>
            </div>
            <div className="card p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">
                Needs attention
              </p>
              <p className="mt-1 font-semibold">{review.needsAttention}</p>
            </div>
            <div className="card p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">
                Next week
              </p>
              <p className="mt-1 text-sm text-ink-soft">{review.nextFocus}</p>
            </div>
            <div className="card p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">AI</p>
              <p className="mt-2 text-sm leading-relaxed text-ink-soft">{review.aiNote}</p>
            </div>
          </div>

          <div className="mt-4 space-y-2">
            {review.areaDeltas.map((a) => (
              <div key={a.key} className="flex items-center justify-between rounded-xl bg-bg-elevated px-3 py-2 text-sm">
                <span>{a.label}</span>
                <span className="tabular-nums text-muted">
                  {a.delta > 0 ? `+${a.delta}` : a.delta}
                </span>
              </div>
            ))}
          </div>
        </>
      )}

      <Button variant="soft" className="mt-5 w-full" onClick={() => void generateWeeklyReview()}>
        Refresh review
      </Button>
    </Screen>
  );
}
