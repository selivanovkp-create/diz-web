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
import {
  AREA_LABELS,
  primaryWhy,
  strategiesFor,
  tasksForWhy,
  whyAreas,
  whyLabel,
  whyLabels,
  whyToArea,
} from "@/lib/plot";
import type { CheckInData, LifeAreaKey, WhyOption } from "@/lib/types";

function clamp(n: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, Math.round(n)));
}

function scoreAreas(ctx: AIContext): InitialAssessment["areas"] {
  const s = ctx.currentState;
  const b = ctx.behavior;
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
    productivity: clamp(
      s.work * 5 + (10 - Math.min(b.phoneHours, 10)) * 4 + b.discipline * 2,
    ),
    habits: n(s.habits),
    social: n(s.social),
    lifestyle: clamp(((s.nutrition + s.satisfaction + s.control) / 3) * 10),
  };

  const focus = whyAreas(ctx.why.selected);
  const why = primaryWhy(ctx.why.selected);
  return (Object.keys(base) as LifeAreaKey[]).map((key) => {
    const score = base[key];
    const problems: string[] = [];
    if (key === whyToArea(why) && score < 55) {
      problems.push(`Проседает тема «${whyLabel(why)}»`);
    }
    if (key === "sleep" && score < 55 && focus.includes("sleep")) {
      problems.push("Нестабильный или короткий сон");
    }
    if (key === "energy" && score < 55 && focus.includes("energy")) {
      problems.push("Энергия проседает днём");
    }
    if (key === "habits" && focus.includes("habits") && score < 50) {
      problems.push("Есть привычки, которые тянут вниз");
    }
    if (key === "physical" && score < 45 && focus.includes("physical")) {
      problems.push("Мало движения");
    }
    if (key === "mind" && s.stress >= 7 && focus.includes("mind")) {
      problems.push("Высокий стресс");
    }
    return {
      key,
      score,
      trend: "stable" as const,
      confidence: focus.includes(key) ? 0.86 : 0.55,
      problems,
      goals: ctx.goals.filter((g) => g.area === key).map((g) => g.title).slice(0, 2),
    };
  });
}

/** Priority follows onboarding why — never hijack to sleep/energy unless that was the goal. */
function pickPriority(areas: InitialAssessment["areas"], ctx: AIContext): LifeAreaKey {
  const selected = ctx.why.selected;
  const primary = primaryWhy(selected);
  const primaryArea = whyToArea(primary);
  const primaryScore = areas.find((a) => a.key === primaryArea)?.score ?? 50;

  if (selected.length > 1) {
    const rankedWhy = selected
      .map((w) => {
        const area = whyToArea(w);
        return { w, area, score: areas.find((a) => a.key === area)?.score ?? 50 };
      })
      .sort((a, b) => a.score - b.score);
    if (rankedWhy[0] && rankedWhy[0].score < primaryScore - 8) {
      return rankedWhy[0].area;
    }
  }

  if (primaryScore < 70) return primaryArea;
  return primaryArea;
}

function poolForWhy(ctx: AIContext, tiny: boolean): DailyPlanAI["tasks"] {
  const selected = ctx.why.selected.length
    ? ctx.why.selected
    : (["other"] as WhyOption[]);
  const minutes = ctx.constraints.minutesPerDay;
  const tasks: DailyPlanAI["tasks"] = [];
  for (const w of selected.slice(0, 2)) {
    tasks.push(...tasksForWhy(w, tiny, minutes));
  }
  return tasks;
}

function recentCompletion(ctx: AIContext) {
  return ctx.completionRate14d;
}

export class MockAIService implements AIService {
  async generateInitialAssessment(ctx: AIContext) {
    const areas = scoreAreas(ctx);
    const priority = pickPriority(areas, ctx);
    const why = primaryWhy(ctx.why.selected);
    const secondaryWhy = ctx.why.selected[1];
    const secondary = secondaryWhy
      ? whyToArea(secondaryWhy)
      : [...areas].sort((a, b) => a.score - b.score).find((a) => a.key !== priority)
          ?.key;
    const focusName = whyLabels(ctx.why.selected);

    return InitialAssessmentSchema.parse({
      priority,
      secondary,
      reason: `Ты пришёл с запросом «${focusName}». Начнём отсюда — остальное подождёт.`,
      confidence: 0.82,
      strategy: strategiesFor(ctx.why.selected),
      areas,
      summary: `Не чиним всё сразу. Главный фокус — «${whyLabel(why)}».`,
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
    const priority =
      (ctx.priorityArea as LifeAreaKey) || pickPriority(assessmentAreas, ctx);
    const why = primaryWhy(ctx.why.selected);
    const focusName = whyLabel(why);
    const diff = await this.adjustDifficulty(ctx);

    // Load comes only from checklist completion / constraints — not a check-in ritual.
    const tiny = ctx.constraints.preferTiny || diff.mode === "ease";
    const mode = diff.mode;
    const taskCount = diff.taskCount;

    const pool = poolForWhy(ctx, tiny);
    const avoid = new Set(ctx.constraints.avoid.map((a) => a.toLowerCase()));
    const filtered = pool.filter(
      (t) => ![...avoid].some((a) => t.title.toLowerCase().includes(a)),
    );
    const tasks = filtered.slice(0, taskCount);

    const recentPlans = (ctx.recentTasks ?? []).length;
    const reason =
      diff.mode === "ease"
        ? `По чеклисту нагрузка была тяжеловатой. Сегодня легче — но всё ещё про «${focusName}».`
        : recentPlans > 0
          ? `Сегодня продолжаем линию онбординга: «${focusName}».`
          : `Стартовый чеклист по «${focusName}».`;

    const motivation = await this.generateMotivation(ctx);

    return DailyPlanSchema.parse({
      priority: whyToArea(why) || priority,
      reason,
      confidence: 0.84,
      difficultyMode: mode,
      motivation: motivation.message,
      tasks,
      source: "mock",
    });
  }

  async generateTasks(ctx: AIContext, count: number) {
    const plan = await this.generateDailyPlan(ctx);
    return plan.tasks.slice(0, count);
  }

  async analyzeCheckIn(ctx: AIContext, _checkIn: CheckInData) {
    const why = primaryWhy(ctx.why.selected);
    const focusArea = whyToArea(why);
    const rate = recentCompletion(ctx);
    let loadAdvice: "reduce" | "keep" | "increase" = "keep";
    if (rate < 0.4) loadAdvice = "reduce";
    else if (rate > 0.85 && ctx.momentumDays >= 4) loadAdvice = "increase";

    return CheckInAnalysisSchema.parse({
      primaryIssue: focusArea,
      insight:
        loadAdvice === "reduce"
          ? `По чеклисту «${whyLabel(why)}» лучше меньше нагрузки. Один–два шага — уже победа.`
          : `Держим фокус на «${whyLabel(why)}» — тема из онбординга, сигнал — закрытые шаги.`,
      loadAdvice,
      confidence: 0.8,
    });
  }

  async analyzeProgress(ctx: AIContext) {
    const rate = Math.round(recentCompletion(ctx) * 100);
    const focus = whyLabels(ctx.why.selected);
    return ProgressAnalysisSchema.parse({
      summary: `По «${focus}» ты закрываешь около ${rate}% плана.`,
      wins:
        ctx.momentumDays > 0
          ? [`Momentum ${ctx.momentumDays} дн.`, `Закрыто ${rate}% задач`]
          : ["Ты вернулся — это уже движение"],
      risks:
        rate < 40
          ? ["План пока тяжелее ресурса"]
          : [`Не размывать фокус «${focus}»`],
      nextMove:
        rate < 40
          ? "Урезать день до 1–2 действий по твоей теме."
          : `Держать ритм по «${focus}».`,
    });
  }

  async generateMotivation(ctx: AIContext) {
    const rate = Math.round(recentCompletion(ctx) * 100);
    const focus = whyLabel(primaryWhy(ctx.why.selected));
    const prefersStats =
      ctx.motivators.includes("statistics") ||
      ctx.motivators.includes("visible_progress");
    const prefersNarrative =
      ctx.motivators.includes("narrative") ||
      ctx.motivators.includes("ai_feedback");

    let message: string;
    if (ctx.momentumDays >= 7) {
      message = prefersStats
        ? `${ctx.momentumDays} дней подряд по «${focus}». Не магия — ритм.`
        : `Ритм по «${focus}» уже есть. Сегодня просто не обнуляй его.`;
    } else if (rate < 35) {
      message = `Вчерашний план можно отпустить. Сегодня короче — но всё ещё про «${focus}».`;
    } else if (prefersNarrative) {
      message = `Ты не чинишь жизнь целиком. Ты собираешь «${focus}» из маленьких завершённых дней.`;
    } else {
      message = `Сделай минимум по «${focus}». Остальное — бонус.`;
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
        relatedArea: whyToArea(primaryWhy(ctx.why.selected)),
      });
    }

    const why = primaryWhy(ctx.why.selected);
    const focus = whyLabel(why);
    const focusArea = whyToArea(why);
    const lower = message.toLowerCase();
    const lastRate = Math.round(recentCompletion(ctx) * 100);
    let reply: string;

    if (/устал|tired|энерг|energy|сил/.test(lower)) {
      reply = `Если сил мало — на Today нажми «упростить день». Тема остаётся «${focus}», задач станет меньше. Сейчас чеклист около ${lastRate}%.`;
    } else if (/кур|smoke|никотин|сорвал/.test(lower)) {
      reply =
        why === "smoking"
          ? `Срыв — данные, не приговор. Не надо «бросить навсегда» сегодня. Рабочая рамка: одно окно без никотина и фиксация факта без самобичевания.`
          : `Понял. Если курение мешает «${focus}», зафиксируем это в плане — но основной фокус всё ещё твоя тема из онбординга.`;
    } else if (/прогресс|progress|лучше/.test(lower)) {
      reply = `Коротко по чеклисту «${focus}»: ${lastRate}% задач, momentum ${ctx.momentumDays}. Это и есть прогресс — повторяемость, не идеал.`;
    } else if (/сегодня|today|делать/.test(lower)) {
      reply = `Сегодня приоритет — «${focus}». Открой «Сегодня» и закрой минимум в чеклисте. Если тяжело — упрости день.`;
    } else if (/не хочу|нет сил|lazy|апат/.test(lower)) {
      reply = `Ок. Тогда минимум по «${focus}»: одно действие меньше 5 минут. Не «новая жизнь» — просто не обнулить день.`;
    } else if (/зеркал|внешн|вид|тело/.test(lower) && why === "appearance") {
      reply = `По «Внешний вид» лучше не спорить с зеркалом, а закрыть один шаг заботы о теле в чеклисте — уход, еда или короткая ходьба.`;
    } else {
      reply = ctx.lifeProfileSummary
        ? `${ctx.lifeProfileSummary} Можем разобрать «${focus}» или сегодняшний чеклист — что полезнее?`
        : `Я опираюсь на онбординг («${focus}») и то, что ты закрываешь в чеклисте. Что сейчас сильнее всего мешает по этой теме?`;
    }

    return CoachResponseSchema.parse({
      reply,
      safetyTriggered: false,
      suggestProfessionalHelp: false,
      relatedArea: focusArea,
    });
  }

  async generateWeeklyReview(ctx: AIContext) {
    const rate = recentCompletion(ctx);
    const why = primaryWhy(ctx.why.selected);
    const focus = whyLabel(why);
    const areas = scoreAreas(ctx);
    const focusArea = whyToArea(why);
    const focusScore = areas.find((a) => a.key === focusArea)?.score ?? 50;
    const related = whyAreas(ctx.why.selected);

    return WeeklyReviewSchema.parse({
      completionRate: rate,
      biggestWin:
        rate >= 0.5
          ? `Держишь курс по «${focus}»`
          : `Вернулся к теме «${focus}»`,
      needsAttention:
        focusScore < 55
          ? focus
          : AREA_LABELS[
              [...areas]
                .filter((a) => related.includes(a.key))
                .sort((a, b) => a.score - b.score)[0]?.key ?? focusArea
            ],
      nextFocus: `Продолжить «${focus}» одним маленьким правилом`,
      aiNote:
        rate >= 0.7
          ? `Главный прогресс — стабильность по «${focus}». На следующей неделе не размывай фокус.`
          : `Неделя была рваной. Не наращиваем. Упрощаем план и возвращаем ритм по «${focus}».`,
      areaDeltas: areas
        .filter((a) => related.includes(a.key) || a.key === focusArea)
        .slice(0, 4)
        .map((a) => ({
          key: a.key,
          label: AREA_LABELS[a.key],
          delta: Math.round((a.score - 50) / 5),
        })),
    });
  }
}
