"use client";

import { Button, Screen, SectionTitle } from "@/components/ui";
import { useFormaStore } from "@/lib/store";
import { useState } from "react";

export default function ProfilePage() {
  const user = useFormaStore((s) => s.user);
  const lifeProfile = useFormaStore((s) => s.lifeProfile);
  const subscription = useFormaStore((s) => s.subscription);
  const unlockPremium = useFormaStore((s) => s.unlockPremium);
  const cancelPremium = useFormaStore((s) => s.cancelPremium);
  const addJournal = useFormaStore((s) => s.addJournal);
  const journal = useFormaStore((s) => s.journal);
  const resetAll = useFormaStore((s) => s.resetAll);
  const goals = useFormaStore((s) => s.goals);
  const [note, setNote] = useState("");

  return (
    <Screen>
      <SectionTitle eyebrow="Profile" title={user?.name ?? "You"} subtitle="Personal State · not a medical file." />

      <div className="card rise mb-4 p-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">
          Strategy
        </p>
        <ul className="mt-2 space-y-1.5">
          {lifeProfile?.strategy.map((s) => (
            <li key={s} className="text-sm text-ink-soft">
              · {s}
            </li>
          ))}
        </ul>
      </div>

      <div className="card rise rise-delay-1 mb-4 p-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">Goals</p>
        {goals.length === 0 ? (
          <p className="mt-2 text-sm text-muted">Пока пусто.</p>
        ) : (
          <ul className="mt-2 space-y-1">
            {goals.map((g) => (
              <li key={g.id} className="text-sm">
                {g.title}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="card rise rise-delay-2 mb-4 p-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">
          Journal
        </p>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={3}
          placeholder="Сегодня вообще нет сил…"
          className="mt-2 w-full resize-none rounded-xl border border-line bg-bg px-3 py-2 text-sm outline-none focus:border-accent"
        />
        <Button
          variant="soft"
          className="mt-2 w-full"
          onClick={() => {
            if (!note.trim()) return;
            addJournal(note.trim());
            setNote("");
          }}
        >
          Save note
        </Button>
        <div className="mt-3 space-y-2">
          {journal
            .slice()
            .reverse()
            .slice(0, 5)
            .map((j) => (
              <p key={j.id} className="rounded-xl bg-bg px-3 py-2 text-xs text-muted">
                {j.body}
              </p>
            ))}
        </div>
      </div>

      <div className="card rise rise-delay-3 mb-4 p-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">
          Subscription
        </p>
        <p className="mt-1 text-sm font-semibold capitalize">{subscription.plan}</p>
        <p className="mt-1 text-xs text-muted">
          Платишь за постоянную персонализацию, не за tracker.
        </p>
        {subscription.plan === "free" ? (
          <Button className="mt-3 w-full" onClick={unlockPremium}>
            Start Premium (mock)
          </Button>
        ) : (
          <Button variant="ghost" className="mt-3 w-full" onClick={cancelPremium}>
            Cancel Premium
          </Button>
        )}
      </div>

      <Button
        variant="danger"
        className="w-full"
        onClick={() => {
          if (confirm("Удалить все локальные данные?")) {
            resetAll();
            window.location.href = "/onboarding";
          }
        }}
      >
        Delete account data
      </Button>
    </Screen>
  );
}
