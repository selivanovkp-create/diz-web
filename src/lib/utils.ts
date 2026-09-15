import { clsx, type ClassValue } from "clsx";
import type { CheckInData } from "@/lib/types";

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

/** Short human state line for Today — no dashboard numbers. */
export function todayStateLine(checkIn?: CheckInData | null) {
  if (!checkIn) return "Сначала отметь, как ты себя чувствуешь.";
  const e = checkIn.energy;
  if (e <= 3) return "Сегодня сил меньше обычного — держим план лёгким.";
  if (e <= 5) return "Сегодня нормально. Главное — довести пару простых шагов.";
  if (e <= 7) return "Сегодня держишься хорошо.";
  return "Сегодня есть ресурс. Не раздувай день.";
}

export function energyDeltaLabel(checkIns: CheckInData[]) {
  if (checkIns.length < 2) return null;
  const a = checkIns[checkIns.length - 1]?.energy ?? 0;
  const b = checkIns[checkIns.length - 2]?.energy ?? 0;
  const d = a - b;
  if (d >= 1) return "Энергия ↑";
  if (d <= -1) return "Энергия ↓";
  return "Энергия без резких скачков";
}

export function trendPct(values: number[]) {
  if (values.length < 2) return null;
  const first = values[0] || 1;
  const last = values[values.length - 1] || 0;
  return Math.round(((last - first) / Math.max(first, 1)) * 100);
}
