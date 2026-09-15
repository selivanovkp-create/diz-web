"use client";

import { ProgressRing } from "@/components/ProgressRing";
import { TrackTabs } from "@/components/TrackTabs";
import { Button, Screen } from "@/components/ui";
import { computeAutoProgress } from "@/lib/auto-progress";
import { useFormaStore } from "@/lib/store";
import { plansForTrack } from "@/lib/tracks";
import { useEffect, useMemo, useState } from "react";

export default function ProgressPage() {
  const allPlans = useFormaStore((s) => s.plans);
  const whySelected = useFormaStore((s) => s.why.selected);
  const currentState = useFormaStore((s) => s.currentState);
  const tracks = useFormaStore((s) => s.tracks);
  const activeTrackId = useFormaStore((s) => s.activeTrackId);
  const setActiveTrack = useFormaStore((s) => s.setActiveTrack);
  const weeklyReviews = useFormaStore((s) => s.weeklyReviews);
  const generateWeeklyReview = useFormaStore((s) => s.generateWeeklyReview);
  const [busy, setBusy] = useState(false);

  const activeTrack = useMemo(
    () => tracks.find((t) => t.id === activeTrackId) ?? tracks[0] ?? null,
    [tracks, activeTrackId],
  );

  const plans = useMemo(
    () => plansForTrack(allPlans, activeTrack?.id ?? activeTrackId),
    [allPlans, activeTrack, activeTrackId],
  );

  const auto = useMemo(
    () =>
      computeAutoProgress(activeTrack, plans, whySelected, currentState),
    [activeTrack, plans, whySelected, currentState],
  );

  const review = weeklyReviews[weeklyReviews.length - 1];

  const deltaLabel =
    auto.delta > 2
      ? `↑ ${auto.delta} с старта`
      : auto.delta < -2
        ? `↓ ${Math.abs(auto.delta)} с старта`
        : "рядом со стартом";

  useEffect(() => {
    if (auto.activeDays >= 3 && !review) {
      void generateWeeklyReview().catch(() => undefined);
    }
  }, [auto.activeDays, review, generateWeeklyReview]);

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
      <TrackTabs
        tracks={tracks}
        activeTrackId={activeTrackId}
        onSelect={setActiveTrack}
      />

      <h1 className="font-display rise text-[2.2rem] leading-tight tracking-tight">
        Прогресс
      </h1>
      <p className="rise mt-2 max-w-[34ch] text-[15px] leading-relaxed text-muted">
        Считаем сами по шагам в «{auto.label}».{" "}
        <span className="text-ink-soft">
          Ничего отдельно отмечать не нужно.
        </span>
      </p>

      {auto.empty ? (
        <p className="rise rise-delay-1 mt-10 text-[15px] text-muted">
          Закрой первые шаги на Today — индекс темы начнёт двигаться от точки
          онбординга.
        </p>
      ) : (
        <>
          <section className="rise rise-delay-1 mt-9 flex justify-center">
            <ProgressRing
              value={auto.score}
              size={148}
              stroke={10}
              label={auto.label}
              caption={`${deltaLabel} · старт ${auto.baseline}`}
            />
          </section>

          <p className="rise mt-5 text-center text-sm text-muted">
            Индекс сдвига: старт из онбординга + твои действия − паузы
          </p>

          <section className="rise rise-delay-2 mt-10 grid grid-cols-2 gap-4">
            <div className="rounded-3xl border border-line bg-bg-elevated px-4 py-4">
              <p className="text-sm text-muted">Шагов сделано</p>
              <p className="font-display mt-1 text-[2rem] tabular-nums leading-none">
                {auto.stepsDone}
              </p>
            </div>
            <div className="rounded-3xl border border-line bg-bg-elevated px-4 py-4">
              <p className="text-sm text-muted">Минут в теме</p>
              <p className="font-display mt-1 text-[2rem] tabular-nums leading-none">
                {auto.minutesDone}
              </p>
            </div>
            <div className="rounded-3xl border border-line bg-bg-elevated px-4 py-4">
              <p className="text-sm text-muted">Дней с шагом</p>
              <p className="font-display mt-1 text-[2rem] tabular-nums leading-none">
                {auto.activeDays}
                <span className="text-lg text-muted">/{auto.calendarDays}</span>
              </p>
            </div>
            <div className="rounded-3xl border border-line bg-bg-elevated px-4 py-4">
              <p className="text-sm text-muted">Серия</p>
              <p className="font-display mt-1 text-[2rem] tabular-nums leading-none">
                {auto.streak}
              </p>
            </div>
          </section>

          <section className="rise rise-delay-2 mt-8 flex justify-center">
            <ProgressRing
              value={auto.consistency}
              size={108}
              stroke={8}
              label="Ритм"
              caption="% дней, когда был хотя бы один шаг"
            />
          </section>

          {auto.series.length >= 2 ? (
            <section className="rise mt-10">
              <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-muted">
                Индекс по дням
              </h2>
              <div className="mt-4 flex h-24 items-end gap-1.5">
                {auto.series.map((d) => (
                  <div
                    key={d.date}
                    className="flex-1 rounded-t-md bg-accent/65"
                    style={{ height: `${Math.max(8, d.score)}%` }}
                    title={`${d.date}: ${d.score}`}
                  />
                ))}
              </div>
            </section>
          ) : null}

          <section className="rise mt-12">
            <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-muted">
              Что Forma видит
            </h2>
            {review?.biggestWin || review?.aiNote ? (
              <p className="mt-4 max-w-[36ch] text-[17px] leading-relaxed text-ink">
                {review.biggestWin || review.aiNote}
              </p>
            ) : (
              <p className="mt-4 max-w-[34ch] text-[15px] leading-relaxed text-muted">
                Индекс «{auto.label}»: {auto.score} при старте {auto.baseline}.
                Чем стабильнее шаги, тем выше сдвиг — без отдельных оценок.
              </p>
            )}
          </section>
        </>
      )}

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
