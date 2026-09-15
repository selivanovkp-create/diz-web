"use client";

import { useFormaStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";
import { motion } from "framer-motion";

export function TaskCard({
  id,
  title,
  status,
}: {
  id: string;
  title: string;
  detail?: string;
  why?: string;
  xp?: number;
  status: "pending" | "done" | "skipped";
}) {
  const completeTask = useFormaStore((s) => s.completeTask);
  const done = status === "done";
  const skipped = status === "skipped";

  return (
    <motion.button
      layout
      type="button"
      disabled={done || skipped}
      onClick={() => completeTask(id)}
      className={cn(
        "flex w-full items-start gap-3 rounded-2xl border border-transparent px-1 py-3 text-left transition",
        done && "opacity-55",
        skipped && "opacity-35",
      )}
    >
      <span
        className={cn(
          "mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border transition",
          done ? "border-accent bg-accent text-white" : "border-line bg-bg-elevated",
        )}
      >
        {done ? <Check size={14} strokeWidth={2.5} /> : null}
      </span>
      <span
        className={cn(
          "pt-0.5 text-[17px] font-medium leading-snug text-ink",
          done && "text-muted line-through",
        )}
      >
        {title}
      </span>
    </motion.button>
  );
}
