"use client";

import { Button, Chip, Screen, SectionTitle, SliderField } from "@/components/ui";
import { useFormaStore } from "@/lib/store";
import type { Motivator, WhyOption } from "@/lib/types";
import { uid } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const WHY: { id: WhyOption; label: string }[] = [
  { id: "energy", label: "Больше энергии" },
  { id: "sleep", label: "Сон" },
  { id: "fitness", label: "Физическая форма" },
  { id: "nutrition", label: "Питание" },
  { id: "smoking", label: "Курение" },
  { id: "alcohol", label: "Алкоголь" },
  { id: "stress", label: "Стресс" },
  { id: "productivity", label: "Продуктивность" },
  { id: "discipline", label: "Дисциплина" },
  { id: "relationships", label: "Отношения" },
  { id: "confidence", label: "Уверенность" },
  { id: "appearance", label: "Внешний вид" },
  { id: "focus", label: "Концентрация" },
  { id: "other", label: "Другое" },
];

const MOTIVATORS: { id: Motivator; label: string }[] = [
  { id: "visible_progress", label: "Видимый прогресс" },
  { id: "streaks", label: "Momentum / streaks" },
  { id: "achievements", label: "Achievements" },
  { id: "statistics", label: "Статистика" },
  { id: "ai_feedback", label: "AI feedback" },
  { id: "narrative", label: "История изменений" },
  { id: "competition", label: "Соревнование" },
  { id: "rewards", label: "Награды" },
];

export default function OnboardingPage() {
  const router = useRouter();
  const hydrated = useFormaStore((s) => s.hydrated);
  const completed = useFormaStore((s) => s.onboardingCompleted);
  const step = useFormaStore((s) => s.onboardingStep);
  const startOnboarding = useFormaStore((s) => s.startOnboarding);
  const setOnboardingStep = useFormaStore((s) => s.setOnboardingStep);
  const setName = useFormaStore((s) => s.setName);
  const setWhy = useFormaStore((s) => s.setWhy);
  const why = useFormaStore((s) => s.why);
  const currentState = useFormaStore((s) => s.currentState);
  const setCurrentState = useFormaStore((s) => s.setCurrentState);
  const behavior = useFormaStore((s) => s.behavior);
  const setBehavior = useFormaStore((s) => s.setBehavior);
  const constraints = useFormaStore((s) => s.constraints);
  const setConstraints = useFormaStore((s) => s.setConstraints);
  const goals = useFormaStore((s) => s.goals);
  const setGoals = useFormaStore((s) => s.setGoals);
  const motivators = useFormaStore((s) => s.motivators);
  const setMotivators = useFormaStore((s) => s.setMotivators);
  const completeOnboarding = useFormaStore((s) => s.completeOnboarding);
  const user = useFormaStore((s) => s.user);
  const [busy, setBusy] = useState(false);
  const [goalText, setGoalText] = useState("");
  const [customWhy, setCustomWhy] = useState("");

  useEffect(() => {
    if (!hydrated) return;
    if (completed) router.replace("/today");
  }, [hydrated, completed, router]);

  if (!hydrated) {
    return (
      <div className="app-shell flex min-h-dvh items-center justify-center">
        <p className="font-display text-3xl">FORMA</p>
      </div>
    );
  }

  async function finish() {
    setBusy(true);
    await completeOnboarding();
    setBusy(false);
    router.push("/today");
  }

  return (
    <Screen className="pb-10">
      {step === 0 ? (
        <div className="flex min-h-[80dvh] flex-col justify-between">
          <div className="rise pt-10">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted">
              FORMA
            </p>
            <h1 className="font-display mt-4 text-[2.6rem] leading-[1.05] tracking-tight">
              Become better,
              <br />
              systematically.
            </h1>
            <p className="mt-4 max-w-[32ch] text-sm leading-relaxed text-muted">
              Не habit tracker. Система: понять, что мешает → выбрать приоритет →
              делать маленькие шаги → адаптироваться.
            </p>
          </div>
          <div className="rise rise-delay-2 space-y-3">
            <label className="block">
              <span className="mb-2 block text-sm text-ink-soft">Как тебя зовут?</span>
              <input
                value={user?.name ?? ""}
                onChange={(e) => setName(e.target.value)}
                placeholder="Konstantin"
                className="w-full rounded-2xl border border-line bg-bg-elevated px-4 py-3 text-base outline-none focus:border-accent"
              />
            </label>
            <Button
              className="w-full"
              onClick={() => {
                if (!user?.name) setName("Konstantin");
                startOnboarding();
              }}
            >
              Начать
            </Button>
          </div>
        </div>
      ) : null}

      {step === 1 ? (
        <div className="rise">
          <SectionTitle
            eyebrow="Stage 1"
            title="Что хочешь изменить?"
            subtitle="Можно несколько. Потом сузим."
          />
          <div className="flex flex-wrap gap-2">
            {WHY.map((w) => {
              const active = why.selected.includes(w.id);
              return (
                <Chip
                  key={w.id}
                  active={active}
                  onClick={() => {
                    const selected = active
                      ? why.selected.filter((x) => x !== w.id)
                      : [...why.selected, w.id];
                    setWhy({ ...why, selected });
                  }}
                >
                  {w.label}
                </Chip>
              );
            })}
          </div>
          <input
            className="mt-4 w-full rounded-2xl border border-line bg-bg-elevated px-4 py-3 text-sm outline-none focus:border-accent"
            placeholder="Своими словами…"
            value={customWhy}
            onChange={(e) => {
              setCustomWhy(e.target.value);
              setWhy({ ...why, custom: e.target.value });
            }}
          />
          <Button
            className="mt-6 w-full"
            disabled={!why.selected.length && !customWhy}
            onClick={() => setOnboardingStep(2)}
          >
            Дальше
          </Button>
        </div>
      ) : null}

      {step === 2 ? (
        <div className="rise">
          <SectionTitle
            eyebrow="Stage 2"
            title="Как сейчас"
            subtitle="Честно. Это не оценка, а точка отсчёта."
          />
          <div className="card space-y-5 p-4">
            {(
              [
                ["sleep", "Сон"],
                ["energy", "Энергия"],
                ["mood", "Настроение"],
                ["stress", "Стресс"],
                ["activity", "Движение"],
                ["nutrition", "Питание"],
                ["habits", "Контроль привычек"],
                ["work", "Работа / учёба"],
                ["social", "Социальная жизнь"],
                ["control", "Ощущение контроля"],
                ["satisfaction", "Удовлетворённость"],
              ] as const
            ).map(([key, label]) => (
              <SliderField
                key={key}
                label={label}
                value={currentState[key]}
                onChange={(v) => setCurrentState({ [key]: v })}
              />
            ))}
          </div>
          <div className="mt-5 flex gap-2">
            <Button variant="ghost" className="flex-1" onClick={() => setOnboardingStep(1)}>
              Назад
            </Button>
            <Button className="flex-1" onClick={() => setOnboardingStep(3)}>
              Дальше
            </Button>
          </div>
        </div>
      ) : null}

      {step === 3 ? (
        <div className="rise">
          <SectionTitle eyebrow="Stage 3" title="Поведение" subtitle="Как устроена обычная неделя." />
          <div className="card space-y-5 p-4">
            <SliderField
              label={`Сон, часов: ${behavior.sleepHours}`}
              value={behavior.sleepHours}
              min={4}
              max={10}
              onChange={(v) => setBehavior({ sleepHours: v })}
            />
            <SliderField
              label="Стабильность режима"
              value={behavior.sleepStable}
              onChange={(v) => setBehavior({ sleepStable: v })}
            />
            <SliderField
              label={`Телефон, часов/день: ${behavior.phoneHours}`}
              value={behavior.phoneHours}
              min={1}
              max={12}
              onChange={(v) => setBehavior({ phoneHours: v })}
            />
            <SliderField
              label={`Движение, минут: ${behavior.movementMinutes}`}
              value={behavior.movementMinutes}
              min={0}
              max={120}
              onChange={(v) => setBehavior({ movementMinutes: v })}
            />
            <SliderField
              label="Дисциплина"
              value={behavior.discipline}
              onChange={(v) => setBehavior({ discipline: v })}
            />
            <label className="block text-sm">
              <span className="mb-2 block text-ink-soft">Что уже пробовал?</span>
              <textarea
                className="w-full rounded-xl border border-line bg-bg px-3 py-2 outline-none focus:border-accent"
                rows={2}
                value={behavior.triedBefore}
                onChange={(e) => setBehavior({ triedBefore: e.target.value })}
              />
            </label>
            <label className="block text-sm">
              <span className="mb-2 block text-ink-soft">Почему обычно бросаешь?</span>
              <textarea
                className="w-full rounded-xl border border-line bg-bg px-3 py-2 outline-none focus:border-accent"
                rows={2}
                value={behavior.whyFailed}
                onChange={(e) => setBehavior({ whyFailed: e.target.value })}
              />
            </label>
          </div>
          <div className="mt-5 flex gap-2">
            <Button variant="ghost" className="flex-1" onClick={() => setOnboardingStep(2)}>
              Назад
            </Button>
            <Button className="flex-1" onClick={() => setOnboardingStep(4)}>
              Дальше
            </Button>
          </div>
        </div>
      ) : null}

      {step === 4 ? (
        <div className="rise">
          <SectionTitle
            eyebrow="Stage 4"
            title="Ограничения"
            subtitle="Реализм важнее амбиций."
          />
          <div className="card space-y-5 p-4">
            <SliderField
              label={`Минут в день: ${constraints.minutesPerDay}`}
              value={constraints.minutesPerDay}
              min={5}
              max={90}
              onChange={(v) => setConstraints({ minutesPerDay: v })}
            />
            <div>
              <p className="mb-2 text-sm text-ink-soft">Сложность старта</p>
              <div className="flex gap-2">
                {([1, 2, 3] as const).map((d) => (
                  <Chip
                    key={d}
                    active={constraints.difficulty === d}
                    onClick={() => setConstraints({ difficulty: d })}
                  >
                    {d === 1 ? "Лёгкий" : d === 2 ? "Средний" : "Плотный"}
                  </Chip>
                ))}
              </div>
            </div>
            <Chip
              active={constraints.preferTiny}
              onClick={() => setConstraints({ preferTiny: !constraints.preferTiny })}
            >
              Предпочитаю крошечные ежедневные действия
            </Chip>
            <label className="block text-sm">
              <span className="mb-2 block text-ink-soft">Чего категорически не хочу</span>
              <input
                className="w-full rounded-xl border border-line bg-bg px-3 py-2 outline-none focus:border-accent"
                placeholder="Бег, медитация, трекер калорий…"
                value={constraints.avoid.join(", ")}
                onChange={(e) =>
                  setConstraints({
                    avoid: e.target.value
                      .split(",")
                      .map((x) => x.trim())
                      .filter(Boolean),
                  })
                }
              />
            </label>
          </div>
          <div className="mt-5 flex gap-2">
            <Button variant="ghost" className="flex-1" onClick={() => setOnboardingStep(3)}>
              Назад
            </Button>
            <Button className="flex-1" onClick={() => setOnboardingStep(5)}>
              Дальше
            </Button>
          </div>
        </div>
      ) : null}

      {step === 5 ? (
        <div className="rise">
          <SectionTitle
            eyebrow="Stage 5"
            title="Цели"
            subtitle="Не обязательно менять всё сразу. Выберем то, что даст эффект сейчас."
          />
          <div className="card p-4">
            <div className="flex gap-2">
              <input
                className="flex-1 rounded-xl border border-line bg-bg px-3 py-2 text-sm outline-none focus:border-accent"
                placeholder="Например: стабильный сон"
                value={goalText}
                onChange={(e) => setGoalText(e.target.value)}
              />
              <Button
                variant="soft"
                onClick={() => {
                  if (!goalText.trim()) return;
                  setGoals([
                    ...goals,
                    {
                      id: uid("goal"),
                      title: goalText.trim(),
                      area: "general",
                      priority: goals.length + 1,
                    },
                  ]);
                  setGoalText("");
                }}
              >
                Add
              </Button>
            </div>
            <ul className="mt-4 space-y-2">
              {goals.map((g) => (
                <li key={g.id} className="rounded-xl bg-bg px-3 py-2 text-sm">
                  {g.title}
                </li>
              ))}
            </ul>
          </div>
          <p className="mt-5 text-sm text-muted">Что тебя мотивирует?</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {MOTIVATORS.map((m) => (
              <Chip
                key={m.id}
                active={motivators.includes(m.id)}
                onClick={() => {
                  setMotivators(
                    motivators.includes(m.id)
                      ? motivators.filter((x) => x !== m.id)
                      : [...motivators, m.id],
                  );
                }}
              >
                {m.label}
              </Chip>
            ))}
          </div>
          <div className="mt-6 flex gap-2">
            <Button variant="ghost" className="flex-1" onClick={() => setOnboardingStep(4)}>
              Назад
            </Button>
            <Button className="flex-1" disabled={busy} onClick={() => void finish()}>
              {busy ? "Собираю профиль…" : "Собрать Personal State"}
            </Button>
          </div>
        </div>
      ) : null}
    </Screen>
  );
}
