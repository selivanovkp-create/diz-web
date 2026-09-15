"use client";

import { Button, Screen } from "@/components/ui";
import { useFormaStore } from "@/lib/store";
import { pct, trendPct } from "@/lib/utils";
import { useEffect, useMemo, useState } from "react";

const FOCUS_KEYS = ["energy", "sleep", "physical", "habits"] as const;

export default function ProgressPage() {
  const lifeProfile = useFormaStore((s) => s.lifeProfile);
  const progress = useFormaStore((s) => s.progress);
  const checkIns = useFormaStore((s) => s.checkIns);
  const plans = useFormaStore((s) => s.plans);
  const weeklyReviews = useFormaStore((s) => s.weeklyReviews);
  const generateWeeklyReview = useFormaStore((s) => s.generateWeeklyReview);
  const [busy, setBusy] = useState(false);

  const review = weeklyReviews[weeklyReviews.length - 1];

  const weekEnergy = useMemo(
    () => checkIns.slice(-7).map((c) => c.energy * 10),
    [checkIns],
  );

  const energyTrend = useMemo(() => trendPct(weekEnergy), [weekEnergy]);

  const focusAreas = useMemo(() => {
    const areas = lifeProfile?.areas ?? [];
    const preferred = FOCUS_KEYS.map((k) => areas.find((a) => a.key === k)).filter(
      Boolean,
    );
    if (preferred.length) return preferred.slice(0, 4);
    return areas.slice(0, 4);
  }, [lifeProfile]);

  const completion = useMemo(() => {
    const tasks = plans.slice(-7).flatMap((p) => p.tasks);
    if (!tasks.length) return null;
    return tasks.filter((t) => t.status === "done").length / tasks.length;
  }, [plans]);

  useEffect(() => {
    if (checkIns.length >= 3 && !review) {
      void generateWeeklyReview().catch(() => undefined);
    }
  }, [checkIns.length, review, generateWeeklyReview]);

  async function refreshInsight() {
    setBusy(true);
    try {
      await generateWeeklyReview();
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen>
      <h1 className="font-display rise text-[2.2rem] leading-tight tracking-tight">
        Прогресс
      </h1>
      <p className="rise mt-2 max-w-[32ch] text-[15px] text-muted">
        Ты действительно становишься лучше?
      </p>

      {progress.momentumDays > 0 ? (
        <p className="rise rise-delay-1 mt-6 text-[15px] text-ink-soft">
          Momentum · {progress.momentumDays}{" "}
          {progress.momentumDays === 1 ? "день" : "дней"}
        </p>
      ) : (
        <p className="rise rise-delay-1 mt-6 text-[15px] text-muted">
          Дай Forma пару дней — появятся первые закономерности.
        </p>
      )}

      <section className="rise rise-delay-2 mt-10">
        <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-muted">
          30 дней · фокус
        </h2>
        <div className="mt-4 space-y-5">
          {focusAreas.length === 0 ? (
            <p className="text-[15px] text-muted">
              После онбординга здесь появятся ключевые изменения.
            </p>
          ) : (
            focusAreas.map((a) => {
              if (!a) return null;
              const arrow =
                a.trend === "up" ? "↑" : a.trend === "down" ? "↓" : "→";
              return (
                <div key={a.key} className="flex items-baseline justify-between gap-4">
                  <p className="text-[17px] font-medium">{a.label}</p>
                  <p className="text-[17px] tabular-nums text-ink-soft">
                    {arrow} {a.score}
                  </p>
                </div>
              );
            })
          )}
        </div>
        {completion !== null ? (
          <p className="mt-6 text-sm text-muted">
            За неделю закрыто {pct(completion * 100)} плана
          </p>
        ) : null}
      </section>

      <section className="rise rise-delay-3 mt-12">
        <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-muted">
          Главное изменение
        </h2>
        {review?.biggestWin || review?.aiNote ? (
          <p className="mt-4 max-w-[36ch] text-[17px] leading-relaxed text-ink">
            {review.biggestWin || review.aiNote}
          </p>
        ) : (
          <p className="mt-4 max-w-[34ch] text-[15px] leading-relaxed text-muted">
            Ещё рано для сильного вывода. Закрой несколько дней — Forma увидит
            паттерн.
          </p>
        )}
        {review?.needsAttention ? (
          <p className="mt-4 max-w-[34ch] text-[15px] text-ink-soft">
            Внимание: {review.needsAttention}
          </p>
        ) : null}
      </section>

      {weekEnergy.length >= 2 ? (
        <section className="rise mt-12">
          <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-muted">
            Энергия · неделя
            {energyTrend !== null ? (
              <span className="ml-2 font-medium normal-case tracking-normal text-ink-soft">
                {energyTrend > 0 ? `↑ ${energyTrend}%` : energyTrend < 0 ? `↓ ${Math.abs(energyTrend)}%` : "→"}
              </span>
            ) : null}
          </h2>
          <div className="mt-5 flex h-28 items-end gap-2">
            {weekEnergy.map((v, i) => (
              <div
                key={i}
                className="flex-1 rounded-t-md bg-accent/70"
                style={{ height: `${Math.max(8, v)}%` }}
              />
            ))}
          </div>
        </section>
      ) : null}

      <Button
        variant="soft"
        className="mt-12 w-full"
        disabled={busy}
        onClick={() => void refreshInsight()}
      >
        {busy ? "Смотрю…" : "Обновить взгляд Forma"}
      </Button>
    </Screen>
  );
}
