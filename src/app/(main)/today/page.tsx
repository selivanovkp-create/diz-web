"use client";

import { TaskCard } from "@/components/TaskCard";
import { Button, ScoreBar, Screen } from "@/components/ui";
import { todayISO } from "@/lib/gamification";
import { useFormaStore } from "@/lib/store";
import { greeting } from "@/lib/utils";
import Link from "next/link";
import { useMemo } from "react";

export default function TodayPage() {
  const user = useFormaStore((s) => s.user);
  const plans = useFormaStore((s) => s.plans);
  const checkIns = useFormaStore((s) => s.checkIns);
  const progress = useFormaStore((s) => s.progress);
  const lifeProfile = useFormaStore((s) => s.lifeProfile);

  const plan = useMemo(() => plans.find((p) => p.date === todayISO()), [plans]);
  const todayCheck = checkIns.find((c) => c.date === todayISO());
  const energy = todayCheck ? todayCheck.energy * 10 : lifeProfile?.areas.find((a) => a.key === "energy")?.score ?? 50;
  const yesterday = checkIns[checkIns.length - 2];
  const energyDelta =
    todayCheck && yesterday ? todayCheck.energy * 10 - yesterday.energy * 10 : null;

  const done = plan?.tasks.filter((t) => t.status === "done").length ?? 0;
  const total = plan?.tasks.length ?? 0;

  return (
    <Screen>
      <header className="rise mb-6">
        <p className="text-sm text-muted">{greeting(user?.name)}</p>
        <div className="mt-4 flex items-end justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">
              Energy
            </p>
            <p className="mt-1 font-display text-5xl leading-none tabular-nums">{energy}</p>
            {energyDelta !== null ? (
              <p className="mt-2 text-xs text-muted">
                {energyDelta === 0
                  ? "Same as yesterday"
                  : `${energyDelta > 0 ? "↑" : "↓"} ${Math.abs(energyDelta)} vs yesterday`}
              </p>
            ) : (
              <p className="mt-2 text-xs text-muted">From your current profile</p>
            )}
          </div>
          <div className="w-28 text-right">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">
              Level {progress.level}
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
            Check-in
          </p>
          <p className="mt-1 text-base font-semibold">60 seconds. Then the plan adapts.</p>
        </Link>
      ) : null}

      <section className="rise rise-delay-2 mb-5">
        <div className="mb-3 flex items-end justify-between">
          <h2 className="font-display text-2xl">Today</h2>
          <p className="text-sm text-muted">
            {done} of {total}
          </p>
        </div>
        {plan ? (
          <div className="card mb-4 p-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">
              Why today
            </p>
            <p className="mt-2 text-sm leading-relaxed text-ink-soft">{plan.reason}</p>
            <p className="mt-3 text-sm text-accent">{plan.motivation}</p>
          </div>
        ) : (
          <div className="card p-4 text-sm text-muted">Building today’s plan…</div>
        )}
        <div className="space-y-3">
          {plan?.tasks.map((t) => (
            <TaskCard key={t.id} {...t} />
          ))}
        </div>
      </section>

      <div className="rise rise-delay-3 grid grid-cols-2 gap-3">
        <Link href="/weekly" className="card p-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">
            Review
          </p>
          <p className="mt-1 text-sm font-semibold">Your week</p>
        </Link>
        <div className="card p-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">
            Momentum
          </p>
          <p className="mt-1 text-sm font-semibold">{progress.momentumDays} days</p>
        </div>
      </div>

      <div className="mt-4">
        <Link href="/checkin">
          <Button variant="soft" className="w-full">
            Update check-in
          </Button>
        </Link>
      </div>
    </Screen>
  );
}
