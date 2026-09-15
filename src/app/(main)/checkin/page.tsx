"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

/** Check-in removed — checklist drives the loop. */
export default function CheckInRedirectPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/today");
  }, [router]);
  return (
    <div className="app-shell flex min-h-dvh items-center justify-center">
      <p className="text-sm text-muted">Переходим к плану…</p>
    </div>
  );
}
