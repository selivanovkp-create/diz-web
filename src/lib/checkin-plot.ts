import type { CheckInData, WhyOption } from "@/lib/types";

export type SignalLevel = "low" | "ok" | "high";

type FocusField = keyof Omit<CheckInData, "date" | "note">;

/** Daily check-in plot — tied to the same goals as onboarding. */
export const CHECKIN_BY_WHY: Record<
  WhyOption,
  {
    label: string;
    question: string;
    /** Which stored field carries the focus signal. */
    field: FocusField;
    low: string;
    ok: string;
    high: string;
    tags: string[];
    notePlaceholder: string;
  }
> = {
  energy: {
    label: "Энергия",
    question: "Как с энергией сегодня?",
    field: "energy",
    low: "Мало",
    ok: "Норм",
    high: "Много",
    tags: ["К обеду выгораю", "Не выспался", "Нет сил на задачи"],
    notePlaceholder: "Например: к полудню уже пустой…",
  },
  sleep: {
    label: "Сон",
    question: "Как спал?",
    field: "sleep",
    low: "Плохо",
    ok: "Норм",
    high: "Хорошо",
    tags: ["Поздно лёг", "Просыпался", "Телефон перед сном"],
    notePlaceholder: "Например: заснул после часа, утром разбитый…",
  },
  smoking: {
    label: "Курение",
    question: "Как с тягой сегодня?",
    field: "habits",
    low: "Сильная",
    ok: "Терпимо",
    high: "Слабая",
    tags: ["Хочу курить", "Курил от стресса", "Держусь"],
    notePlaceholder: "Например: после созвона очень тянет…",
  },
  fitness: {
    label: "Движение",
    question: "Как с движением / телом?",
    field: "activity",
    low: "Застой",
    ok: "Норм",
    high: "В тонусе",
    tags: ["Сидел весь день", "Болит тело", "Хочу подвигаться"],
    notePlaceholder: "Например: весь день за столом, вечером тяжело…",
  },
  stress: {
    label: "Стресс",
    question: "Какой уровень стресса?",
    field: "stress",
    // inverted: low stress = high wellbeing for display mapping handled in save
    low: "Высокий",
    ok: "Средний",
    high: "Низкий",
    tags: ["Хаос в голове", "Перегруз", "Спокойнее обычного"],
    notePlaceholder: "Например: мысли не отпускают с утра…",
  },
  productivity: {
    label: "Фокус на работе",
    question: "Как с фокусом на делах?",
    field: "focus",
    low: "Плыву",
    ok: "Норм",
    high: "Собран",
    tags: ["Откладываю", "Много отвлечений", "Зашёл в поток"],
    notePlaceholder: "Например: открыл ноут — и сразу мессенджеры…",
  },
  discipline: {
    label: "Дисциплина",
    question: "Держишь ритм сегодня?",
    field: "habits",
    low: "Срываюсь",
    ok: "Держусь",
    high: "Стабильно",
    tags: ["Хочу бросить", "Нет ритма", "Иду по плану"],
    notePlaceholder: "Например: утром сорвался с режима…",
  },
  nutrition: {
    label: "Питание",
    question: "Как с питанием сегодня?",
    field: "habits",
    low: "Срыв",
    ok: "Норм",
    high: "Ровно",
    tags: ["Ем от эмоций", "Пропустил еду", "Ел спокойно"],
    notePlaceholder: "Например: днём почти не ел, вечером наелся…",
  },
  alcohol: {
    label: "Алкоголь",
    question: "Как с контролем сегодня?",
    field: "habits",
    low: "Тянет",
    ok: "Норм",
    high: "Спокоен",
    tags: ["Хочется выпить", "Пьют вокруг", "Держусь"],
    notePlaceholder: "Например: после работы сильнее тянет…",
  },
  relationships: {
    label: "Отношения",
    question: "Как с людьми сегодня?",
    field: "mood",
    low: "Тяжело",
    ok: "Норм",
    high: "Тепло",
    tags: ["Одиноко", "Конфликт", "Было живое общение"],
    notePlaceholder: "Например: ни с кем не говорил, тяжеловато…",
  },
  confidence: {
    label: "Уверенность",
    question: "Как с уверенностью?",
    field: "control",
    low: "Проседает",
    ok: "Норм",
    high: "Ровнее",
    tags: ["Сравниваю себя", "Стыдно", "Спокойнее обычного"],
    notePlaceholder: "Например: после ленты в соцсетях опустились руки…",
  },
  focus: {
    label: "Концентрация",
    question: "Как с концентрацией?",
    field: "focus",
    low: "Рассеян",
    ok: "Норм",
    high: "Собран",
    tags: ["Телефон мешает", "Шум", "Удалось углубиться"],
    notePlaceholder: "Например: через 5 минут уже в ленте…",
  },
  appearance: {
    label: "Внешний вид",
    question: "Как сегодня с внешним видом / телом?",
    field: "control",
    low: "Тяжело",
    ok: "Норм",
    high: "Лучше",
    tags: ["Не нравится зеркало", "Сравниваю себя", "Сделал что-то для себя"],
    notePlaceholder: "Например: утром в зеркале тяжело, из-за этого нет желания…",
  },
  other: {
    label: "Твой фокус",
    question: "Как сегодня с тем, что меняешь?",
    field: "control",
    low: "Тяжело",
    ok: "Норм",
    high: "Лучше",
    tags: ["Нет ясности", "Нет времени", "Есть сдвиг"],
    notePlaceholder: "Например: что сегодня сильнее всего мешает…",
  },
};

export function primaryWhy(selected: WhyOption[]): WhyOption {
  return selected[0] ?? "other";
}

export function levelToScore(level: SignalLevel): number {
  if (level === "low") return 3;
  if (level === "high") return 8;
  return 5;
}

/** Build CheckInData from goal-tied focus + capacity for the plan. */
export function buildCheckInPayload(input: {
  why: WhyOption;
  focus: SignalLevel;
  capacity: SignalLevel;
  tags: string[];
  note: string;
}): Omit<CheckInData, "date"> {
  const plot = CHECKIN_BY_WHY[input.why];
  const focusN = levelToScore(input.focus);
  const capacityN = levelToScore(input.capacity);

  // Stress is inverted in UI (high stress = low wellbeing choice "Высокий" = low)
  const stressN =
    plot.field === "stress"
      ? input.focus === "low"
        ? 8
        : input.focus === "high"
          ? 3
          : 5
      : input.tags.some((t) => /стресс|хаос|перегруз/i.test(t))
        ? 7
        : 4;

  const base: Omit<CheckInData, "date"> = {
    energy: capacityN,
    mood: plot.field === "mood" ? focusN : Math.round((focusN + capacityN) / 2),
    sleep: plot.field === "sleep" ? focusN : 5,
    stress: stressN,
    activity: plot.field === "activity" ? focusN : 4,
    focus: plot.field === "focus" ? focusN : capacityN,
    drive: capacityN,
    habits: plot.field === "habits" ? focusN : 5,
    control: plot.field === "control" ? focusN : focusN,
    note: [...input.tags, input.note.trim()].filter(Boolean).join(". ") || undefined,
  };

  return base;
}

export function focusScoreFromCheckIn(
  checkIn: CheckInData,
  why: WhyOption,
): number {
  const field = CHECKIN_BY_WHY[why].field;
  if (field === "stress") return Math.max(1, 11 - checkIn.stress);
  return checkIn[field];
}
