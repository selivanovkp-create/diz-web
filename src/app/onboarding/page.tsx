"use client";

import { Button, Chip, Screen } from "@/components/ui";
import { useFormaStore } from "@/lib/store";
import type { LifeAreaKey, WhyOption } from "@/lib/types";
import { uid } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

const WHY: { id: WhyOption; label: string; area: LifeAreaKey }[] = [
  { id: "energy", label: "Больше энергии", area: "energy" },
  { id: "sleep", label: "Нормальный сон", area: "sleep" },
  { id: "smoking", label: "Бросить / меньше курить", area: "habits" },
  { id: "fitness", label: "Движение и тело", area: "physical" },
  { id: "stress", label: "Меньше стресса", area: "mind" },
  { id: "productivity", label: "Фокус и работа", area: "productivity" },
  { id: "discipline", label: "Дисциплина и ритм", area: "habits" },
  { id: "nutrition", label: "Питание", area: "lifestyle" },
  { id: "alcohol", label: "Алкоголь", area: "habits" },
  { id: "relationships", label: "Отношения", area: "social" },
  { id: "confidence", label: "Уверенность", area: "mind" },
  { id: "focus", label: "Концентрация", area: "productivity" },
  { id: "appearance", label: "Внешний вид", area: "lifestyle" },
  { id: "other", label: "Другое", area: "lifestyle" },
];

type ScoreKey =
  | "energy"
  | "sleep"
  | "mood"
  | "stress"
  | "activity"
  | "habits"
  | "work"
  | "nutrition"
  | "social"
  | "satisfaction"
  | "control";

/** One coherent plot pack per goal — scales, blockers, and copy stay in sync. */
const PLOT: Record<
  WhyOption,
  {
    scales: { key: ScoreKey; label: string }[];
    blockers: string[];
    goalPlaceholder: string;
    storyPlaceholder: string;
  }
> = {
  energy: {
    scales: [
      { key: "energy", label: "Энергия днём" },
      { key: "sleep", label: "Насколько высыпаешься" },
    ],
    blockers: [
      "К обеду выгораю",
      "Мало сплю",
      "Телефон с утра",
      "Нет движения",
      "Вечно бросаю на 3-й день",
      "Нет времени",
    ],
    goalPlaceholder: "Например: к обеду уже нет сил, вечером только диван…",
    storyPlaceholder:
      "Например: сплю по 5–6 часов, к 15:00 уже пустой, кофе не помогает…",
  },
  sleep: {
    scales: [
      { key: "sleep", label: "Качество сна" },
      { key: "energy", label: "Энергия после сна" },
    ],
    blockers: [
      "Поздно засыпаю",
      "Мало сплю",
      "Телефон перед сном",
      "Просыпаюсь среди ночи",
      "Вечно бросаю на 3-й день",
      "Нет времени",
    ],
    goalPlaceholder: "Например: засыпаю после часа ночи, утром разбитый…",
    storyPlaceholder:
      "Например: кручу ленту до двух, потом долго не могу уснуть, будильник в 7…",
  },
  smoking: {
    scales: [
      { key: "habits", label: "Контроль над курением" },
      { key: "stress", label: "Тяга от стресса" },
    ],
    blockers: [
      "Курю от стресса",
      "Курю по привычке",
      "Курю с кофе / после еды",
      "Окружение курит",
      "Вечно бросаю на 3-й день",
      "Нет времени",
    ],
    goalPlaceholder: "Например: хочу меньше пачки в день, особенно вечером…",
    storyPlaceholder:
      "Например: курю после каждого стресса на работе, вечером ещё сильнее тянет…",
  },
  fitness: {
    scales: [
      { key: "activity", label: "Движение в неделю" },
      { key: "energy", label: "Силы на тренировки" },
    ],
    blockers: [
      "Нет движения",
      "Сижу целый день",
      "Стыдно начинать",
      "Нет времени",
      "Вечно бросаю на 3-й день",
      "Устаю после работы",
    ],
    goalPlaceholder: "Например: хочу снова ходить в зал 2 раза в неделю…",
    storyPlaceholder:
      "Например: сижу весь день, вечером нет сил, абонемент лежит без дела…",
  },
  stress: {
    scales: [
      { key: "stress", label: "Уровень стресса" },
      { key: "mood", label: "Настроение" },
    ],
    blockers: [
      "Хаос в голове",
      "Не умею отдыхать",
      "Перегружен работой",
      "Реагирую резко",
      "Вечно бросаю на 3-й день",
      "Нет времени",
    ],
    goalPlaceholder: "Например: постоянно на взводе, сложно выдохнуть…",
    storyPlaceholder:
      "Например: мысли крутятся весь день, вечером не отпускает, срываюсь на мелочах…",
  },
  productivity: {
    scales: [
      { key: "work", label: "Фокус на работе" },
      { key: "energy", label: "Энергия к задачам" },
    ],
    blockers: [
      "Откладываю важное",
      "К обеду выгораю",
      "Хаос в голове",
      "Телефон вместо работы",
      "Вечно бросаю на 3-й день",
      "Нет времени",
    ],
    goalPlaceholder: "Например: много задач, мало сделанного к концу дня…",
    storyPlaceholder:
      "Например: открываю ноут — и сразу мессенджеры, важные дела уезжают на вечер…",
  },
  discipline: {
    scales: [
      { key: "habits", label: "Держу обещания себе" },
      { key: "work", label: "Довожу дела до конца" },
    ],
    blockers: [
      "Вечно бросаю на 3-й день",
      "Нет ритма дня",
      "Откладываю важное",
      "Телефон с утра",
      "Нет времени",
      "Хаос в голове",
    ],
    goalPlaceholder: "Например: начинаю с понедельника и срываюсь к среде…",
    storyPlaceholder:
      "Например: план на неделю красивый, к среде уже живу как раньше…",
  },
  nutrition: {
    scales: [
      { key: "nutrition", label: "Питание сейчас" },
      { key: "habits", label: "Контроль еды" },
    ],
    blockers: [
      "Ем от эмоций",
      "Перекусываю на бегу",
      "Поздно ужинаю",
      "Сладкое вечером",
      "Вечно бросаю на 3-й день",
      "Нет времени",
    ],
    goalPlaceholder: "Например: хочу есть ровнее, без вечерних срывов…",
    storyPlaceholder:
      "Например: днём почти не ем, вечером наедаюсь и чувствую вину…",
  },
  alcohol: {
    scales: [
      { key: "habits", label: "Контроль алкоголя" },
      { key: "sleep", label: "Сон после вечеров" },
    ],
    blockers: [
      "Пью по вечерам",
      "Пью от стресса",
      "Сложно отказать в компании",
      "Сон после этого плохой",
      "Вечно бросаю на 3-й день",
      "Нет времени",
    ],
    goalPlaceholder: "Например: хочу меньше пить по будням…",
    storyPlaceholder:
      "Например: после работы бокал «для расслабления», а потом уже несколько…",
  },
  relationships: {
    scales: [
      { key: "social", label: "Близость с людьми" },
      { key: "mood", label: "Настроение от общения" },
    ],
    blockers: [
      "Нет поддержки вокруг",
      "Закрываюсь в себе",
      "Мало живого общения",
      "Конфликты выматывают",
      "Вечно бросаю на 3-й день",
      "Нет времени",
    ],
    goalPlaceholder: "Например: хочу ближе к близким, меньше дистанции…",
    storyPlaceholder:
      "Например: почти не пишу первым, откладываю встречи, потом чувствую одиночество…",
  },
  confidence: {
    scales: [
      { key: "satisfaction", label: "Уверенность в себе" },
      { key: "mood", label: "Настроение" },
    ],
    blockers: [
      "Сравниваю себя с другими",
      "Боюсь выглядеть глупо",
      "Критикую себя",
      "Избегаю внимания",
      "Вечно бросаю на 3-й день",
      "Нет времени",
    ],
    goalPlaceholder: "Например: хочу спокойнее относиться к оценке других…",
    storyPlaceholder:
      "Например: сравниваю себя в соцсетях, потом опускаются руки что-то менять…",
  },
  focus: {
    scales: [
      { key: "work", label: "Концентрация" },
      { key: "stress", label: "Отвлечения / шум" },
    ],
    blockers: [
      "Телефон вместо работы",
      "Хаос в голове",
      "Откладываю важное",
      "Много вкладок сразу",
      "Вечно бросаю на 3-й день",
      "Нет времени",
    ],
    goalPlaceholder: "Например: не могу усидеть 20 минут без телефона…",
    storyPlaceholder:
      "Например: сажусь работать — через 5 минут уже в ленте или переписке…",
  },
  appearance: {
    scales: [
      { key: "satisfaction", label: "Доволен внешним видом" },
      { key: "activity", label: "Забота о теле" },
      { key: "nutrition", label: "Питание" },
    ],
    blockers: [
      "Не нравится, что вижу в зеркале",
      "Сравниваю себя с другими",
      "Нет движения",
      "Ем от эмоций",
      "Забиваю на уход",
      "Вечно бросаю на 3-й день",
      "Нет времени",
    ],
    goalPlaceholder:
      "Например: хочу лучше выглядеть и спокойнее относиться к зеркалу…",
    storyPlaceholder:
      "Например: не нравится отражение, из-за этого откладываю спорт и уход за собой…",
  },
  other: {
    scales: [
      { key: "satisfaction", label: "В целом доволен жизнью" },
      { key: "control", label: "Чувство контроля" },
    ],
    blockers: [
      "Не понимаю, с чего начать",
      "Нет времени",
      "Вечно бросаю на 3-й день",
      "Хаос в голове",
      "Нет поддержки вокруг",
    ],
    goalPlaceholder: "Например: опиши своими словами, что хочешь изменить…",
    storyPlaceholder:
      "Например: расскажи, что больше всего мешает и как это выглядит в обычном дне…",
  },
};

type Reveal = {
  priorities: string[];
  summary: string;
  tasks: string[];
};

type Scores = Record<ScoreKey, number>;

const DEFAULT_SCORES: Scores = {
  energy: 5,
  sleep: 5,
  mood: 5,
  stress: 5,
  activity: 4,
  habits: 5,
  work: 5,
  nutrition: 5,
  social: 5,
  satisfaction: 5,
  control: 5,
};

function plotGoals(selected: WhyOption[]): WhyOption[] {
  return selected.length > 0 ? selected : ["other"];
}

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
  const addJournal = useFormaStore((s) => s.addJournal);
  const completeOnboarding = useFormaStore((s) => s.completeOnboarding);
  const user = useFormaStore((s) => s.user);

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scores, setScores] = useState<Scores>(DEFAULT_SCORES);
  const [blockers, setBlockers] = useState<string[]>([]);
  const [story, setStory] = useState("");
  const [goalNote, setGoalNote] = useState("");
  const [minutes, setMinutes] = useState(20);
  const [reveal, setReveal] = useState<Reveal | null>(null);

  const selected = why.selected;
  const goals = useMemo(() => plotGoals(selected), [selected]);

  const visibleState = useMemo(() => {
    const seen = new Set<ScoreKey>();
    const fields: { key: ScoreKey; label: string }[] = [];
    for (const goal of goals) {
      for (const field of PLOT[goal].scales) {
        if (seen.has(field.key)) continue;
        seen.add(field.key);
        fields.push(field);
        if (fields.length >= 5) return fields;
      }
    }
    return fields;
  }, [goals]);

  const blockerOptions = useMemo(() => {
    const labels: string[] = [];
    for (const goal of goals) {
      for (const b of PLOT[goal].blockers) {
        if (!labels.includes(b)) labels.push(b);
      }
    }
    return labels.slice(0, 8);
  }, [goals]);

  const goalPlaceholder = useMemo(() => {
    if (selected.length === 0) {
      return "Например: опиши, куда хочешь сдвинуться…";
    }
    return PLOT[selected[0]].goalPlaceholder;
  }, [selected]);

  const storyPlaceholder = useMemo(() => {
    return PLOT[goals[0]].storyPlaceholder;
  }, [goals]);

  const selectedLabels = selected
    .map((id) => WHY.find((w) => w.id === id)?.label)
    .filter(Boolean)
    .join(", ");

  const focusPhrase = selectedLabels || "твой сдвиг";

  useEffect(() => {
    if (!hydrated) return;
    if (completed && !reveal) router.replace("/today");
  }, [hydrated, completed, reveal, router]);

  // Drop blockers that no longer match when goals change.
  useEffect(() => {
    setBlockers((prev) => prev.filter((b) => blockerOptions.includes(b)));
  }, [blockerOptions]);

  if (!hydrated) {
    return (
      <div className="app-shell flex min-h-dvh items-center justify-center">
        <p className="font-display text-3xl">Forma</p>
      </div>
    );
  }

  function toggleWhy(id: WhyOption) {
    const next = selected.includes(id)
      ? selected.filter((x) => x !== id)
      : [...selected, id].slice(0, 4);
    setWhy({ selected: next, custom: goalNote || why.custom });
  }

  function toggleBlocker(b: string) {
    setBlockers((prev) =>
      prev.includes(b) ? prev.filter((x) => x !== b) : [...prev, b],
    );
  }

  async function finish() {
    setBusy(true);
    setError(null);

    const freeText = [goalNote.trim(), story.trim()].filter(Boolean).join("\n\n");

    setWhy({
      selected,
      custom: freeText || undefined,
    });
    setCurrentState({
      energy: scores.energy,
      sleep: scores.sleep,
      mood: scores.mood,
      stress: scores.stress,
      activity: scores.activity,
      habits: scores.habits,
      work: scores.work,
      nutrition: scores.nutrition,
      social: scores.social,
      control: scores.control,
      satisfaction: scores.satisfaction,
    });
    setBehavior({
      sleepHours: scores.sleep <= 3 ? 5 : scores.sleep <= 5 ? 6 : scores.sleep <= 7 ? 7 : 8,
      sleepStable: scores.sleep,
      phoneHours:
        blockers.includes("Телефон с утра") ||
        blockers.includes("Телефон перед сном") ||
        blockers.includes("Телефон вместо работы")
          ? 6
          : 3,
      movementMinutes:
        blockers.includes("Нет движения") || blockers.includes("Сижу целый день")
          ? 10
          : scores.activity * 5,
      habitsToChange: blockers,
      triedBefore: blockers.join(", "),
      whyFailed: freeText || blockers.join("; "),
      quitPattern: blockers.includes("Вечно бросаю на 3-й день")
        ? "Бросаю на 3-й день"
        : "",
      discipline: selected.includes("discipline") ? 3 : 5,
    });
    setConstraints({
      minutesPerDay: minutes,
      difficulty: 1,
      preferTiny: minutes <= 20,
      avoid: [],
      limits: freeText.slice(0, 400),
    });
    setGoals(
      selected.slice(0, 3).map((w, i) => {
        const meta = WHY.find((x) => x.id === w);
        return {
          id: uid("g"),
          title: meta?.label ?? w,
          area: meta?.area ?? "general",
          priority: i + 1,
        };
      }),
    );
    setMotivators(["visible_progress", "ai_feedback"]);
    if (freeText) {
      addJournal(`Онбординг · своими словами:\n${freeText}`);
    }

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
          profile?.strategy[0] ?? "",
        ].filter(Boolean),
        summary:
          profile?.summary ||
          `Не нужно чинить всё сразу. Начнём с того, что сильнее всего мешает по направлению «${focusPhrase}».`,
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

  return (
    <Screen showHeader={false} className="pb-10">
      {step === 0 ? (
        <div className="flex min-h-[78dvh] flex-col justify-between pt-8">
          <div className="rise">
            <p className="text-sm font-medium tracking-wide text-muted">Forma</p>
            <h1 className="font-display mt-5 text-[2.5rem] leading-[1.05] tracking-tight">
              Сначала познакомимся.
              <br />
              Потом разберём, что менять.
            </h1>
            <p className="mt-4 max-w-[32ch] text-[15px] leading-relaxed text-muted">
              Короткий старт: цели → как сейчас → что мешает → сколько времени.
              Forma соберёт первый план ровно под твой выбор.
            </p>
          </div>
          <div className="space-y-4">
            <label className="block">
              <span className="mb-2 block text-sm text-ink-soft">Как тебя зовут?</span>
              <input
                value={user?.name ?? ""}
                onChange={(e) => setName(e.target.value)}
                placeholder="Костя"
                className="w-full rounded-2xl border border-line bg-bg-elevated px-4 py-3.5 text-[16px] outline-none focus:border-ink"
              />
            </label>
            <Button
              className="w-full"
              onClick={() => {
                if (!(user?.name || "").trim()) setName("Костя");
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
          <p className="text-sm text-muted">1 / 4 · Цель</p>
          <h1 className="font-display mt-3 text-[2.05rem] leading-tight">
            Куда хочешь сдвинуться?
          </h1>
          <p className="mt-2 text-[15px] text-muted">
            Выбери до 4 направлений. Шкалы, помехи и примеры дальше будут только
            про них.
          </p>
          <div className="mt-7 flex flex-wrap gap-2">
            {WHY.map((w) => (
              <Chip
                key={w.id}
                active={selected.includes(w.id)}
                onClick={() => toggleWhy(w.id)}
              >
                {w.label}
              </Chip>
            ))}
          </div>
          <label className="mt-8 block">
            <span className="mb-2 block text-sm text-ink-soft">
              Своими словами — опционально
            </span>
            <textarea
              value={goalNote}
              onChange={(e) => {
                setGoalNote(e.target.value);
                setWhy({ selected, custom: e.target.value });
              }}
              rows={3}
              placeholder={goalPlaceholder}
              className="w-full resize-none rounded-2xl border border-line bg-bg-elevated px-4 py-3 text-[15px] outline-none focus:border-ink"
            />
          </label>
          <div className="mt-8 flex gap-2">
            <Button variant="ghost" className="flex-1" onClick={() => setOnboardingStep(0)}>
              Назад
            </Button>
            <Button
              className="flex-1"
              disabled={selected.length === 0 && !goalNote.trim()}
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
          <h1 className="font-display mt-3 text-[2.05rem] leading-tight">
            Как с этим сейчас?
          </h1>
          <p className="mt-2 text-[15px] text-muted">
            {selectedLabels
              ? `Оцени только то, что связано с «${selectedLabels}».`
              : "Оцени ключевые шкалы — потом уточним помехи."}
          </p>
          <div className="mt-8 space-y-7">
            {visibleState.map((f) => (
              <label key={f.key} className="block">
                <div className="mb-3 flex justify-between text-[15px]">
                  <span>{f.label}</span>
                  <span className="tabular-nums text-muted">{scores[f.key]}/10</span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={10}
                  value={scores[f.key]}
                  onChange={(e) =>
                    setScores((s) => ({ ...s, [f.key]: Number(e.target.value) }))
                  }
                  className="w-full accent-[var(--accent)]"
                />
              </label>
            ))}
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
          <h1 className="font-display mt-3 text-[2.05rem] leading-tight">
            Что мешает сдвинуться?
          </h1>
          <p className="mt-2 text-[15px] text-muted">
            {selectedLabels
              ? `Помехи именно для «${selectedLabels}». Свой текст тоже про это.`
              : "Отметь типичные помехи. Можно добавить свой текст."}
          </p>
          <div className="mt-7 flex flex-wrap gap-2">
            {blockerOptions.map((b) => (
              <Chip
                key={b}
                active={blockers.includes(b)}
                onClick={() => toggleBlocker(b)}
              >
                {b}
              </Chip>
            ))}
          </div>
          <label className="mt-8 block">
            <span className="mb-2 block text-sm font-medium text-ink">
              Свободная форма · по желанию
            </span>
            <p className="mb-3 text-sm text-muted">
              {selectedLabels
                ? `Расскажи, как «${selectedLabels}» выглядит в обычном дне: срывы, триггеры, контекст.`
                : "Расскажи всё, что важно: проблемы, срывы, контекст. Forma разберёт."}
            </p>
            <textarea
              value={story}
              onChange={(e) => setStory(e.target.value)}
              rows={5}
              placeholder={storyPlaceholder}
              className="w-full resize-none rounded-2xl border border-line bg-bg-elevated px-4 py-3 text-[15px] outline-none focus:border-ink"
            />
          </label>
          <div className="mt-8 flex gap-2">
            <Button variant="ghost" className="flex-1" onClick={() => setOnboardingStep(2)}>
              Назад
            </Button>
            <Button
              className="flex-1"
              disabled={blockers.length === 0 && !story.trim()}
              onClick={() => setOnboardingStep(4)}
            >
              Дальше
            </Button>
          </div>
        </div>
      ) : null}

      {step === 4 ? (
        <div className="rise pt-4">
          <p className="text-sm text-muted">4 / 4 · Реализм</p>
          <h1 className="font-display mt-3 text-[2.05rem] leading-tight">
            Сколько времени реально есть в день?
          </h1>
          <p className="mt-2 text-[15px] text-muted">
            {selectedLabels
              ? `На сдвиг по «${selectedLabels}» — Forma подгонит размер плана под этот лимит.`
              : "Forma подгонит размер плана под этот лимит — не наоборот."}
          </p>
          <div className="mt-8 grid grid-cols-3 gap-2">
            {[10, 15, 20, 30, 45, 60].map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMinutes(m)}
                className={`min-h-14 rounded-2xl border text-[15px] font-medium ${
                  minutes === m
                    ? "border-ink bg-ink text-white"
                    : "border-line bg-bg-elevated text-ink-soft"
                }`}
              >
                {m} мин
              </button>
            ))}
          </div>
          {(story.trim() || goalNote.trim()) && (
            <p className="mt-6 rounded-2xl bg-accent-soft px-4 py-3 text-sm text-ink-soft">
              Учтём твой свободный текст про «{focusPhrase}» при сборке старта.
            </p>
          )}
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
          <h1 className="font-display mt-3 text-[2.15rem] leading-tight">
            Не надо чинить всё сразу
          </h1>
          <p className="mt-4 max-w-[34ch] text-[15px] leading-relaxed text-muted">
            {reveal.summary}
          </p>
          <ol className="mt-8 space-y-3">
            {reveal.priorities.slice(0, 3).map((p, i) => (
              <li key={`${p}-${i}`} className="text-[18px] font-medium">
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
