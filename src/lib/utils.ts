import { clsx, type ClassValue } from "clsx";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function uid(prefix = "id") {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36).slice(-4)}`;
}

export function greeting(name?: string) {
  const h = new Date().getHours();
  const hi = h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
  return name ? `${hi}, ${name}.` : `${hi}.`;
}

export function pct(n: number) {
  return `${Math.round(n)}%`;
}
