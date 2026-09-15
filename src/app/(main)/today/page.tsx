"use client";

import { TaskCard } from "@/components/TaskCard";
import { TrackTabs } from "@/components/TrackTabs";
import { Button, Screen } from "@/components/ui";
import { todayISO } from "@/lib/gamification";
import { primaryWhy, whyLabel } from "@/lib/plot";
import { useFormaStore } from "@/lib/store";
import { plansForTrack } from "@/lib/tracks";
import { completionDeltaLabel, greeting, todayStateLine } from "@/lib/utils";
import Link from "next/link";
import { useEffect, useMemo, useState, useTransition } from "react";

export default function TodayPage() {
  const user = useFormaStore((s) => s.user);
  const plans = useFormaStore((s) => s.plans);
  const progress = useFormaStore((s) => s.progress);
  const whySelected = useFormaStore((s) => s.why.selected);
  const constraints = useFormaStore((s) => s.constraints);
  const setConstraints = useFormaStore((s) => s.setConstraints);
  const regenerateTodayPlan = useFormaStore((s) => s.regenerateTodayPlan);
  const ensureTodayPlan = useFormaStore((s) => s.ensureTodayPlan);
  const tracks = useFormaStore((s) => s.tracks);
  const activeTrackId = useFormaStore((s) => s.activeTrackId);
  const setActiveTrack = useFormaStore((s) => s.setActiveTrack);
  const removeTrack = useFormaStore((s) => s.removeTrack);
  const [pending, startTransition] = useTransition();
  const [err, setErr] = useState<string | null>(null);

  const trackPlans = useMemo(
    () => plansForTrack(plans, activeTrackId),
    [plans, activeTrackId],
  );

  const plan = useMemo(
    () => trackPlans.find((p) => p.date === todayISO()),
    [trackPlans],
  );
  const activeTasks = plan?.tasks.filter((t) => t.status !== "skipped") ?? [];
  const done = activeTasks.filter((t) => t.status === "done").length;
  const total = activeTasks.length;
  const allDone = total > 0 && done === total;
  const focusLabel = whyLabel(primaryWhy(whySelected));
  const dayPct = total ? Math.round((done / total) * 100) : 0;
  const delta = completionDeltaLabel(trackPlans, whySelected);

  useEffect(() => {
    void ensureTodayPlan();
  }, [activeTrackId, ensureTodayPlan]);

  const runPlan = (opts?: { ease?: boolean }) => {
    setErr(null);
    startTransition(async () => {
      try {
        if (opts?.ease) {
          setConstraints({
            ...constraints,
            preferTiny: true,
            difficulty: 1,
          });
        }
        await regenerateTodayPlan();
      } catch {
        setErr("Не удалось обновить план. Попробуй ещё раз.");
      }
    });
  };

  return (
    <Screen>
      <TrackTabs
        tracks={tracks}
        activeTrackId={activeTrackId}
        onSelect={setActiveTrack}
        onDelete={(id) => {
          removeTrack(id);
          if (useFormaStore.getState().tracks.length === 0) {
            window.location.href = "/onboarding";
          }
        }}
      />

      <section className="rise mb-7">
        <p className="text-[15px] text-muted">{greeting(user?.name)}</p>
        <h1 className="font-display mt-3 text-[2.2rem] leading-[1.08] tracking-tight">
          {todayStateLine({
            whySelected,
            done,
            total,
            hasPlan: Boolean(plan),
            momentumDays: progress.momentumDays,
          })}
        </h1>
        {delta ? <p className="mt-3 text-[15px] text-ink-soft">{delta}</p> : null}
        {progress.momentumDays > 0 ? (
          <p className="mt-3 text-sm text-muted">
            {progress.momentumDays}{" "}
            {progress.momentumDays === 1 ? "день" : "дней"} подряд ты закрываешь
            шаги
          </p>
        ) : null}
      </section>

      <section className="rise rise-delay-1 mb-7">
        <div className="mb-4 flex items-end justify-between gap-3">
          <div>
            <h2 className="font-display text-[1.7rem] tracking-tight">
              План · {focusLabel}
            </h2>
            {plan?.reason ? (
              <p className="mt-1 max-w-[34ch] text-sm leading-relaxed text-muted">
                {plan.reason}
              </p>
            ) : (
              <p className="mt-1 max-w-[34ch] text-sm leading-relaxed text-muted">
                Шаги по этой теме. Отмечай в чеклисте — Forma подстроит нагрузку.
              </p>
            )}
          </div>
          {total > 0 ? (
            <p className="shrink-0 text-sm tabular-nums text-muted">
              {done}/{total} · {dayPct}%
            </p>
          ) : null}
        </div>

        {pending ? (
          <p className="py-6 text-[15px] text-muted">Собираю план…</p>
        ) : plan && activeTasks.length > 0 ? (
          <div className="space-y-3">
            {activeTasks.map((t) => (
              <TaskCard
                key={t.id}
                id={t.id}
                title={t.title}
                detail={t.detail}
                why={t.why}
                category={t.category}
                durationMin={t.durationMin}
                status={t.status}
                steps={t.steps}
                doneWhen={t.doneWhen}
                tip={t.tip}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-3xl border border-dashed border-line px-4 py-6">
            <p className="text-[15px] text-muted">
              Плана пока нет. Forma соберёт шаги под «{focusLabel}».
            </p>
            <Button className="mt-4 w-full" disabled={pending} onClick={() => runPlan()}>
              Собрать план
            </Button>
          </div>
        )}

        {plan?.motivation ? (
          <p className="mt-5 max-w-[36ch] text-[15px] leading-relaxed text-ink-soft">
            {plan.motivation}
          </p>
        ) : null}

        {err ? <p className="mt-3 text-sm text-danger">{err}</p> : null}
      </section>

      <div className="rise rise-delay-2 space-y-3">
        {allDone ? (
          <div className="rounded-3xl bg-accent-soft px-4 py-4">
            <p className="text-[15px] font-semibold text-accent">
              День по «{focusLabel}» закрыт
            </p>
            <p className="mt-1 text-sm text-ink-soft">
              Можешь переключиться на другую тему сверху — или отдохнуть.
            </p>
          </div>
        ) : (
          <Link href="/progress">
            <Button className="w-full">Смотреть прогресс</Button>
          </Link>
        )}
        {!allDone && total > 2 ? (
          <Button
            variant="ghost"
            className="w-full"
            disabled={pending}
            onClick={() => runPlan({ ease: true })}
          >
            Мало сил — упростить день
          </Button>
        ) : null}
        <Button
          variant="ghost"
          className="w-full"
          disabled={pending}
          onClick={() => runPlan()}
        >
          Обновить план
        </Button>
      </div>
    </Screen>
  );
}
