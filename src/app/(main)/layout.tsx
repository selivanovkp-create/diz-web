"use client";

import { BottomNav } from "@/components/BottomNav";
import { useFormaStore } from "@/lib/store";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const hydrated = useFormaStore((s) => s.hydrated);
  const onboardingCompleted = useFormaStore((s) => s.onboardingCompleted);
  const ensureTodayPlan = useFormaStore((s) => s.ensureTodayPlan);

  useEffect(() => {
    if (!hydrated) return;
    if (!onboardingCompleted) {
      router.replace("/onboarding");
      return;
    }
    void ensureTodayPlan();
  }, [hydrated, onboardingCompleted, router, ensureTodayPlan]);

  if (!hydrated) {
    return (
      <div className="app-shell flex min-h-dvh items-center justify-center">
        <p className="font-display text-3xl">FORMA</p>
      </div>
    );
  }

  return (
    <>
      {children}
      <BottomNav />
    </>
  );
}
