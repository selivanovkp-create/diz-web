import { clsx, type ClassValue } from "clsx";
import {
  CHECKIN_BY_WHY,
  focusScoreFromCheckIn,
  primaryWhy,
} from "@/lib/checkin-plot";
import type { CheckInData, WhyOption } from "@/lib/types";

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

/** Short human state line for Today — tied to capacity + focus. */
export function todayStateLine(
  checkIn?: CheckInData | null,
  whySelected: WhyOption[] = [],
) {
  const why = primaryWhy(whySelected);
  const label = CHECKIN_BY_WHY[why].label;
  if (!checkIn) return `Отметь сигнал по «${label}» — план подстроится.`;
  const e = checkIn.energy;
  if (e <= 3) return `Мало сил на «${label}» — держим план лёгким.`;
  if (e <= 5) return `Нормальный день по «${label}». Закрой пару простых шагов.`;
  if (e <= 7) return `По «${label}» держишься. Не раздувай день.`;
  return `Есть запас по «${label}». Не раздувай день.`;
}

export function focusDeltaLabel(
  checkIns: CheckInData[],
  whySelected: WhyOption[] = [],
) {
  if (checkIns.length < 2) return null;
  const why = primaryWhy(whySelected);
  const label = CHECKIN_BY_WHY[why].label;
  const a = focusScoreFromCheckIn(checkIns[checkIns.length - 1]!, why);
  const b = focusScoreFromCheckIn(checkIns[checkIns.length - 2]!, why);
  const d = a - b;
  if (d >= 1) return `${label} ↑`;
  if (d <= -1) return `${label} ↓`;
  return `${label} без резких скачков`;
}

/** @deprecated use focusDeltaLabel */
export function energyDeltaLabel(checkIns: CheckInData[]) {
  return focusDeltaLabel(checkIns, ["energy"]);
}

export function trendPct(values: number[]) {
  if (values.length < 2) return null;
  const first = values[0] || 1;
  const last = values[values.length - 1] || 0;
  return Math.round(((last - first) / Math.max(first, 1)) * 100);
}
