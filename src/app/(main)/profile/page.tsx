"use client";

import { Button, Screen } from "@/components/ui";
import { useFormaStore } from "@/lib/store";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function ProfilePage() {
  const user = useFormaStore((s) => s.user);
  const lifeProfile = useFormaStore((s) => s.lifeProfile);
  const subscription = useFormaStore((s) => s.subscription);
  const unlockPremium = useFormaStore((s) => s.unlockPremium);
  const cancelPremium = useFormaStore((s) => s.cancelPremium);
  const resetAll = useFormaStore((s) => s.resetAll);
  const [aiStatus, setAiStatus] = useState("…");

  useEffect(() => {
    const base = (process.env.NEXT_PUBLIC_AI_API_BASE || "").replace(/\/$/, "");
    fetch(`${base}/api/ai`)
      .then((r) => r.json())
      .then((d) => {
        setAiStatus(
          d.provider === "timeweb-deepseek" ? "Подключён" : "Локальный режим",
        );
      })
      .catch(() => setAiStatus("Недоступен"));
  }, []);

  return (
    <Screen showHeader={false}>
      <Link href="/today" className="text-sm text-muted">
        ← Назад
      </Link>
      <h1 className="font-display mt-4 text-[2.2rem] tracking-tight">
        {user?.name ?? "Профиль"}
      </h1>
      <p className="mt-2 text-[15px] text-muted">Настройки и аккаунт</p>

      <div className="mt-10 space-y-8">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.12em] text-muted">
            С чего начинаем
          </p>
          {lifeProfile ? (
            <ul className="mt-3 space-y-2">
              <li className="text-[17px] font-medium">
                1. {lifeProfile.areas.find((a) => a.key === lifeProfile.priorityArea)?.label}
              </li>
              {lifeProfile.secondaryArea ? (
                <li className="text-[17px] font-medium">
                  2.{" "}
                  {
                    lifeProfile.areas.find((a) => a.key === lifeProfile.secondaryArea)
                      ?.label
                  }
                </li>
              ) : null}
              {lifeProfile.strategy[0] ? (
                <li className="mt-3 max-w-[34ch] text-[15px] text-ink-soft">
                  {lifeProfile.strategy[0]}
                </li>
              ) : null}
            </ul>
          ) : (
            <p className="mt-3 text-[15px] text-muted">Пройди онбординг.</p>
          )}
        </div>

        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.12em] text-muted">
            Подписка
          </p>
          <p className="mt-2 text-[17px] font-medium">
            {subscription.plan === "premium" ? "Premium" : "Бесплатный"}
          </p>
          {subscription.plan === "free" ? (
            <Button className="mt-3 w-full" onClick={unlockPremium}>
              Включить Premium
            </Button>
          ) : (
            <Button variant="ghost" className="mt-3 w-full" onClick={cancelPremium}>
              Отменить Premium
            </Button>
          )}
        </div>

        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.12em] text-muted">
            Сервис
          </p>
          <p className="mt-2 text-[15px] text-ink-soft">AI: {aiStatus}</p>
        </div>

        <Button
          variant="danger"
          className="w-full"
          onClick={() => {
            if (confirm("Удалить все локальные данные и начать заново?")) {
              resetAll();
              window.location.href = "/onboarding";
            }
          }}
        >
          Сбросить данные
        </Button>
      </div>
    </Screen>
  );
}
