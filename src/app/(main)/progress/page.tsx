"use client";

import { ProgressRing } from "@/components/ProgressRing";
import { TrackTabs } from "@/components/TrackTabs";
import { Button, Screen } from "@/components/ui";
import { primaryWhy, whyLabel, whyToArea } from "@/lib/plot";
import { useFormaStore } from "@/lib/store";
import { plansForTrack } from "@/lib/tracks";
import { planDayRates, trendPct } from "@/lib/utils";
import { useEffect, useMemo, useState } from "react";

export default function ProgressPage() {
  const lifeProfile = useFormaStore((s) => s.lifeProfile);
  const progress = useFormaStore((s) => s.progress);
  const allPlans = useFormaStore((s) => s.plans);
  const whySelected = useFormaStore((s) => s.why.selected);
  const goals = useFormaStore((s) => s.goals);
  const tracks = useFormaStore((s) => s.tracks);
  const activeTrackId = useFormaStore((s) => s.activeTrackId);
  const setActiveTrack = useFormaStore((s) => s.setActiveTrack);
  const weeklyReviews = useFormaStore((s) => s.weeklyReviews);
  const generateWeeklyReview = useFormaStore((s) => s.generateWeeklyReview);
  const [busy, setBusy] = useState(false);

  const plans = useMemo(
    () => plansForTrack(allPlans, activeTrackId),
    [allPlans, activeTrackId],
  );

  const review = weeklyReviews[weeklyReviews.length - 1];
  const why = primaryWhy(whySelected);
  const focusLabel = whyLabel(why);

  const dayRates = useMemo(() => planDayRates(plans, 7), [plans]);
  const weekRates = useMemo(() => dayRates.map((d) => d.rate), [dayRates]);

  const avg = (arr: number[]) =>
    arr.length ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : 0;

  const weekCompletion = avg(weekRates);
  const completionTrend = useMemo(() => trendPct(weekRates), [weekRates]);

  const daysActive = useMemo(() => {
    return plans.filter((p) =>
      p.tasks.some((t) => t.status === "done" || t.status === "skipped"),
    ).length;
  }, [plans]);

  /** Per onboarding why: % of related tasks done in recent plans. */
  const focusAreas = useMemo(() => {
    const recent = plans.slice(-7);
    const allTasks = recent.flatMap((p) => p.tasks);
    const themes = (whySelected.length ? whySelected : [why]).slice(0, 3);

    return themes.map((w) => {
      const area = whyToArea(w);
      const related = allTasks.filter(
        (t) =>
          t.category === area ||
          t.category === w ||
          goals.some((g) => g.area === area && g.title === whyLabel(w)),
      );
      // Fall back to all tasks if we can't map categories yet
      const pool = related.length ? related : allTasks.filter((t) => t.status !== "skipped");
      const active = pool.filter((t) => t.status !== "skipped");
      const score = active.length
        ? Math.round(
            (active.filter((t) => t.status === "done").length / active.length) * 100,
          )
        : 0;
      return {
        key: w,
        label: whyLabel(w),
        score,
        trend: score >= 70 ? "up" : score < 40 ? "down" : "stable",
      };
    });
  }, [plans, whySelected, why, goals]);

  const profileFocus = useMemo(() => {
    if (focusAreas.length) return [];
    const areas = lifeProfile?.areas ?? [];
    return [lifeProfile?.priorityArea, lifeProfile?.secondaryArea]
      .map((k) => areas.find((a) => a.key === k))
      .filter(Boolean)
      .slice(0, 3);
  }, [focusAreas.length, lifeProfile]);

  useEffect(() => {
    const daysWithWork = plans.filter((p) =>
      p.tasks.some((t) => t.status === "done"),
    ).length;
    if (daysWithWork >= 3 && !review) {
      void generateWeeklyReview().catch(() => undefined);
    }
  }, [plans, review, generateWeeklyReview]);

  async function refreshInsight() {
    setBusy(true);
    try {
      await generateWeeklyReview();
    } finally {
      setBusy(false);
    }
  }

  const hasData = plans.some((p) => p.tasks.length > 0);

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
        Не рейтинг самочувствия. Ответ на вопрос:{" "}
        <span className="text-ink-soft">
          закрываешь чеклист по «{focusLabel}» или нет?
        </span>
      </p>

      {!hasData ? (
        <p className="rise rise-delay-1 mt-10 text-[15px] text-muted">
          Закрой 2–3 дня с задачами — здесь появятся круги и проценты.
        </p>
      ) : (
        <>
          <section className="rise rise-delay-1 mt-9 flex justify-center">
            <ProgressRing
              value={weekCompletion}
              size={148}
              stroke={10}
              label="Чеклист за неделю"
              caption={
                daysActive > 0
                  ? `${daysActive} ${daysActive === 1 ? "день" : "дня"} с шагами`
                  : "Пока мало дней"
              }
            />
          </section>

          <p className="rise mt-5 text-center text-sm text-muted">
            Сколько обещанных себе шагов ты реально закрыл
          </p>

          <section className="rise rise-delay-2 mt-10 grid grid-cols-2 gap-6">
            <ProgressRing
              value={weekCompletion}
              size={108}
              stroke={8}
              label={focusLabel}
              caption={
                completionTrend === null
                  ? "Среднее по чеклисту"
                  : completionTrend > 0
                    ? `↑ на ${completionTrend}% к старту недели`
                    : completionTrend < 0
                      ? `↓ на ${Math.abs(completionTrend)}% к старту недели`
                      : "Без резких скачков"
              }
            />
            <ProgressRing
              value={Math.min(100, progress.momentumDays * 10)}
              size={108}
              stroke={8}
              label="Серия"
              caption={`${progress.momentumDays} ${
                progress.momentumDays === 1 ? "день" : "дней"
              } подряд`}
            />
          </section>

          {progress.momentumDays > 0 ? (
            <div className="rise mt-8 rounded-3xl border border-line bg-bg-elevated px-4 py-4">
              <p className="text-[15px] font-semibold">
                Серия · {progress.momentumDays}{" "}
                {progress.momentumDays === 1 ? "день" : "дней"}
              </p>
              <p className="mt-1 text-sm leading-relaxed text-muted">
                Сколько дней подряд ты закрывал шаги и не обнулял ритм. Это важнее
                идеальных цифр.
              </p>
            </div>
          ) : null}

          {(focusAreas.length > 0 || profileFocus.length > 0) && (
            <section className="rise rise-delay-3 mt-10">
              <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-muted">
                Темы из онбординга
              </h2>
              <p className="mt-2 max-w-[34ch] text-sm text-muted">
                Доля закрытых шагов по тому, что ты выбрал на старте.
              </p>
              <div className="mt-6 grid grid-cols-3 gap-2">
                {(focusAreas.length ? focusAreas : profileFocus).map((a) =>
                  a ? (
                    <ProgressRing
                      key={String(a.key)}
                      value={a.score}
                      size={88}
                      stroke={6}
                      label={a.label}
                      caption={
                        a.trend === "up"
                          ? "растёт"
                          : a.trend === "down"
                            ? "проседает"
                            : "ровно"
                      }
                    />
                  ) : null,
                )}
              </div>
            </section>
          )}

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
                Ещё рано для сильного вывода. Закрой несколько дней чеклиста —
                появится ясный паттерн по «{focusLabel}».
              </p>
            )}
            {review?.needsAttention ? (
              <p className="mt-4 max-w-[34ch] text-[15px] text-ink-soft">
                Слабое место сейчас: {review.needsAttention}
              </p>
            ) : null}
          </section>

          {weekRates.length >= 2 ? (
            <section className="rise mt-10">
              <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-muted">
                Чеклист по дням
              </h2>
              <div className="mt-4 flex h-24 items-end gap-2">
                {weekRates.map((v, i) => (
                  <div
                    key={dayRates[i]?.date ?? i}
                    className="flex-1 rounded-t-md bg-accent/65"
                    style={{ height: `${Math.max(10, v)}%` }}
                    title={`${v}%`}
                  />
                ))}
              </div>
            </section>
          ) : null}
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
