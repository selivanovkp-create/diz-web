"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** Weekly merged into Progress — keep route for old links. */
export default function WeeklyRedirectPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/progress");
  }, [router]);
  return (
    <div className="app-shell flex min-h-dvh items-center justify-center">
      <p className="text-sm text-muted">Открываю прогресс…</p>
    </div>
  );
}
