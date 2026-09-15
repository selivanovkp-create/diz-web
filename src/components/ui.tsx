"use client";

import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import type { ButtonHTMLAttributes, PropsWithChildren } from "react";
import { AppHeader } from "@/components/AppHeader";

export function Button({
  children,
  className,
  variant = "primary",
  ...props
}: PropsWithChildren<
  ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: "primary" | "ghost" | "soft" | "danger";
  }
>) {
  return (
    <button
      className={cn(
        "inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl px-5 py-3 text-[15px] font-semibold transition active:scale-[0.98] disabled:opacity-40",
        variant === "primary" && "bg-accent text-white",
        variant === "ghost" && "bg-transparent text-ink-soft",
        variant === "soft" && "bg-accent-soft text-accent",
        variant === "danger" && "bg-[#f3e6e4] text-danger",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export function Screen({
  children,
  className,
  showHeader = true,
}: PropsWithChildren<{ className?: string; showHeader?: boolean }>) {
  return (
    <div className={cn("app-shell safe-bottom px-5 pt-5", className)}>
      {showHeader ? <AppHeader /> : null}
      {children}
    </div>
  );
}

export function SectionTitle({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="rise mb-6">
      <h1 className="font-display text-[2.15rem] leading-[1.1] tracking-tight text-ink">
        {title}
      </h1>
      {subtitle ? (
        <p className="mt-2 max-w-[34ch] text-[15px] leading-relaxed text-muted">
          {subtitle}
        </p>
      ) : null}
    </div>
  );
}

export function ScoreBar({ value, max = 100 }: { value: number; max?: number }) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div className="h-1 w-full overflow-hidden rounded-full bg-line">
      <motion.div
        className="h-full rounded-full bg-accent"
        initial={{ width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 0.45, ease: "easeOut" }}
      />
    </div>
  );
}

export function Chip({
  active,
  children,
  onClick,
}: {
  active?: boolean;
  children: React.ReactNode;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "min-h-11 rounded-full border px-4 py-2.5 text-[15px] transition",
        active
          ? "border-ink bg-ink text-white"
          : "border-line bg-bg-elevated text-ink-soft",
      )}
    >
      {children}
    </button>
  );
}

export function ChoiceRow({
  options,
  value,
  onChange,
}: {
  options: { id: string; label: string }[];
  value?: string;
  onChange: (id: string) => void;
}) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          onClick={() => onChange(o.id)}
          className={cn(
            "min-h-14 rounded-2xl border px-2 py-3 text-center text-sm font-medium transition",
            value === o.id
              ? "border-ink bg-ink text-white"
              : "border-line bg-bg-elevated text-ink-soft",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
