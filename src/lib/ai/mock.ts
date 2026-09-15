import type { AIContext, AIService } from "@/lib/ai/service";
import {
  CheckInAnalysisSchema,
  CoachResponseSchema,
  DailyPlanSchema,
  DifficultyAdjustSchema,
  InitialAssessmentSchema,
  MotivationSchema,
  ProgressAnalysisSchema,
  WeeklyReviewSchema,
  type DailyPlanAI,
  type InitialAssessment,
} from "@/lib/ai/schemas";
import { detectSafetyRisk, safetyCoachReply } from "@/lib/ai/safety";
import type { CheckInData, LifeAreaKey } from "@/lib/types";

const AREA_LABELS: Record<LifeAreaKey, string> = {
  energy: "Энергия",
  sleep: "Сон",
  physical: "Движение",
  mind: "Голова",
  productivity: "Продуктивность",
  habits: "Привычки",
  social: "Социум",
  lifestyle: "Образ жизни",
};

function clamp(n: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, Math.round(n)));
}

function avg(nums: number[]) {
  if (!nums.length) return 50;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

function whyToAreas(ctx: AIContext): LifeAreaKey[] {
  const map: Record<string, LifeAreaKey> = {
    energy: "energy",
    sleep: "sleep",
    fitness: "physical",
    nutrition: "lifestyle",
    smoking: "habits",
    alcohol: "habits",
    stress: "mind",
    productivity: "productivity",
    discipline: "productivity",
    relationships: "social",
    confidence: "mind",
    appearance: "physical",
    focus: "productivity",
    other: "lifestyle",
  };
  return ctx.why.selected.map((w) => map[w] ?? "lifestyle");
}

function scoreAreas(ctx: AIContext): InitialAssessment["areas"] {
  const s = ctx.currentState;
  const b = ctx.behavior;
  // Onboarding sliders are 1–10 → normalize to 0–100
  const n = (v: number) => clamp(v * 10);
  const base: Record<LifeAreaKey, number> = {
    energy: n(s.energy),
    sleep: clamp(
      s.sleep * 7 +
        (b.sleepHours >= 7 && b.sleepHours <= 8.5 ? 20 : 5) +
        b.sleepStable * 1.5,
    ),
    physical: clamp(s.activity * 6 + Math.min(b.movementMinutes, 40)),
    mind: clamp(100 - s.stress * 5.5 + s.mood * 3.5),
    productivity: clamp(s.work * 5 + (10 - Math.min(b.phoneHours, 10)) * 4 + b.discipline * 2),
    habits: n(s.habits),
    social: n(s.social),
    lifestyle: clamp(((s.nutrition + s.satisfaction + s.control) / 3) * 10),
  };

  const focus = whyToAreas(ctx);
  return (Object.keys(base) as LifeAreaKey[]).map((key) => {
    const score = base[key];
    const problems: string[] = [];
    if (key === "sleep" && score < 55) problems.push("Нестабильный или короткий сон");
    if (key === "energy" && score < 55) problems.push("Энергия проседает днём");
    if (key === "habits" && (focus.includes("habits") || score < 50))
      problems.push("Есть привычки, которые тянут вниз");
    if (key === "physical" && score < 45) problems.push("Мало движения");
    if (key === "mind" && s.stress >= 70) problems.push("Высокий стресс");
    return {
      key,
      score,
      trend: "stable" as const,
      confidence: focus.includes(key) ? 0.86 : 0.62,
      problems,
      goals: ctx.goals.filter((g) => g.area === key).map((g) => g.title).slice(0, 2),
    };
  });
}

function pickPriority(areas: InitialAssessment["areas"], ctx: AIContext): LifeAreaKey {
  const ranked = [...areas].sort((a, b) => a.score - b.score);
  const why = whyToAreas(ctx);
  // Sleep first if weak — foundational
  const sleep = areas.find((a) => a.key === "sleep");
  if (sleep && sleep.score < 48) return "sleep";
  if (why.includes("habits")) {
    const habits = areas.find((a) => a.key === "habits");
    if (habits && habits.score < 55) return "habits";
  }
  if (why.includes("energy") || why.includes("sleep")) {
    const energy = areas.find((a) => a.key === "energy");
    if (energy && energy.score < 55) return energy.score < (sleep?.score ?? 100) ? "energy" : "sleep";
  }
  return ranked[0]?.key ?? "energy";
}

function taskBank(area: LifeAreaKey, tiny: boolean, minutes: number): DailyPlanAI["tasks"] {
  const easy = tiny || minutes <= 15;
  const bank: Record<LifeAreaKey, DailyPlanAI["tasks"]> = {
    sleep: [
      {
        title: easy ? "Ляг до привычного времени +15 мин раньше" : "Ляг до 00:30",
        detail: "Не идеальный сон. Просто чуть раньше, чем обычно.",
        duration: 1,
        difficulty: 1,
        category: "sleep",
        why: "Сон сейчас даёт больше эффекта, чем ещё одна привычка.",
        xp: 12,
      },
      {
        title: "Телефон на зарядку вне кровати",
        duration: 2,
        difficulty: 1,
        category: "sleep",
        why: "Меньше позднего света — легче уснуть.",
        xp: 10,
      },
      {
        title: "2 минуты без экрана перед сном",
        duration: 2,
        difficulty: 1,
        category: "sleep",
        xp: 8,
      },
    ],
    energy: [
      {
        title: "Стакан воды в первые 10 минут после подъёма",
        duration: 2,
        difficulty: 1,
        category: "energy",
        why: "Маленький якорь утра без героизма.",
        xp: 8,
      },
      {
        title: easy ? "5 минут на воздухе" : "12 минут прогулки",
        detail: "Неважно куда. Цель — просто выйти.",
        duration: easy ? 5 : 12,
        difficulty: easy ? 1 : 2,
        category: "movement",
        why: "Короткое движение поднимает энергию быстрее кофе.",
        xp: 14,
      },
      {
        title: "Один блок без уведомлений — 25 минут",
        duration: 25,
        difficulty: 2,
        category: "focus",
        xp: 12,
      },
    ],
    physical: [
      {
        title: easy ? "Пройди 8 минут после еды" : "20 минут ходьбы",
        duration: easy ? 8 : 20,
        difficulty: easy ? 1 : 2,
        category: "movement",
        detail: "После обеда или ужина. Без маршрута.",
        why: "Движение должно быть скучно-простым, чтобы повторялось.",
        xp: 14,
      },
      {
        title: "10 приседаний у стены — без перфекционизма",
        duration: 3,
        difficulty: 1,
        category: "movement",
        xp: 10,
      },
    ],
    mind: [
      {
        title: "Запиши 1 фразу: что сегодня давит",
        duration: 2,
        difficulty: 1,
        category: "mind",
        why: "Названное напряжение занимает меньше места.",
        xp: 10,
      },
      {
        title: "3 медленных выдоха перед следующим делом",
        duration: 1,
        difficulty: 1,
        category: "mind",
        xp: 8,
      },
    ],
    productivity: [
      {
        title: "Выбери одно дело на 15 минут — и только его",
        duration: 15,
        difficulty: 2,
        category: "focus",
        why: "Дисциплина растёт из коротких завершённых циклов.",
        xp: 14,
      },
      {
        title: "Убери 5 лишних вкладок / иконок с главного экрана",
        duration: 5,
        difficulty: 1,
        category: "focus",
        xp: 8,
      },
    ],
    habits: [
      {
        title: "Не курить первые 60 минут после подъёма",
        detail: "Не «бросить навсегда». Только первый час.",
        duration: 60,
        difficulty: 2,
        category: "habits",
        why: "Утренний никотин сильнее закрепляет зависимость.",
        xp: 18,
      },
      {
        title: "Замени один импульс: вода вместо сигареты/снека",
        duration: 3,
        difficulty: 2,
        category: "habits",
        xp: 12,
      },
      {
        title: "Отметь количество срывов без самокритики",
        duration: 2,
        difficulty: 1,
        category: "habits",
        why: "Данные важнее вины.",
        xp: 8,
      },
    ],
    social: [
      {
        title: "Одно короткое сообщение человеку, которого откладывал",
        duration: 3,
        difficulty: 1,
        category: "social",
        xp: 10,
      },
    ],
    lifestyle: [
      {
        title: "Один нормальный приём пищи без телефона",
        duration: 15,
        difficulty: 1,
        category: "lifestyle",
        xp: 10,
      },
      {
        title: "Выпей воды до кофе/энергетика",
        duration: 2,
        difficulty: 1,
        category: "lifestyle",
        xp: 8,
      },
    ],
  };
  return bank[area];
}

function recentCompletion(ctx: AIContext) {
  return ctx.completionRate14d;
}

export class MockAIService implements AIService {
  async generateInitialAssessment(ctx: AIContext) {
    const areas = scoreAreas(ctx);
    const priority = pickPriority(areas, ctx);
    const secondary = [...areas].sort((a, b) => a.score - b.score).find((a) => a.key !== priority)?.key;
    const strategy: string[] = [];
    if (priority === "sleep") strategy.push("Стабилизировать сон");
    if (priority === "habits" || whyToAreas(ctx).includes("habits" as never))
      strategy.push("Снижать вредные привычки маленькими окнами");
    strategy.push("Добавить ежедневное лёгкое движение");
    strategy.push("Снизить перегрузку, не геройствовать");
    strategy.push("Поднять энергию через режим, а не через мотивацию");

    const uniqueStrategy = [...new Set(strategy)].slice(0, 5);
    return InitialAssessmentSchema.parse({
      priority,
      secondary,
      reason: `${AREA_LABELS[priority]} сейчас сильнее всего тянет остальное вниз. Начнём отсюда — остальное подтянется легче.`,
      confidence: 0.78,
      strategy: uniqueStrategy,
      areas,
      summary: `Сейчас важнее не «стать новым человеком», а убрать главный тормоз: ${AREA_LABELS[priority].toLowerCase()}.`,
    });
  }

  async adjustDifficulty(ctx: AIContext) {
    const rate = recentCompletion(ctx);
    const minutes = ctx.constraints.minutesPerDay;
    let mode: "ease" | "hold" | "push" = "hold";
    let taskCount = ctx.constraints.preferTiny ? 3 : 4;
    let reason = "Держим текущий темп.";

    if (rate < 0.35 || ctx.momentumDays === 0) {
      mode = "ease";
      taskCount = Math.min(2, taskCount);
      reason = "Похоже, план был тяжеловатым. Ужимаем до минимума.";
    } else if (rate >= 0.85 && ctx.momentumDays >= 4) {
      mode = "push";
      taskCount = Math.min(5, Math.max(3, taskCount + 1));
      reason = "Ты стабильно закрываешь план — можно чуть повысить планку.";
    } else if (rate < 0.55) {
      mode = "ease";
      taskCount = 3;
      reason = "Около половины задач — сигнал снизить нагрузку, не давить.";
    }

    if (minutes <= 15) taskCount = Math.min(taskCount, 3);
    return DifficultyAdjustSchema.parse({ mode, taskCount, reason });
  }

  async generateDailyPlan(ctx: AIContext) {
    const assessmentAreas = scoreAreas(ctx);
    const priority = (ctx.priorityArea as LifeAreaKey) || pickPriority(assessmentAreas, ctx);
    const diff = await this.adjustDifficulty(ctx);
    const last = ctx.checkIns[ctx.checkIns.length - 1];
    const energyTrendDown =
      ctx.checkIns.length >= 3 &&
      avg(ctx.checkIns.slice(-3).map((c) => c.energy)) <
        avg(ctx.checkIns.slice(-6, -3).map((c) => c.energy) || [60]);

    let focus = priority;
    if (last && last.sleep <= 4) focus = "sleep";
    if (last && last.energy <= 3 && focus !== "sleep") focus = "energy";

    const tiny = ctx.constraints.preferTiny || diff.mode === "ease" || (last?.energy ?? 5) <= 3;
    const pool = [
      ...taskBank(focus, tiny, ctx.constraints.minutesPerDay),
      ...taskBank(priority === focus ? "lifestyle" : priority, tiny, ctx.constraints.minutesPerDay),
    ];
    const avoid = new Set(ctx.constraints.avoid.map((a) => a.toLowerCase()));
    const filtered = pool.filter((t) => ![...avoid].some((a) => t.title.toLowerCase().includes(a)));
    const tasks = filtered.slice(0, diff.taskCount);

    const reason = energyTrendDown
      ? `Последние дни энергия проседает. Сегодня без героизма — фокус на ${AREA_LABELS[focus].toLowerCase()}.`
      : `Сегодня важнее всего ${AREA_LABELS[focus].toLowerCase()}. Остальное подождёт.`;

    const motivation = await this.generateMotivation(ctx);

    return DailyPlanSchema.parse({
      priority: focus,
      reason,
      confidence: 0.8,
      difficultyMode: diff.mode,
      motivation: motivation.message,
      tasks,
    });
  }

  async generateTasks(ctx: AIContext, count: number) {
    const plan = await this.generateDailyPlan(ctx);
    return plan.tasks.slice(0, count);
  }

  async analyzeCheckIn(ctx: AIContext, checkIn: CheckInData) {
    const scores: { key: LifeAreaKey; v: number }[] = [
      { key: "energy", v: checkIn.energy * 10 },
      { key: "sleep", v: checkIn.sleep * 10 },
      { key: "mind", v: 100 - checkIn.stress * 10 },
      { key: "physical", v: checkIn.activity * 10 },
      { key: "productivity", v: checkIn.focus * 10 },
      { key: "habits", v: checkIn.habits * 10 },
    ];
    scores.sort((a, b) => a.v - b.v);
    const primary = scores[0].key;
    const secondary = scores[1]?.key;
    let loadAdvice: "reduce" | "keep" | "increase" = "keep";
    if (checkIn.energy <= 3 || checkIn.sleep <= 3 || checkIn.stress >= 8) loadAdvice = "reduce";
    else if (checkIn.energy >= 8 && checkIn.drive >= 7 && recentCompletion(ctx) > 0.8) loadAdvice = "increase";

    return CheckInAnalysisSchema.parse({
      primaryIssue: primary,
      secondaryIssue: secondary,
      insight:
        loadAdvice === "reduce"
          ? "Сегодня тело просит меньше нагрузки. Один–два шага — уже победа."
          : `Слабое место сейчас — ${AREA_LABELS[primary].toLowerCase()}. Держим фокус там.`,
      loadAdvice,
      confidence: 0.74,
    });
  }

  async analyzeProgress(ctx: AIContext) {
    const rate = Math.round(recentCompletion(ctx) * 100);
    return ProgressAnalysisSchema.parse({
      summary: `За последние дни ты закрываешь около ${rate}% плана.`,
      wins:
        ctx.momentumDays > 0
          ? [`Momentum ${ctx.momentumDays} дн.`, `Закрыто ${rate}% задач`]
          : ["Ты вернулся — это уже движение"],
      risks: rate < 40 ? ["План пока тяжелее ресурса"] : ["Не раздувать список задач"],
      nextMove: rate < 40 ? "Урезать день до 1–2 действий." : "Держать ритм и чуть усиливать одну зону.",
    });
  }

  async generateMotivation(ctx: AIContext) {
    const rate = Math.round(recentCompletion(ctx) * 100);
    const prefersStats = ctx.motivators.includes("statistics") || ctx.motivators.includes("visible_progress");
    const prefersNarrative = ctx.motivators.includes("narrative") || ctx.motivators.includes("ai_feedback");

    let message: string;
    if (ctx.momentumDays >= 7) {
      message = prefersStats
        ? `${ctx.momentumDays} дней подряд ты что-то делаешь. Не магия — ритм.`
        : `Ритм уже есть. Сегодня просто не обнуляй его.`;
    } else if (rate < 35) {
      message = `Вчерашний план можно отпустить. Сегодня — короче и легче.`;
    } else if (prefersNarrative) {
      message = `Ты не чинишь жизнь целиком. Ты собираешь её из маленьких завершённых дней.`;
    } else {
      message = `Сделай минимум. Остальное — бонус.`;
    }

    return MotivationSchema.parse({
      message,
      tone: prefersStats ? "direct" : "steady",
    });
  }

  async generateCoachResponse(ctx: AIContext, message: string) {
    const risk = detectSafetyRisk(message);
    if (risk.crisis) {
      return CoachResponseSchema.parse({
        reply: safetyCoachReply("crisis"),
        safetyTriggered: true,
        suggestProfessionalHelp: true,
      });
    }
    if (risk.medical) {
      return CoachResponseSchema.parse({
        reply: safetyCoachReply("medical"),
        safetyTriggered: true,
        suggestProfessionalHelp: true,
        relatedArea: "energy",
      });
    }

    const lower = message.toLowerCase();
    const priority = (ctx.priorityArea as LifeAreaKey) || "energy";
    const last = ctx.checkIns[ctx.checkIns.length - 1];
    let reply: string;

    if (/устал|tired|энерг|energy|сил/.test(lower)) {
      reply = last
        ? `По твоим чек-инам энергия около ${last.energy}/10, сон ${last.sleep}/10. Обычно в такой связке сначала чинят сон и убирают лишние задачи, а не добавляют мотивацию. Сегодня достаточно 1–2 лёгких действий.`
        : `Усталость чаще лечится режимом, а не силой воли. Начнём с сна и одного короткого действия — без героизма.`;
    } else if (/кур|smoke|никотин|сорвал/.test(lower)) {
      reply = `Срыв — данные, не приговор. Не надо «бросить навсегда» сегодня. Рабочая рамка: одно окно без никотина (например, первый час после подъёма) и фиксация факта без самобичевания.`;
    } else if (/прогресс|progress|лучше/.test(lower)) {
      reply = `Коротко: ${Math.round(recentCompletion(ctx) * 100)}% задач за последнее время, momentum ${ctx.momentumDays}. Это и есть прогресс — не идеальная жизнь, а повторяемость.`;
    } else if (/сегодня|today|делать/.test(lower)) {
      reply = `Сегодня приоритет — ${AREA_LABELS[priority]}. Открой «Сегодня» и закрой минимум. Если сил мало — оставь одну задачу.`;
    } else if (/не хочу|нет сил|lazy|апат/.test(lower)) {
      reply = `Ок. Тогда план на минимум: одно действие меньше 5 минут. Не «начать новую жизнь» — просто не сделать день нулевым.`;
    } else {
      reply = ctx.lifeProfileSummary
        ? `${ctx.lifeProfileSummary} Можем разобрать сон, энергию, привычки или сегодняшний план — что полезнее сейчас?`
        : `Я опираюсь на твой профиль и check-in, не на общие советы. Скажи, что сейчас больше всего мешает: сон, энергия, привычки или дисциплина.`;
    }

    return CoachResponseSchema.parse({
      reply,
      safetyTriggered: false,
      suggestProfessionalHelp: false,
      relatedArea: priority,
    });
  }

  async generateWeeklyReview(ctx: AIContext) {
    const rate = recentCompletion(ctx);
    const areas = scoreAreas(ctx);
    const sorted = [...areas].sort((a, b) => a.score - b.score);
    const best = [...areas].sort((a, b) => b.score - a.score)[0];
    const worst = sorted[0];
    return WeeklyReviewSchema.parse({
      completionRate: rate,
      biggestWin: best ? AREA_LABELS[best.key] : "Стабильность",
      needsAttention: worst ? AREA_LABELS[worst.key] : "Сон",
      nextFocus: worst
        ? `Чуть усилить «${AREA_LABELS[worst.key].toLowerCase()}» одним маленьким правилом`
        : "Держать ритм",
      aiNote:
        rate >= 0.7
          ? "Главный прогресс — стабильность. На следующей неделе добавим только одну новую привычку."
          : "Неделя была рваной. Не наращиваем. Упрощаем план и возвращаем ритм.",
      areaDeltas: areas.slice(0, 4).map((a) => ({
        key: a.key,
        label: AREA_LABELS[a.key],
        delta: Math.round((a.score - 50) / 5),
      })),
    });
  }
}

let singleton: AIService | null = null;

export function getAIService(): AIService {
  if (!singleton) singleton = new MockAIService();
  return singleton;
}

/** Swap provider later without touching UI */
export function setAIService(service: AIService) {
  singleton = service;
}
