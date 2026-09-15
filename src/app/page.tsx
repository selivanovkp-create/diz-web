"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useFormaStore } from "@/lib/store";

export default function HomePage() {
  const router = useRouter();
  const hydrated = useFormaStore((s) => s.hydrated);
  const onboardingCompleted = useFormaStore((s) => s.onboardingCompleted);

  useEffect(() => {
    if (!hydrated) return;
    router.replace(onboardingCompleted ? "/today" : "/onboarding");
  }, [hydrated, onboardingCompleted, router]);

  return (
    <div className="app-shell flex min-h-dvh items-center justify-center px-6">
      <div className="text-center">
        <p className="font-display text-4xl tracking-tight">FORMA</p>
        <p className="mt-2 text-sm text-muted">Загружаю систему…</p>
      </div>
    </div>
  );
}
