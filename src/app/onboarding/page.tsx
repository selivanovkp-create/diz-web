"use client";

import { Button, Chip, Screen } from "@/components/ui";
import { useFormaStore } from "@/lib/store";
import type { WhyOption } from "@/lib/types";
import { uid } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const WHY: { id: WhyOption; label: string }[] = [
  { id: "energy", label: "Энергия" },
  { id: "sleep", label: "Сон" },
  { id: "smoking", label: "Курение" },
  { id: "fitness", label: "Движение" },
  { id: "stress", label: "Стресс" },
  { id: "productivity", label: "Фокус" },
  { id: "discipline", label: "Дисциплина" },
  { id: "other", label: "Другое" },
];

const BLOCKERS = [
  "Мало сплю",
  "Телефон с утра",
  "Курю",
  "Нет движения",
  "Вечно бросаю на 3-й день",
];

type Reveal = {
  priorities: string[];
  summary: string;
  tasks: string[];
};

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
  const setCurrentState = useFormaStore((s) => s.setCurrentState);
  const setBehavior = useFormaStore((s) => s.setBehavior);
  const setConstraints = useFormaStore((s) => s.setConstraints);
  const setGoals = useFormaStore((s) => s.setGoals);
  const setMotivators = useFormaStore((s) => s.setMotivators);
  const completeOnboarding = useFormaStore((s) => s.completeOnboarding);
  const user = useFormaStore((s) => s.user);
  const lifeProfile = useFormaStore((s) => s.lifeProfile);
  const plans = useFormaStore((s) => s.plans);

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [energy, setEnergy] = useState(5);
  const [sleep, setSleep] = useState(5);
  const [blockers, setBlockers] = useState<string[]>([]);
  const [minutes, setMinutes] = useState(20);
  const [reveal, setReveal] = useState<Reveal | null>(null);

  useEffect(() => {
    if (!hydrated) return;
    if (completed && !reveal) router.replace("/today");
  }, [hydrated, completed, reveal, router]);

  if (!hydrated) {
    return (
      <div className="app-shell flex min-h-dvh items-center justify-center">
        <p className="font-display text-3xl">Forma</p>
      </div>
    );
  }

  function toggleBlocker(b: string) {
    setBlockers((prev) =>
      prev.includes(b) ? prev.filter((x) => x !== b) : [...prev, b],
    );
  }

  async function finish() {
    setBusy(true);
    setError(null);
    setWhy({ selected: why.selected });
    setCurrentState({
      energy,
      sleep,
      mood: energy,
      stress: blockers.includes("Вечно бросаю на 3-й день") ? 6 : 4,
      activity: blockers.includes("Нет движения") ? 3 : 5,
      habits: blockers.includes("Курю") ? 3 : 5,
    });
    setBehavior({
      sleepHours: sleep <= 4 ? 5.5 : sleep >= 7 ? 7.5 : 6.5,
      phoneHours: blockers.includes("Телефон с утра") ? 6 : 3,
      habitsToChange: blockers,
      whyFailed: blockers.includes("Вечно бросаю на 3-й день")
        ? "Бросаю на 3-й день"
        : "",
      triedBefore: blockers.join(", "),
    });
    setConstraints({
      minutesPerDay: minutes,
      difficulty: 1,
      preferTiny: minutes <= 20,
      avoid: [],
      limits: "",
    });
    setGoals(
      why.selected.slice(0, 2).map((w, i) => ({
        id: uid("g"),
        title: WHY.find((x) => x.id === w)?.label ?? w,
        area:
          w === "fitness"
            ? "physical"
            : w === "smoking"
              ? "habits"
              : w === "stress"
                ? "mind"
                : w === "productivity"
                  ? "productivity"
                  : w === "sleep"
                    ? "sleep"
                    : "energy",
        priority: i + 1,
      })),
    );
    setMotivators(["visible_progress", "ai_feedback"]);

    try {
      await completeOnboarding();
      const profile = useFormaStore.getState().lifeProfile;
      const plan = useFormaStore.getState().plans.at(-1);
      const label = (key?: string) =>
        profile?.areas.find((a) => a.key === key)?.label ?? key ?? "";
      setReveal({
        priorities: [
          label(profile?.priorityArea),
          label(profile?.secondaryArea),
          profile?.strategy[0] ? "Маленькие шаги каждый день" : "",
        ].filter(Boolean),
        summary:
          profile?.summary ||
          "Не нужно чинить всё сразу. Начнём с малого.",
        tasks: (plan?.tasks ?? []).slice(0, 4).map((t) => t.title),
      });
      setOnboardingStep(5);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Что-то пошло не так. План можно собрать ещё раз.",
      );
    } finally {
      setBusy(false);
    }
  }

  // silence unused after complete
  void lifeProfile;
  void plans;

  return (
    <Screen showHeader={false} className="pb-10">
      {step === 0 ? (
        <div className="flex min-h-[78dvh] flex-col justify-between pt-8">
          <div className="rise">
            <p className="text-sm font-medium tracking-wide text-muted">Forma</p>
            <h1 className="font-display mt-5 text-[2.6rem] leading-[1.05] tracking-tight">
              Скажи, чего хочешь.
              <br />
              Forma разберётся, что делать.
            </h1>
            <p className="mt-4 max-w-[30ch] text-[15px] leading-relaxed text-muted">
              Каждый день — один ясный план. Без дашбордов и десятка метрик.
            </p>
          </div>
          <div className="space-y-4">
            <input
              value={user?.name ?? ""}
              onChange={(e) => setName(e.target.value)}
              placeholder="Как тебя зовут?"
              className="w-full rounded-2xl border border-line bg-bg-elevated px-4 py-3.5 text-[16px] outline-none focus:border-ink"
            />
            <Button
              className="w-full"
              onClick={() => {
                if (!(user?.name || "").trim()) setName("Константин");
                startOnboarding();
              }}
            >
              Начать
            </Button>
          </div>
        </div>
      ) : null}

      {step === 1 ? (
        <div className="rise pt-4">
          <p className="text-sm text-muted">1 / 4 · Зачем</p>
          <h1 className="font-display mt-3 text-[2.1rem] leading-tight">
            Что хочешь изменить?
          </h1>
          <div className="mt-8 flex flex-wrap gap-2">
            {WHY.map((w) => (
              <Chip
                key={w.id}
                active={why.selected.includes(w.id)}
                onClick={() => {
                  const selected = why.selected.includes(w.id)
                    ? why.selected.filter((x) => x !== w.id)
                    : [...why.selected, w.id].slice(0, 3);
                  setWhy({ selected });
                }}
              >
                {w.label}
              </Chip>
            ))}
          </div>
          <div className="mt-10 flex gap-2">
            <Button variant="ghost" className="flex-1" onClick={() => setOnboardingStep(0)}>
              Назад
            </Button>
            <Button
              className="flex-1"
              disabled={why.selected.length === 0}
              onClick={() => setOnboardingStep(2)}
            >
              Дальше
            </Button>
          </div>
        </div>
      ) : null}

      {step === 2 ? (
        <div className="rise pt-4">
          <p className="text-sm text-muted">2 / 4 · Сейчас</p>
          <h1 className="font-display mt-3 text-[2.1rem] leading-tight">
            Как дела прямо сейчас?
          </h1>
          <div className="mt-10 space-y-8">
            <label className="block">
              <div className="mb-3 flex justify-between text-[15px]">
                <span>Энергия</span>
                <span className="text-muted">{energy}/10</span>
              </div>
              <input
                type="range"
                min={1}
                max={10}
                value={energy}
                onChange={(e) => setEnergy(Number(e.target.value))}
                className="w-full accent-[var(--accent)]"
              />
            </label>
            <label className="block">
              <div className="mb-3 flex justify-between text-[15px]">
                <span>Сон</span>
                <span className="text-muted">{sleep}/10</span>
              </div>
              <input
                type="range"
                min={1}
                max={10}
                value={sleep}
                onChange={(e) => setSleep(Number(e.target.value))}
                className="w-full accent-[var(--accent)]"
              />
            </label>
          </div>
          <div className="mt-10 flex gap-2">
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
        <div className="rise pt-4">
          <p className="text-sm text-muted">3 / 4 · Помехи</p>
          <h1 className="font-display mt-3 text-[2.1rem] leading-tight">
            Что чаще всего мешает?
          </h1>
          <div className="mt-8 flex flex-wrap gap-2">
            {BLOCKERS.map((b) => (
              <Chip
                key={b}
                active={blockers.includes(b)}
                onClick={() => toggleBlocker(b)}
              >
                {b}
              </Chip>
            ))}
          </div>
          <div className="mt-10 flex gap-2">
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
        <div className="rise pt-4">
          <p className="text-sm text-muted">4 / 4 · Реализм</p>
          <h1 className="font-display mt-3 text-[2.1rem] leading-tight">
            Сколько реально можешь в день?
          </h1>
          <div className="mt-10 grid grid-cols-3 gap-2">
            {[10, 20, 40].map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMinutes(m)}
                className={`min-h-16 rounded-2xl border text-[15px] font-medium ${
                  minutes === m
                    ? "border-ink bg-ink text-white"
                    : "border-line bg-bg-elevated text-ink-soft"
                }`}
              >
                {m} мин
              </button>
            ))}
          </div>
          <div className="mt-10 flex gap-2">
            <Button variant="ghost" className="flex-1" onClick={() => setOnboardingStep(3)}>
              Назад
            </Button>
            <Button className="flex-1" disabled={busy} onClick={() => void finish()}>
              {busy ? "Forma думает…" : "Собрать старт"}
            </Button>
          </div>
          {busy ? (
            <p className="mt-4 text-sm text-muted">
              Обычно 10–40 секунд. Не закрывай экран.
            </p>
          ) : null}
          {error ? <p className="mt-4 text-sm text-danger">{error}</p> : null}
        </div>
      ) : null}

      {step === 5 && reveal ? (
        <div className="rise pt-4">
          <p className="text-sm text-muted">С чего начнём</p>
          <h1 className="font-display mt-3 text-[2.2rem] leading-tight">
            Не надо чинить всё сразу
          </h1>
          <p className="mt-4 max-w-[34ch] text-[15px] leading-relaxed text-muted">
            {reveal.summary}
          </p>
          <ol className="mt-8 space-y-3">
            {reveal.priorities.slice(0, 3).map((p, i) => (
              <li key={p} className="text-[18px] font-medium">
                {i + 1}. {p}
              </li>
            ))}
          </ol>
          {reveal.tasks.length > 0 ? (
            <>
              <p className="mt-10 text-sm font-semibold uppercase tracking-[0.12em] text-muted">
                Первые шаги
              </p>
              <ul className="mt-3 space-y-3">
                {reveal.tasks.map((t) => (
                  <li key={t} className="text-[16px] text-ink-soft">
                    · {t}
                  </li>
                ))}
              </ul>
            </>
          ) : null}
          <Button className="mt-10 w-full" onClick={() => router.push("/today")}>
            К сегодняшнему плану
          </Button>
        </div>
      ) : null}
    </Screen>
  );
}
