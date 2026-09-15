"use client";

import { TaskDetailSheet } from "@/components/TaskDetailSheet";
import { resolveTaskGuide } from "@/lib/task-guide";
import { useFormaStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";
import { motion } from "framer-motion";
import { useMemo, useState } from "react";

export function TaskCard({
  id,
  title,
  detail,
  why,
  category,
  durationMin,
  status,
  steps,
  doneWhen,
  tip,
}: {
  id: string;
  title: string;
  detail?: string;
  why?: string;
  category?: string;
  durationMin?: number;
  xp?: number;
  status: "pending" | "done" | "skipped";
  steps?: string[];
  doneWhen?: string;
  tip?: string;
}) {
  const completeTask = useFormaStore((s) => s.completeTask);
  const skipTask = useFormaStore((s) => s.skipTask);
  const whySelected = useFormaStore((s) => s.why.selected);
  const [open, setOpen] = useState(false);
  const done = status === "done";
  const skipped = status === "skipped";

  const guide = useMemo(
    () =>
      resolveTaskGuide(
        { title, detail, why, durationMin, category, steps, doneWhen, tip },
        whySelected,
      ),
    [title, detail, why, durationMin, category, steps, doneWhen, tip, whySelected],
  );

  return (
    <>
      <motion.div
        layout={false}
        className={cn(
          "rounded-3xl border border-line bg-bg-elevated p-4 shadow-[var(--shadow)] transition",
          done && "opacity-70",
          skipped && "opacity-40",
        )}
      >
        <div className="flex items-start gap-3.5">
          <button
            type="button"
            aria-label={done ? "Выполнено" : "Отметить выполненным"}
            disabled={done || skipped}
            onClick={() => completeTask(id)}
            className={cn(
              "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border transition active:scale-95",
              done
                ? "border-accent bg-accent text-white"
                : "border-line bg-white hover:border-accent",
            )}
          >
            {done ? <Check size={16} strokeWidth={2.5} /> : null}
          </button>

          <div className="min-w-0 flex-1">
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="w-full text-left"
            >
              <p
                className={cn(
                  "text-[17px] font-semibold leading-snug text-ink",
                  done && "text-muted line-through",
                )}
              >
                {title}
              </p>
              {durationMin ? (
                <p className="mt-1 text-xs font-medium uppercase tracking-[0.08em] text-muted">
                  ~{durationMin} мин
                </p>
              ) : null}
              <p className="mt-3 text-[14px] leading-relaxed text-ink-soft">
                <span className="font-medium text-ink">Зачем тебе: </span>
                {guide.why}
              </p>
              <p className="mt-3 text-sm font-medium text-accent">
                Как сделать →
              </p>
            </button>

            {!done && !skipped ? (
              <button
                type="button"
                onClick={() => skipTask(id)}
                className="mt-3 text-xs text-muted underline-offset-2 hover:underline"
              >
                Пропустить
              </button>
            ) : null}
          </div>
        </div>
      </motion.div>

      {open ? (
        <TaskDetailSheet
          guide={guide}
          status={status}
          onClose={() => setOpen(false)}
          onComplete={() => completeTask(id)}
          onSkip={() => skipTask(id)}
        />
      ) : null}
    </>
  );
}
