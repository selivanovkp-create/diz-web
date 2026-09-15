"use client";

import { ProgressRing } from "@/components/ProgressRing";
import { Button, Screen } from "@/components/ui";
import { useFormaStore } from "@/lib/store";
import { trendPct } from "@/lib/utils";
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
  const weekSleep = useMemo(
    () => checkIns.slice(-7).map((c) => c.sleep * 10),
    [checkIns],
  );

  const avg = (arr: number[]) =>
    arr.length ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : 0;

  const energyAvg = avg(weekEnergy);
  const sleepAvg = avg(weekSleep);
  const energyTrend = useMemo(() => trendPct(weekEnergy), [weekEnergy]);

  const weekCompletion = useMemo(() => {
    const tasks = plans.slice(-7).flatMap((p) => p.tasks);
    if (!tasks.length) return 0;
    return Math.round(
      (tasks.filter((t) => t.status === "done").length / tasks.length) * 100,
    );
  }, [plans]);

  const daysActive = useMemo(() => {
    const dates = new Set(plans.slice(-7).map((p) => p.date));
    return dates.size;
  }, [plans]);

  const focusAreas = useMemo(() => {
    const areas = lifeProfile?.areas ?? [];
    const preferred = FOCUS_KEYS.map((k) => areas.find((a) => a.key === k)).filter(
      Boolean,
    );
    return (preferred.length ? preferred : areas).slice(0, 3);
  }, [lifeProfile]);

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

  const hasData = plans.length > 0 || checkIns.length > 0;

  return (
    <Screen>
      <h1 className="font-display rise text-[2.2rem] leading-tight tracking-tight">
        Прогресс
      </h1>
      <p className="rise mt-2 max-w-[34ch] text-[15px] leading-relaxed text-muted">
        Не рейтинг здоровья. Это ответ на вопрос:{" "}
        <span className="text-ink-soft">ты держишь курс или проседает?</span>
      </p>

      {!hasData ? (
        <p className="rise rise-delay-1 mt-10 text-[15px] text-muted">
          Закрой 2–3 дня с планом — здесь появятся круги и проценты.
        </p>
      ) : (
        <>
          <section className="rise rise-delay-1 mt-9 flex justify-center">
            <ProgressRing
              value={weekCompletion}
              size={148}
              stroke={10}
              label="План за неделю"
              caption={
                daysActive > 0
                  ? `${daysActive} ${daysActive === 1 ? "день" : "дня"} с задачами`
                  : "Пока мало дней"
              }
            />
          </section>

          <p className="rise mt-5 text-center text-sm text-muted">
            Сколько обещанных себе шагов ты реально закрыл
          </p>

          <section className="rise rise-delay-2 mt-10 grid grid-cols-2 gap-6">
            <ProgressRing
              value={energyAvg || 0}
              size={108}
              stroke={8}
              label="Энергия"
              caption={
                energyTrend === null
                  ? "Среднее за чек-ины"
                  : energyTrend > 0
                    ? `↑ на ${energyTrend}% к старту недели`
                    : energyTrend < 0
                      ? `↓ на ${Math.abs(energyTrend)}% к старту недели`
                      : "Без резких скачков"
              }
            />
            <ProgressRing
              value={sleepAvg || 0}
              size={108}
              stroke={8}
              label="Сон"
              caption="Средняя оценка из чек-инов"
            />
          </section>

          {progress.momentumDays > 0 ? (
            <div className="rise mt-8 rounded-3xl border border-line bg-bg-elevated px-4 py-4">
              <p className="text-[15px] font-semibold">
                Серия · {progress.momentumDays}{" "}
                {progress.momentumDays === 1 ? "день" : "дней"}
              </p>
              <p className="mt-1 text-sm leading-relaxed text-muted">
                Сколько дней подряд ты заходил и не обнулял ритм. Это важнее
                идеальных цифр.
              </p>
            </div>
          ) : null}

          {focusAreas.length > 0 ? (
            <section className="rise rise-delay-3 mt-10">
              <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-muted">
                Твои фокусы
              </h2>
              <p className="mt-2 max-w-[34ch] text-sm text-muted">
                Насколько близко к «нормально» по приоритетам Forma. 100% —
                устойчивое состояние, не идеал.
              </p>
              <div className="mt-6 grid grid-cols-3 gap-2">
                {focusAreas.map((a) =>
                  a ? (
                    <ProgressRing
                      key={a.key}
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
                Ещё рано для сильного вывода. Закрой несколько дней — появится
                ясный паттерн.
              </p>
            )}
            {review?.needsAttention ? (
              <p className="mt-4 max-w-[34ch] text-[15px] text-ink-soft">
                Слабое место сейчас: {review.needsAttention}
              </p>
            ) : null}
          </section>

          {weekEnergy.length >= 2 ? (
            <section className="rise mt-10">
              <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-muted">
                Энергия по дням
              </h2>
              <div className="mt-4 flex h-24 items-end gap-2">
                {weekEnergy.map((v, i) => (
                  <div
                    key={i}
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
