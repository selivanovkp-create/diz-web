"use client";

import { Button, Screen, SectionTitle } from "@/components/ui";
import { canUseCoach } from "@/lib/subscription";
import { useFormaStore } from "@/lib/store";
import { useEffect, useRef, useState } from "react";

const AREA_RU: Record<string, string> = {
  energy: "энергия",
  sleep: "сон",
  physical: "движение",
  mind: "голова",
  productivity: "продуктивность",
  habits: "привычки",
  social: "социум",
  lifestyle: "образ жизни",
};

export default function CoachPage() {
  const coach = useFormaStore((s) => s.coach);
  const sendCoachMessage = useFormaStore((s) => s.sendCoachMessage);
  const subscription = useFormaStore((s) => s.subscription);
  const unlockPremium = useFormaStore((s) => s.unlockPremium);
  const lifeProfile = useFormaStore((s) => s.lifeProfile);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [coach.length]);

  async function send() {
    if (!text.trim() || busy) return;
    setBusy(true);
    const reply = await sendCoachMessage(text.trim());
    setBusy(false);
    if (reply === null) return;
    setText("");
  }

  const allowed = canUseCoach(subscription);
  const priorityLabel = lifeProfile
    ? AREA_RU[lifeProfile.priorityArea] ?? lifeProfile.priorityArea
    : null;

  return (
    <Screen className="flex min-h-dvh flex-col">
      <SectionTitle
        eyebrow="Коуч"
        title="С учётом тебя"
        subtitle="Знает профиль, задачи и чек-ин. Не ставит диагнозы."
      />

      {lifeProfile ? (
        <div className="card mb-4 p-3 text-xs text-muted">
          Сейчас приоритет:{" "}
          <span className="font-semibold text-ink">{priorityLabel}</span>
          {" · "}
          {lifeProfile.summary}
        </div>
      ) : null}

      <div className="flex-1 space-y-3">
        {coach.length === 0 ? (
          <div className="card p-4 text-sm text-muted">
            Спроси, например: «Почему я постоянно устаю?» или «Что мне делать сегодня?»
          </div>
        ) : null}
        {coach.map((m) => (
          <div
            key={m.id}
            className={
              m.role === "user"
                ? "ml-8 rounded-2xl bg-accent px-3 py-2 text-sm text-white"
                : "mr-6 card px-3 py-2 text-sm leading-relaxed text-ink-soft"
            }
          >
            {m.content}
          </div>
        ))}
        <div ref={endRef} />
      </div>

      {!allowed ? (
        <div className="card mt-4 p-4">
          <p className="text-sm font-semibold">Лимит бесплатного тарифа</p>
          <p className="mt-1 text-xs text-muted">
            Premium — постоянная персонализация, не просто «больше кнопок».
          </p>
          <Button className="mt-3 w-full" onClick={unlockPremium}>
            Включить Premium (демо)
          </Button>
        </div>
      ) : (
        <div className="sticky bottom-[4.5rem] mt-4 flex gap-2 bg-bg/90 py-2 backdrop-blur">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") void send();
            }}
            placeholder="Спроси что угодно…"
            className="flex-1 rounded-2xl border border-line bg-bg-elevated px-3 py-3 text-sm outline-none focus:border-accent"
          />
          <Button disabled={busy} onClick={() => void send()}>
            Отправить
          </Button>
        </div>
      )}
      {subscription.plan === "free" ? (
        <p className="mt-1 text-center text-[11px] text-muted">
          Коуч {subscription.coachMessagesUsed}/{subscription.coachMessagesLimit}
        </p>
      ) : null}
    </Screen>
  );
}
