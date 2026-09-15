"use client";

import Link from "next/link";
import { useFormaStore } from "@/lib/store";

export function AppHeader() {
  const name = useFormaStore((s) => s.user?.name);
  const initial = (name?.trim()?.[0] || "F").toUpperCase();

  return (
    <header className="mb-6 flex items-center justify-between">
      <Link href="/today" className="font-display text-xl tracking-tight text-ink">
        Forma
      </Link>
      <Link
        href="/profile"
        aria-label="Профиль"
        className="flex h-9 w-9 items-center justify-center rounded-full border border-line bg-bg-elevated text-sm font-semibold text-ink-soft"
      >
        {initial}
      </Link>
    </header>
  );
}
