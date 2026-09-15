"use client";

import { ConfirmDialog } from "@/components/ConfirmDialog";
import { Button, Screen } from "@/components/ui";
import { useFormaStore } from "@/lib/store";
import Link from "next/link";
import { useEffect, useState } from "react";
import type { FocusTrack } from "@/lib/types";

export default function ProfilePage() {
  const user = useFormaStore((s) => s.user);
  const tracks = useFormaStore((s) => s.tracks);
  const activeTrackId = useFormaStore((s) => s.activeTrackId);
  const setActiveTrack = useFormaStore((s) => s.setActiveTrack);
  const removeTrack = useFormaStore((s) => s.removeTrack);
  const startAddTrack = useFormaStore((s) => s.startAddTrack);
  const lifeProfile = useFormaStore((s) => s.lifeProfile);
  const subscription = useFormaStore((s) => s.subscription);
  const unlockPremium = useFormaStore((s) => s.unlockPremium);
  const cancelPremium = useFormaStore((s) => s.cancelPremium);
  const resetAll = useFormaStore((s) => s.resetAll);
  const [aiStatus, setAiStatus] = useState("…");
  const [pendingDelete, setPendingDelete] = useState<FocusTrack | null>(null);
  const [resetOpen, setResetOpen] = useState(false);

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
      <p className="mt-2 text-[15px] text-muted">Темы, настройки и аккаунт</p>

      <div className="mt-10 space-y-8">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.12em] text-muted">
            Темы
          </p>
          {tracks.length > 0 ? (
            <ul className="mt-3 space-y-3">
              {tracks.map((t) => (
                <li
                  key={t.id}
                  className="flex items-center justify-between gap-3 rounded-2xl border border-line bg-bg-elevated px-4 py-3"
                >
                  <button
                    type="button"
                    className="min-w-0 flex-1 text-left"
                    onClick={() => setActiveTrack(t.id)}
                  >
                    <p className="text-[16px] font-medium">
                      {t.label}
                      {t.id === activeTrackId ? (
                        <span className="ml-2 text-xs font-normal text-accent">
                          сейчас
                        </span>
                      ) : null}
                    </p>
                    <p className="mt-0.5 truncate text-sm text-muted">
                      {t.lifeProfile?.summary?.slice(0, 80) ||
                        "Свой чеклист и прогресс"}
                    </p>
                  </button>
                  <button
                    type="button"
                    className="shrink-0 text-xs text-danger underline-offset-2 hover:underline"
                    onClick={() => setPendingDelete(t)}
                  >
                    Удалить
                  </button>
                </li>
              ))}
            </ul>
          ) : lifeProfile ? (
            <p className="mt-3 text-[15px] text-ink-soft">{lifeProfile.summary}</p>
          ) : (
            <p className="mt-3 text-[15px] text-muted">Пройди онбординг.</p>
          )}
          <Button
            variant="soft"
            className="mt-4 w-full"
            onClick={() => {
              startAddTrack();
              window.location.href = "/onboarding?new=1";
            }}
          >
            + Добавить тему
          </Button>
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

        <Button variant="danger" className="w-full" onClick={() => setResetOpen(true)}>
          Сбросить данные
        </Button>
      </div>

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title={`Удалить «${pendingDelete?.label ?? "тему"}»?`}
        body={
          tracks.length <= 1
            ? "Это последняя тема. Пропадут план и прогресс. Дальше — новый онбординг."
            : "План и прогресс по этой теме удалятся. Остальные темы останутся."
        }
        confirmLabel="Удалить"
        cancelLabel="Оставить"
        onCancel={() => setPendingDelete(null)}
        onConfirm={() => {
          if (!pendingDelete) return;
          const id = pendingDelete.id;
          setPendingDelete(null);
          removeTrack(id);
          if (useFormaStore.getState().tracks.length === 0) {
            window.location.href = "/onboarding";
          }
        }}
      />

      <ConfirmDialog
        open={resetOpen}
        title="Сбросить все данные?"
        body="Удалятся темы, планы и прогресс. Действие необратимо."
        confirmLabel="Сбросить"
        cancelLabel="Отмена"
        onCancel={() => setResetOpen(false)}
        onConfirm={() => {
          setResetOpen(false);
          resetAll();
          window.location.href = "/onboarding";
        }}
      />
    </Screen>
  );
}
