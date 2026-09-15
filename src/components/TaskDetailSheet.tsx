"use client";

import { Button } from "@/components/ui";
import type { TaskGuide } from "@/lib/task-guide";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";
import { useEffect } from "react";
import { createPortal } from "react-dom";

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

  if (typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center sm:p-4">
      <button
        type="button"
        aria-label="Закрыть"
        className="absolute inset-0 bg-[#141414]/40"
        onClick={onClose}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="task-sheet-title"
        className="relative z-[101] flex w-full max-w-[430px] flex-col overflow-hidden rounded-t-[28px] bg-bg-elevated shadow-[0_-12px_48px_rgba(20,20,20,0.18)] sm:max-h-[min(860px,90dvh)] sm:rounded-[28px]"
        style={{ maxHeight: "min(92dvh, 860px)" }}
      >
        {/* Handle + close */}
        <div className="relative shrink-0 border-b border-line px-5 pb-3 pt-3">
          <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-line sm:hidden" />
          <div className="flex items-start gap-3 pr-8">
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-medium tracking-wide text-muted">
                Как сделать
              </p>
              <h2
                id="task-sheet-title"
                className="font-display mt-1 text-[1.65rem] leading-[1.15] tracking-tight text-ink"
              >
                {guide.title}
              </h2>
              <p className="mt-2 text-[13px] text-muted">
                {guide.durationMin ? `~${guide.durationMin} мин` : "Без таймера"}
                {status === "done"
                  ? " · сделано"
                  : status === "skipped"
                    ? " · пропущено"
                    : ""}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="absolute right-3 top-3 flex h-11 w-11 items-center justify-center rounded-full bg-bg text-ink-soft"
              aria-label="Закрыть"
            >
              <X size={18} strokeWidth={2} />
            </button>
          </div>
        </div>

        {/* Scroll body */}
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-5">
          {guide.summary ? (
            <p className="text-[15px] leading-relaxed text-ink-soft">
              {guide.summary}
            </p>
          ) : null}

          <section className={cn(guide.summary ? "mt-6" : "mt-0")}>
            <h3 className="text-[12px] font-semibold uppercase tracking-[0.14em] text-muted">
              Зачем тебе
            </h3>
            <p className="mt-2 text-[15px] leading-relaxed text-ink">
              {guide.why}
            </p>
          </section>

          <section className="mt-7">
            <h3 className="text-[12px] font-semibold uppercase tracking-[0.14em] text-muted">
              По шагам
            </h3>
            <ol className="mt-3 space-y-0">
              {guide.steps.map((step, i) => (
                <li
                  key={`${i}-${step.slice(0, 16)}`}
                  className="flex gap-3 border-b border-line py-3 last:border-b-0"
                >
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent-soft text-[13px] font-semibold tabular-nums text-accent">
                    {i + 1}
                  </span>
                  <p className="min-w-0 flex-1 pt-0.5 text-[15px] leading-relaxed text-ink-soft">
                    {step}
                  </p>
                </li>
              ))}
            </ol>
          </section>

          <section className="mt-6 rounded-2xl bg-accent-soft px-4 py-3.5">
            <h3 className="text-[13px] font-semibold text-accent">Готово, когда</h3>
            <p className="mt-1.5 text-[15px] leading-relaxed text-ink-soft">
              {guide.doneWhen}
            </p>
          </section>

          <section className="mt-6">
            <h3 className="text-[12px] font-semibold uppercase tracking-[0.14em] text-muted">
              Совет
            </h3>
            <p className="mt-2 text-[15px] leading-relaxed text-ink-soft">
              {guide.tip}
            </p>
          </section>

          {guide.avoid.length > 0 ? (
            <section className="mt-6 pb-2">
              <h3 className="text-[12px] font-semibold uppercase tracking-[0.14em] text-muted">
                Не надо
              </h3>
              <ul className="mt-2 space-y-2">
                {guide.avoid.map((a) => (
                  <li
                    key={a}
                    className="flex gap-2 text-[15px] leading-relaxed text-ink-soft"
                  >
                    <span className="shrink-0 text-muted">·</span>
                    <span>{a}</span>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </div>

        {/* Actions — above bottom nav + home indicator */}
        <div
          className="shrink-0 border-t border-line bg-bg-elevated px-5 pt-3"
          style={{
            paddingBottom:
              "calc(0.85rem + env(safe-area-inset-bottom, 0px))",
          }}
        >
          {!locked ? (
            <div className="space-y-2">
              <Button
                className="w-full"
                onClick={() => {
                  onComplete();
                  onClose();
                }}
              >
                Сделано
              </Button>
              <div className="grid grid-cols-2 gap-2">
                <Button variant="ghost" className="w-full" onClick={onClose}>
                  Закрыть
                </Button>
                <Button
                  variant="ghost"
                  className="w-full"
                  onClick={() => {
                    onSkip();
                    onClose();
                  }}
                >
                  Пропустить
                </Button>
              </div>
            </div>
          ) : (
            <Button className="w-full" onClick={onClose}>
              Понятно
            </Button>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
