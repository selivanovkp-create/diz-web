"use client";

import { Button, Screen } from "@/components/ui";
import { canUseCoach } from "@/lib/subscription";
import { useFormaStore } from "@/lib/store";
import { useEffect, useRef, useState } from "react";

const PROMPTS = [
  "Почему я постоянно устаю?",
  "Помоги бросить курить",
  "Что мне делать сегодня?",
  "Просто поговорить",
];

export default function CoachPage() {
  const coach = useFormaStore((s) => s.coach);
  const sendCoachMessage = useFormaStore((s) => s.sendCoachMessage);
  const subscription = useFormaStore((s) => s.subscription);
  const unlockPremium = useFormaStore((s) => s.unlockPremium);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [coach.length]);

  async function send(message?: string) {
    const content = (message ?? text).trim();
    if (!content || busy) return;
    setBusy(true);
    setText("");
    await sendCoachMessage(content);
    setBusy(false);
  }

  const allowed = canUseCoach(subscription);

  return (
    <Screen className="flex min-h-dvh flex-col">
      <h1 className="font-display text-[2.2rem] leading-tight tracking-tight">
        Коуч
      </h1>
      <p className="mt-2 max-w-[32ch] text-[15px] text-muted">
        Что хочешь разобрать?
      </p>

      <div className="mt-6 flex-1 space-y-3">
        {coach.length === 0 ? (
          <div className="flex flex-col gap-2">
            {PROMPTS.map((p) => (
              <button
                key={p}
                type="button"
                disabled={!allowed || busy}
                onClick={() => void send(p)}
                className="rounded-2xl border border-line bg-bg-elevated px-4 py-3.5 text-left text-[15px] text-ink-soft transition active:scale-[0.99] disabled:opacity-40"
              >
                {p}
              </button>
            ))}
          </div>
        ) : null}

        {coach.map((m) => (
          <div
            key={m.id}
            className={
              m.role === "user"
                ? "ml-8 rounded-2xl bg-ink px-4 py-3 text-[15px] leading-relaxed text-white"
                : "mr-4 text-[15px] leading-relaxed text-ink-soft"
            }
          >
            {m.content}
          </div>
        ))}
        {busy ? (
          <p className="text-sm text-muted">Думаю…</p>
        ) : null}
        <div ref={endRef} />
      </div>

      {!allowed ? (
        <div className="mt-4 rounded-2xl border border-line px-4 py-4">
          <p className="text-[15px] font-semibold">Лимит на сегодня</p>
          <p className="mt-1 text-sm text-muted">
            Premium даёт постоянный диалог без лимита.
          </p>
          <Button className="mt-3 w-full" onClick={unlockPremium}>
            Включить Premium
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
            placeholder="Напиши…"
            className="min-h-12 flex-1 rounded-2xl border border-line bg-bg-elevated px-4 text-[15px] outline-none focus:border-ink"
          />
          <Button disabled={busy || !text.trim()} onClick={() => void send()}>
            →
          </Button>
        </div>
      )}
    </Screen>
  );
}
