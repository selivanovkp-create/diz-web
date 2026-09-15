"use client";

import { TaskCard } from "@/components/TaskCard";
import { Button, ScoreBar, Screen } from "@/components/ui";
import { todayISO } from "@/lib/gamification";
import { useFormaStore } from "@/lib/store";
import { greeting } from "@/lib/utils";
import Link from "next/link";
import { useMemo, useState, useTransition } from "react";

export default function TodayPage() {
  const user = useFormaStore((s) => s.user);
  const plans = useFormaStore((s) => s.plans);
  const checkIns = useFormaStore((s) => s.checkIns);
  const progress = useFormaStore((s) => s.progress);
  const lifeProfile = useFormaStore((s) => s.lifeProfile);
  const regenerateTodayPlan = useFormaStore((s) => s.regenerateTodayPlan);
  const [pending, startTransition] = useTransition();
  const [regenError, setRegenError] = useState<string | null>(null);

  const plan = useMemo(() => plans.find((p) => p.date === todayISO()), [plans]);
  const todayCheck = checkIns.find((c) => c.date === todayISO());
  const energy = todayCheck
    ? todayCheck.energy * 10
    : (lifeProfile?.areas.find((a) => a.key === "energy")?.score ?? 50);
  const yesterday = checkIns[checkIns.length - 2];
  const energyDelta =
    todayCheck && yesterday ? todayCheck.energy * 10 - yesterday.energy * 10 : null;

  const done = plan?.tasks.filter((t) => t.status === "done").length ?? 0;
  const total = plan?.tasks.length ?? 0;

  const sourceLabel =
    plan?.aiSource === "live"
      ? "DeepSeek"
      : plan?.aiSource === "mock"
        ? "Локальный черновик"
        : plan
          ? "Старый кэш"
          : null;

  const onRegenerate = () => {
    setRegenError(null);
    startTransition(async () => {
      try {
        await regenerateTodayPlan();
      } catch {
        setRegenError("Не удалось получить план от AI. Попробуй ещё раз.");
      }
    });
  };

  return (
    <Screen>
      <header className="rise mb-6">
        <p className="text-sm text-muted">{greeting(user?.name)}</p>
        <div className="mt-4 flex items-end justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">
              Энергия
            </p>
            <p className="mt-1 font-display text-5xl leading-none tabular-nums">{energy}</p>
            {energyDelta !== null ? (
              <p className="mt-2 text-xs text-muted">
                {energyDelta === 0
                  ? "Как вчера"
                  : `${energyDelta > 0 ? "↑" : "↓"} ${Math.abs(energyDelta)} к вчера`}
              </p>
            ) : (
              <p className="mt-2 text-xs text-muted">Из текущего профиля</p>
            )}
          </div>
          <div className="w-28 text-right">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">
              Уровень {progress.level}
            </p>
            <p className="mt-1 text-sm font-medium">{progress.levelTitle}</p>
            <p className="mt-1 text-xs text-muted">{progress.xp} XP</p>
          </div>
        </div>
        <div className="mt-4">
          <ScoreBar value={energy} />
        </div>
      </header>

      {!todayCheck ? (
        <Link href="/checkin" className="card rise rise-delay-1 mb-4 block p-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">
            Чек-ин
          </p>
          <p className="mt-1 text-base font-semibold">60 секунд. Потом план подстроится.</p>
        </Link>
      ) : null}

      <section className="rise rise-delay-2 mb-5">
        <div className="mb-3 flex items-end justify-between gap-3">
          <div>
            <h2 className="font-display text-2xl">Сегодня</h2>
            {sourceLabel ? (
              <p className="mt-1 text-xs text-muted">Источник: {sourceLabel}</p>
            ) : null}
          </div>
          <p className="text-sm text-muted">
            {done} из {total}
          </p>
        </div>
        {plan ? (
          <div className="card mb-4 p-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">
              Почему сегодня
            </p>
            <p className="mt-2 text-sm leading-relaxed text-ink-soft">{plan.reason}</p>
            <p className="mt-3 text-sm text-accent">{plan.motivation}</p>
          </div>
        ) : (
          <div className="card p-4 text-sm text-muted">
            {pending ? "DeepSeek собирает план…" : "Собираю план на сегодня…"}
          </div>
        )}
        <div className="space-y-3">
          {plan?.tasks.map((t) => (
            <TaskCard key={t.id} {...t} />
          ))}
        </div>
        <div className="mt-4">
          <Button
            variant="soft"
            className="w-full"
            disabled={pending}
            onClick={onRegenerate}
          >
            {pending ? "Генерирую через DeepSeek…" : "Пересобрать план с AI"}
          </Button>
          {regenError ? <p className="mt-2 text-xs text-muted">{regenError}</p> : null}
          {plan?.aiSource === "mock" ? (
            <p className="mt-2 text-xs text-muted">
              Сейчас локальный черновик — нажми кнопку, чтобы получить план от DeepSeek.
            </p>
          ) : null}
        </div>
      </section>

      <div className="rise rise-delay-3 grid grid-cols-2 gap-3">
        <Link href="/weekly" className="card p-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">
            Обзор
          </p>
          <p className="mt-1 text-sm font-semibold">Твоя неделя</p>
        </Link>
        <div className="card p-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">
            Momentum
          </p>
          <p className="mt-1 text-sm font-semibold">{progress.momentumDays} дн.</p>
        </div>
      </div>

      <div className="mt-4">
        <Link href="/checkin">
          <Button variant="soft" className="w-full">
            Обновить чек-ин
          </Button>
        </Link>
      </div>
    </Screen>
  );
}
