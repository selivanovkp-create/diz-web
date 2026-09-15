"use client";

import { Screen, SectionTitle, ScoreBar } from "@/components/ui";
import { useFormaStore } from "@/lib/store";
import { pct } from "@/lib/utils";
import Link from "next/link";
import { useMemo } from "react";

export default function ProgressPage() {
  const lifeProfile = useFormaStore((s) => s.lifeProfile);
  const progress = useFormaStore((s) => s.progress);
  const achievements = useFormaStore((s) => s.achievements);
  const checkIns = useFormaStore((s) => s.checkIns);
  const plans = useFormaStore((s) => s.plans);

  const weekEnergy = useMemo(() => {
    return checkIns.slice(-7).map((c) => c.energy * 10);
  }, [checkIns]);

  const completion = useMemo(() => {
    const tasks = plans.slice(-7).flatMap((p) => p.tasks);
    if (!tasks.length) return 0;
    return tasks.filter((t) => t.status === "done").length / tasks.length;
  }, [plans]);

  return (
    <Screen>
      <SectionTitle eyebrow="Progress" title="State over time" subtitle="Indicators from behavior + self-report. Not medical scores." />

      <div className="card rise mb-4 p-4">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">Level</p>
            <p className="font-display text-3xl">{progress.level}</p>
            <p className="text-sm text-muted">{progress.levelTitle}</p>
          </div>
          <div className="text-right">
            <p className="text-sm font-semibold">{progress.xp} XP</p>
            <p className="text-xs text-muted">Momentum {progress.momentumDays}d</p>
          </div>
        </div>
        <div className="mt-4">
          <ScoreBar value={completion * 100} />
          <p className="mt-2 text-xs text-muted">Week completion {pct(completion * 100)}</p>
        </div>
      </div>

      <div className="rise rise-delay-1 mb-4">
        <h2 className="mb-3 text-sm font-semibold">Life areas</h2>
        <div className="space-y-3">
          {lifeProfile?.areas
            .slice()
            .sort((a, b) => a.score - b.score)
            .map((a) => (
              <div key={a.key} className="card p-4">
                <div className="mb-2 flex items-center justify-between">
                  <p className="font-semibold">{a.label}</p>
                  <p className="tabular-nums text-sm">
                    {a.score}
                    <span className="text-muted">
                      {" "}
                      {a.trend === "up" ? "↑" : a.trend === "down" ? "↓" : "→"}
                    </span>
                  </p>
                </div>
                <ScoreBar value={a.score} />
                {a.problems[0] ? (
                  <p className="mt-2 text-xs text-muted">{a.problems[0]}</p>
                ) : null}
              </div>
            ))}
        </div>
      </div>

      {weekEnergy.length > 0 ? (
        <div className="card rise rise-delay-2 mb-4 p-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">
            Energy · last check-ins
          </p>
          <div className="mt-3 flex h-24 items-end gap-1.5">
            {weekEnergy.map((v, i) => (
              <div key={i} className="flex-1 rounded-t bg-accent/80" style={{ height: `${v}%` }} />
            ))}
          </div>
        </div>
      ) : null}

      <div className="rise rise-delay-3 mb-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold">Achievements</h2>
          <Link href="/weekly" className="text-xs text-accent">
            Weekly review
          </Link>
        </div>
        {achievements.length === 0 ? (
          <p className="text-sm text-muted">Появятся после первых действий.</p>
        ) : (
          <div className="space-y-2">
            {achievements.map((a) => (
              <div key={a.key} className="card p-3">
                <p className="text-sm font-semibold">{a.title}</p>
                <p className="text-xs text-muted">{a.description}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </Screen>
  );
}
