"use client";

import { TaskCard } from "@/components/TaskCard";
import { Button, Screen } from "@/components/ui";
import { todayISO } from "@/lib/gamification";
import { useFormaStore } from "@/lib/store";
import { CHECKIN_BY_WHY, primaryWhy } from "@/lib/checkin-plot";
import { focusDeltaLabel, greeting, todayStateLine } from "@/lib/utils";
import Link from "next/link";
import { useMemo, useState, useTransition } from "react";

export default function TodayPage() {
  const user = useFormaStore((s) => s.user);
  const plans = useFormaStore((s) => s.plans);
  const checkIns = useFormaStore((s) => s.checkIns);
  const progress = useFormaStore((s) => s.progress);
  const whySelected = useFormaStore((s) => s.why.selected);
  const regenerateTodayPlan = useFormaStore((s) => s.regenerateTodayPlan);
  const [pending, startTransition] = useTransition();
  const [err, setErr] = useState<string | null>(null);

  const plan = useMemo(() => plans.find((p) => p.date === todayISO()), [plans]);
  const todayCheck = checkIns.find((c) => c.date === todayISO());
  const activeTasks = plan?.tasks.filter((t) => t.status !== "skipped") ?? [];
  const done = activeTasks.filter((t) => t.status === "done").length;
  const total = activeTasks.length;
  const allDone = total > 0 && done === total;
  const focusLabel = CHECKIN_BY_WHY[primaryWhy(whySelected)].label;
  const delta = focusDeltaLabel(checkIns, whySelected);
  const dayPct = total ? Math.round((done / total) * 100) : 0;

  const onRegenerate = () => {
    setErr(null);
    startTransition(async () => {
      try {
        await regenerateTodayPlan();
      } catch {
        setErr("Не удалось обновить план. Попробуй ещё раз.");
      }
    });
  };

  return (
    <Screen>
      <section className="rise mb-7">
        <p className="text-[15px] text-muted">{greeting(user?.name)}</p>
        <h1 className="font-display mt-3 text-[2.2rem] leading-[1.08] tracking-tight">
          {todayStateLine(todayCheck, whySelected)}
        </h1>
        {delta && todayCheck ? (
          <p className="mt-3 text-[15px] text-ink-soft">{delta}</p>
        ) : null}
        {progress.momentumDays > 0 ? (
          <p className="mt-3 text-sm text-muted">
            {progress.momentumDays}{" "}
            {progress.momentumDays === 1 ? "день" : "дней"} подряд ты появляешься
          </p>
        ) : null}
      </section>

      {!todayCheck ? (
        <Link
          href="/checkin"
          className="rise rise-delay-1 mb-7 block rounded-3xl border border-line bg-bg-elevated px-4 py-4"
        >
          <p className="text-[15px] font-semibold text-ink">
            Сигнал по «{focusLabel}»
          </p>
          <p className="mt-1 text-sm text-muted">
            Два выбора — Forma подстроит нагрузку плана.
          </p>
        </Link>
      ) : null}

      <section className="rise rise-delay-2 mb-7">
        <div className="mb-4 flex items-end justify-between gap-3">
          <div>
            <h2 className="font-display text-[1.7rem] tracking-tight">План на сегодня</h2>
            {plan?.reason ? (
              <p className="mt-1 max-w-[34ch] text-sm leading-relaxed text-muted">
                {plan.reason}
              </p>
            ) : null}
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
              />
            ))}
          </div>
        ) : (
          <div className="rounded-3xl border border-dashed border-line px-4 py-6">
            <p className="text-[15px] text-muted">
              Плана пока нет. Обнови — Forma соберёт шаги под тебя.
            </p>
          </div>
        )}

        {plan?.motivation ? (
          <p className="mt-5 max-w-[36ch] text-[15px] leading-relaxed text-ink-soft">
            {plan.motivation}
          </p>
        ) : null}

        {err ? <p className="mt-3 text-sm text-danger">{err}</p> : null}
      </section>

      <div className="rise rise-delay-3 space-y-3">
        {allDone ? (
          <div className="rounded-3xl bg-accent-soft px-4 py-4">
            <p className="text-[15px] font-semibold text-accent">День закрыт</p>
            <p className="mt-1 text-sm text-ink-soft">
              Завтра Forma подстроится под то, как ты прошёл сегодня.
            </p>
          </div>
        ) : (
          <Link href={todayCheck ? "/progress" : "/checkin"}>
            <Button className="w-full">
              {todayCheck ? "Смотреть прогресс" : `Сигнал по «${focusLabel}»`}
            </Button>
          </Link>
        )}
        <Button
          variant="ghost"
          className="w-full"
          disabled={pending}
          onClick={onRegenerate}
        >
          Обновить план
        </Button>
      </div>
    </Screen>
  );
}
