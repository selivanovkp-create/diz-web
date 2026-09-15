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
  focusScoreFromCheckIn,
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

function avg(nums: number[]) {
  if (!nums.length) return 50;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
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
    const priority = (ctx.priorityArea as LifeAreaKey) || pickPriority(assessmentAreas, ctx);
    const why = primaryWhy(ctx.why.selected);
    const focusName = whyLabel(why);
    const diff = await this.adjustDifficulty(ctx);
    const last = ctx.checkIns[ctx.checkIns.length - 1];

    // Capacity can ease the day — it must not steal focus away from onboarding why.
    const lowCapacity = last && last.energy <= 3;
    const tiny =
      ctx.constraints.preferTiny || diff.mode === "ease" || Boolean(lowCapacity);
    const mode = lowCapacity ? "ease" : diff.mode;
    const taskCount = lowCapacity ? Math.min(2, diff.taskCount) : diff.taskCount;

    const pool = poolForWhy(ctx, tiny);
    const avoid = new Set(ctx.constraints.avoid.map((a) => a.toLowerCase()));
    const filtered = pool.filter(
      (t) => ![...avoid].some((a) => t.title.toLowerCase().includes(a)),
    );
    const tasks = filtered.slice(0, taskCount);

    const focusTrendDown =
      ctx.checkIns.length >= 3 &&
      avg(ctx.checkIns.slice(-3).map((c) => focusScoreFromCheckIn(c, why))) <
        avg(
          ctx.checkIns.slice(-6, -3).map((c) => focusScoreFromCheckIn(c, why)) || [
            5,
          ],
        );

    const reason = lowCapacity
      ? `Сил мало — план лёгкий, но всё ещё про «${focusName}».`
      : focusTrendDown
        ? `По «${focusName}» последние дни проседают. Сегодня без героизма — держим этот фокус.`
        : `Сегодня продолжаем линию онбординга: «${focusName}».`;

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

  async analyzeCheckIn(ctx: AIContext, checkIn: CheckInData) {
    const why = primaryWhy(ctx.why.selected);
    const focusArea = whyToArea(why);
    const focusScore = focusScoreFromCheckIn(checkIn, why);
    let loadAdvice: "reduce" | "keep" | "increase" = "keep";
    if (checkIn.energy <= 3 || focusScore <= 3 || checkIn.stress >= 8) {
      loadAdvice = "reduce";
    } else if (
      checkIn.energy >= 8 &&
      focusScore >= 7 &&
      recentCompletion(ctx) > 0.8
    ) {
      loadAdvice = "increase";
    }

    return CheckInAnalysisSchema.parse({
      primaryIssue: focusArea,
      secondaryIssue: checkIn.energy <= 3 ? "energy" : undefined,
      insight:
        loadAdvice === "reduce"
          ? `Сегодня по «${whyLabel(why)}» лучше меньше нагрузки. Один–два шага — уже победа.`
          : `Держим фокус на «${whyLabel(why)}» — это твоя тема из онбординга.`,
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
    const last = ctx.checkIns[ctx.checkIns.length - 1];
    let reply: string;

    if (/устал|tired|энерг|energy|сил/.test(lower)) {
      reply = last
        ? `По сигналам: ресурс на план ${last.energy}/10, «${focus}» ${focusScoreFromCheckIn(last, why)}/10. Если сил мало — ужимаем день, но не меняем тему.`
        : `Мало сил — ок. Держим тему «${focus}», но оставляем 1 короткое действие.`;
    } else if (/кур|smoke|никотин|сорвал/.test(lower)) {
      reply =
        why === "smoking"
          ? `Срыв — данные, не приговор. Не надо «бросить навсегда» сегодня. Рабочая рамка: одно окно без никотина и фиксация факта без самобичевания.`
          : `Понял. Если курение мешает «${focus}», зафиксируем это в плане — но основной фокус всё ещё твоя тема из онбординга.`;
    } else if (/прогресс|progress|лучше/.test(lower)) {
      reply = `Коротко по «${focus}»: ${Math.round(recentCompletion(ctx) * 100)}% задач, momentum ${ctx.momentumDays}. Это и есть прогресс — повторяемость, не идеал.`;
    } else if (/сегодня|today|делать/.test(lower)) {
      reply = `Сегодня приоритет — «${focus}». Открой «Сегодня» и закрой минимум. Если сил мало — одну задачу.`;
    } else if (/не хочу|нет сил|lazy|апат/.test(lower)) {
      reply = `Ок. Тогда минимум по «${focus}»: одно действие меньше 5 минут. Не «новая жизнь» — просто не обнулить день.`;
    } else if (/зеркал|внешн|вид|тело/.test(lower) && why === "appearance") {
      reply = `По «Внешний вид» лучше не спорить с зеркалом, а сделать один маленький шаг заботы о теле — уход, еда или короткая ходьба. Оценка отражения подождёт.`;
    } else {
      reply = ctx.lifeProfileSummary
        ? `${ctx.lifeProfileSummary} Можем разобрать «${focus}» или сегодняшний план — что полезнее?`
        : `Я опираюсь на твой онбординг («${focus}») и сигналы дня, не на общие советы. Что сейчас сильнее всего мешает по этой теме?`;
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
