"use client";

import { useFormaStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";
import { motion } from "framer-motion";

export function TaskCard({
  id,
  title,
  detail,
  why,
  xp,
  status,
}: {
  id: string;
  title: string;
  detail?: string;
  why?: string;
  xp: number;
  status: "pending" | "done" | "skipped";
}) {
  const completeTask = useFormaStore((s) => s.completeTask);
  const skipTask = useFormaStore((s) => s.skipTask);
  const done = status === "done";
  const skipped = status === "skipped";

  return (
    <motion.div
      layout
      className={cn(
        "card p-4",
        done && "opacity-70",
        skipped && "opacity-45",
      )}
    >
      <div className="flex items-start gap-3">
        <button
          type="button"
          aria-label="Выполнить задачу"
          disabled={done || skipped}
          onClick={() => completeTask(id)}
          className={cn(
            "mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border transition",
            done ? "border-accent bg-accent text-white" : "border-line bg-white",
          )}
        >
          {done ? <Check size={14} /> : null}
        </button>
        <div className="min-w-0 flex-1">
          <p className={cn("text-[15px] font-semibold leading-snug", done && "line-through")}>
            {title}
          </p>
          {detail ? <p className="mt-1 text-sm text-muted">{detail}</p> : null}
          {why ? <p className="mt-2 text-xs leading-relaxed text-ink-soft">{why}</p> : null}
          <div className="mt-3 flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-muted">
              +{xp} XP
            </span>
            {!done && !skipped ? (
              <button
                type="button"
                onClick={() => skipTask(id)}
                className="text-xs text-muted underline-offset-2 hover:underline"
              >
                Пропустить
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
