"use client";

import { Button } from "@/components/ui";
import type { TaskGuide } from "@/lib/task-guide";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";
import { useEffect } from "react";

export function TaskDetailSheet({
  guide,
  status,
  onClose,
  onComplete,
  onSkip,
}: {
  guide: TaskGuide;
  status: "pending" | "done" | "skipped";
  onClose: () => void;
  onComplete: () => void;
  onSkip: () => void;
}) {
  const locked = status === "done" || status === "skipped";

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center">
      <button
        type="button"
        aria-label="Закрыть"
        className="absolute inset-0 bg-ink/35 backdrop-blur-[2px]"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={guide.title}
        className="relative z-[81] flex max-h-[88dvh] w-full max-w-[430px] flex-col rounded-t-[28px] border border-line bg-bg-elevated shadow-[0_-8px_40px_rgba(20,20,20,0.12)]"
      >
        <div className="relative flex items-center justify-center px-5 pb-2 pt-3">
          <div className="h-1 w-10 rounded-full bg-line" />
          <button
            type="button"
            onClick={onClose}
            className="absolute right-3 top-2 flex h-10 w-10 items-center justify-center rounded-full text-muted"
            aria-label="Закрыть"
          >
            <X size={18} />
          </button>
        </div>

        <div className="overflow-y-auto px-5 pb-4 pt-1">
          <p className="text-sm text-muted">Как сделать</p>
          <h2 className="font-display mt-2 text-[1.85rem] leading-tight tracking-tight">
            {guide.title}
          </h2>
          {guide.durationMin ? (
            <p className="mt-2 text-xs font-medium uppercase tracking-[0.08em] text-muted">
              ~{guide.durationMin} мин
              {status === "done"
                ? " · сделано"
                : status === "skipped"
                  ? " · пропущено"
                  : ""}
            </p>
          ) : null}

          <p className="mt-4 text-[15px] leading-relaxed text-ink-soft">
            {guide.summary}
          </p>

          <section className="mt-7">
            <h3 className="text-sm font-semibold uppercase tracking-[0.12em] text-muted">
              Зачем тебе
            </h3>
            <p className="mt-2 text-[15px] leading-relaxed text-ink">
              {guide.why}
            </p>
          </section>

          <section className="mt-7">
            <h3 className="text-sm font-semibold uppercase tracking-[0.12em] text-muted">
              По шагам
            </h3>
            <ol className="mt-3 space-y-3">
              {guide.steps.map((step, i) => (
                <li key={`${i}-${step.slice(0, 12)}`} className="flex gap-3">
                  <span
                    className={cn(
                      "mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
                      "bg-accent-soft text-accent",
                    )}
                  >
                    {i + 1}
                  </span>
                  <p className="text-[15px] leading-relaxed text-ink-soft">
                    {step}
                  </p>
                </li>
              ))}
            </ol>
          </section>

          <section className="mt-7 rounded-2xl bg-accent-soft/70 px-4 py-3.5">
            <h3 className="text-sm font-semibold text-accent">Готово, когда</h3>
            <p className="mt-1.5 text-[15px] leading-relaxed text-ink-soft">
              {guide.doneWhen}
            </p>
          </section>

          <section className="mt-6">
            <h3 className="text-sm font-semibold uppercase tracking-[0.12em] text-muted">
              Совет
            </h3>
            <p className="mt-2 text-[15px] leading-relaxed text-ink-soft">
              {guide.tip}
            </p>
          </section>

          {guide.avoid.length > 0 ? (
            <section className="mt-6">
              <h3 className="text-sm font-semibold uppercase tracking-[0.12em] text-muted">
                Не надо
              </h3>
              <ul className="mt-2 space-y-2">
                {guide.avoid.map((a) => (
                  <li
                    key={a}
                    className="text-[15px] leading-relaxed text-ink-soft"
                  >
                    · {a}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </div>

        <div className="safe-sheet-actions space-y-2 border-t border-line px-5 py-4">
          {!locked ? (
            <>
              <Button
                className="w-full"
                onClick={() => {
                  onComplete();
                  onClose();
                }}
              >
                Сделано
              </Button>
              <div className="flex gap-2">
                <Button variant="ghost" className="flex-1" onClick={onClose}>
                  Закрыть
                </Button>
                <Button
                  variant="ghost"
                  className="flex-1"
                  onClick={() => {
                    onSkip();
                    onClose();
                  }}
                >
                  Пропустить
                </Button>
              </div>
            </>
          ) : (
            <Button className="w-full" onClick={onClose}>
              Понятно
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
