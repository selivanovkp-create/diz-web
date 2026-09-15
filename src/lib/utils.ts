import { clsx, type ClassValue } from "clsx";
import { primaryWhy, whyLabel } from "@/lib/plot";
import type { DailyPlanData, WhyOption } from "@/lib/types";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function uid(prefix = "id") {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36).slice(-4)}`;
}

export function greeting(name?: string) {
  const h = new Date().getHours();
  const hi = h < 12 ? "Доброе утро" : h < 18 ? "Добрый день" : "Добрый вечер";
  return name ? `${hi}, ${name}` : hi;
}

export function pct(n: number) {
  return `${Math.round(n)}%`;
}

function dayCompletion(plan?: DailyPlanData | null) {
  if (!plan) return null;
  const active = plan.tasks.filter((t) => t.status !== "skipped");
  if (!active.length) return null;
  return active.filter((t) => t.status === "done").length / active.length;
}

/** Hero line for Today — driven by checklist + onboarding why. */
export function todayStateLine(input: {
  whySelected: WhyOption[];
  done: number;
  total: number;
  hasPlan: boolean;
  momentumDays: number;
}) {
  const label = whyLabel(primaryWhy(input.whySelected));
  if (!input.hasPlan || input.total === 0) {
    return `Сегодня собираем шаги по «${label}».`;
  }
  if (input.done === 0) {
    return `Чеклист по «${label}»: начни с одного шага.`;
  }
  if (input.done >= input.total) {
    return `«${label}» на сегодня закрыт.`;
  }
  if (input.done / input.total < 0.4) {
    return `По «${label}» день ещё открыт — без героизма.`;
  }
  return `Держишь «${label}». Доведи оставшееся.`;
}

/** Compare yesterday vs day-before completion for the focus theme. */
export function completionDeltaLabel(
  plans: DailyPlanData[],
  whySelected: WhyOption[] = [],
) {
  const label = whyLabel(primaryWhy(whySelected));
  const sorted = [...plans].sort((a, b) => a.date.localeCompare(b.date));
  if (sorted.length < 2) return null;
  const a = dayCompletion(sorted[sorted.length - 1]);
  const b = dayCompletion(sorted[sorted.length - 2]);
  if (a === null || b === null) return null;
  const d = a - b;
  if (d >= 0.15) return `Чеклист по «${label}» ↑`;
  if (d <= -0.15) return `Чеклист по «${label}» ↓`;
  return `Чеклист по «${label}» без резких скачков`;
}

export function planDayRates(plans: DailyPlanData[], limit = 7) {
  return [...plans]
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-limit)
    .map((p) => {
      const rate = dayCompletion(p);
      return {
        date: p.date,
        rate: rate === null ? 0 : Math.round(rate * 100),
      };
    });
}

export function trendPct(values: number[]) {
  if (values.length < 2) return null;
  const first = values[0] || 1;
  const last = values[values.length - 1] || 0;
  return Math.round(((last - first) / Math.max(first, 1)) * 100);
}
