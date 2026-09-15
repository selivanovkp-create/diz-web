"use client";

import { Button, Screen, SectionTitle } from "@/components/ui";
import { useFormaStore } from "@/lib/store";
import { useEffect, useState } from "react";

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
  const [aiStatus, setAiStatus] = useState("…");

  const planLabel = subscription.plan === "premium" ? "Premium" : "Бесплатный";

  useEffect(() => {
    const base = (process.env.NEXT_PUBLIC_AI_API_BASE || "").replace(/\/$/, "");
    fetch(`${base}/api/ai`)
      .then((r) => r.json())
      .then((d) => {
        if (d.provider === "timeweb-deepseek") {
          setAiStatus(`DeepSeek · ${d.model || "Timeweb"}`);
        } else {
          setAiStatus("Mock (ключ Timeweb не подключён)");
        }
      })
      .catch(() => setAiStatus("Mock (API недоступен)"));
  }, []);

  return (
    <Screen>
      <SectionTitle
        eyebrow="Профиль"
        title={user?.name ?? "Ты"}
        subtitle="Personal State · не медицинская карта."
      />

      <div className="card rise mb-4 p-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">AI</p>
        <p className="mt-1 text-sm font-semibold">{aiStatus}</p>
      </div>

      <div className="card rise mb-4 p-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">
          Стратегия
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
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">Цели</p>
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
          Дневник
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
          Сохранить заметку
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
          Подписка
        </p>
        <p className="mt-1 text-sm font-semibold">{planLabel}</p>
        <p className="mt-1 text-xs text-muted">
          Платишь за постоянную персонализацию, не за трекер.
        </p>
        {subscription.plan === "free" ? (
          <Button className="mt-3 w-full" onClick={unlockPremium}>
            Включить Premium (демо)
          </Button>
        ) : (
          <Button variant="ghost" className="mt-3 w-full" onClick={cancelPremium}>
            Отменить Premium
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
        Удалить данные аккаунта
      </Button>
    </Screen>
  );
}
