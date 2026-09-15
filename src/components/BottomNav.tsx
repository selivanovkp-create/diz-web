"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { MessageSquareText, SunMedium, ChartNoAxesCombined } from "lucide-react";

const items = [
  { href: "/today", label: "Сегодня", icon: SunMedium },
  { href: "/progress", label: "Прогресс", icon: ChartNoAxesCombined },
  { href: "/coach", label: "Коуч", icon: MessageSquareText },
];

export function BottomNav() {
  const pathname = usePathname();
  return (
    <nav className="fixed bottom-0 left-1/2 z-40 w-full max-w-[430px] -translate-x-1/2 border-t border-line/80 bg-[rgba(247,247,244,0.94)] px-4 pb-[calc(0.55rem+env(safe-area-inset-bottom))] pt-2 backdrop-blur-md">
      <ul className="grid grid-cols-3 gap-1">
        {items.map((item) => {
          const active = pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={cn(
                  "flex min-h-12 flex-col items-center justify-center gap-0.5 rounded-xl px-2 py-1.5 text-[11px] font-medium tracking-wide",
                  active ? "text-ink" : "text-muted",
                )}
              >
                <Icon size={20} strokeWidth={active ? 2.2 : 1.7} />
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
