import type { AIContext } from "@/lib/ai/service";
import type { CheckInData } from "@/lib/types";

const SYSTEM_BASE = `Ты — AI-движок продукта FORMA (wellness / personal improvement).
Отвечай ТОЛЬКО валидным JSON без markdown и пояснений.
Язык всех текстовых полей — русский.
Тон: коротко, по-человечески, уверенно, без токсичной мотивации и без инфантильности.
НЕ ставь медицинских диагнозов. НЕ назначай лекарства.
Если речь о серьёзных симптомах — recommendProfessionalHelp / safetyTriggered.
Задачи должны быть маленькими, конкретными, выполнимыми сегодня.
Life area keys: energy|sleep|physical|mind|productivity|habits|social|lifestyle.`;

export function systemFor(action: string) {
  return `${SYSTEM_BASE}\nДействие: ${action}`;
}

export function compactContext(ctx: AIContext) {
  const behavior = ctx.behavior ?? ({} as AIContext["behavior"]);
  const goals = ctx.goals ?? [];
  const checkIns = ctx.checkIns ?? [];
  const recentTasks = ctx.recentTasks ?? [];
  const journal = ctx.journal ?? [];
  return {
    name: ctx.name,
    why: ctx.why,
    currentState: ctx.currentState,
    behavior: {
      sleepHours: behavior.sleepHours,
      sleepStable: behavior.sleepStable,
      phoneHours: behavior.phoneHours,
      movementMinutes: behavior.movementMinutes,
      discipline: behavior.discipline,
      triedBefore: behavior.triedBefore,
      whyFailed: behavior.whyFailed,
      habitsToChange: behavior.habitsToChange,
    },
    constraints: ctx.constraints,
    goals: goals.map((g) => ({ title: g.title, area: g.area })),
    motivators: ctx.motivators,
    checkIns: checkIns.slice(-7),
    recentTasks: recentTasks.slice(-15).map((t) => ({
      title: t.title,
      status: t.status,
      category: t.category,
    })),
    journal: journal.slice(-5).map((j) => j.body),
    completionRate14d: ctx.completionRate14d,
    momentumDays: ctx.momentumDays,
    lifeProfileSummary: ctx.lifeProfileSummary,
    priorityArea: ctx.priorityArea,
    plan: ctx.subscriptionPlan,
  };
}

export const PROMPTS = {
  initialAssessment: (ctx: AIContext) =>
    `Собери Personal State после onboarding.
Верни JSON:
{
  "priority": LifeAreaKey,
  "secondary": LifeAreaKey?,
  "reason": string,
  "confidence": 0..1,
  "strategy": string[2..5],
  "areas": [{ "key", "score":0..100, "trend":"up|down|stable", "confidence":0..1, "problems":string[], "goals":string[] }],
  "summary": string
}
Контекст: ${JSON.stringify(compactContext(ctx))}`,

  dailyPlan: (ctx: AIContext) =>
    `Сгенерируй план на сегодня (1–5 задач).
Верни JSON:
{
  "priority": LifeAreaKey,
  "reason": string,
  "confidence": 0..1,
  "difficultyMode": "ease|hold|push",
  "motivation": string,
  "tasks": [{ "title", "detail?", "duration?", "difficulty":1..5, "category", "why?", "xp":5..50 }]
}
Если энергия/сон низкие — ease и меньше задач.
Контекст: ${JSON.stringify(compactContext(ctx))}`,

  checkIn: (ctx: AIContext, checkIn: CheckInData) =>
    `Проанализируй сегодняшний чек-ин.
Верни JSON:
{ "primaryIssue": LifeAreaKey, "secondaryIssue"?: LifeAreaKey, "insight": string, "loadAdvice":"reduce|keep|increase", "confidence":0..1 }
Чек-ин: ${JSON.stringify(checkIn)}
Контекст: ${JSON.stringify(compactContext(ctx))}`,

  progress: (ctx: AIContext) =>
    `Краткий анализ прогресса.
Верни JSON: { "summary", "wins":string[], "risks":string[], "nextMove":string }
Контекст: ${JSON.stringify(compactContext(ctx))}`,

  motivation: (ctx: AIContext) =>
    `Одна мотивационная фраза на сегодня (не банальная).
Верни JSON: { "message": string, "tone":"steady|direct|warm|ironic" }
Контекст: ${JSON.stringify(compactContext(ctx))}`,

  difficulty: (ctx: AIContext) =>
    `Подстрой сложность.
Верни JSON: { "mode":"ease|hold|push", "taskCount":1..5, "reason":string }
Контекст: ${JSON.stringify(compactContext(ctx))}`,

  coach: (ctx: AIContext, message: string) =>
    `Ответ AI Coach на сообщение пользователя с учётом профиля.
Верни JSON:
{ "reply": string, "safetyTriggered": boolean, "suggestProfessionalHelp": boolean, "relatedArea"?: LifeAreaKey }
Сообщение: ${JSON.stringify(message)}
Контекст: ${JSON.stringify(compactContext(ctx))}`,

  weekly: (ctx: AIContext) =>
    `Недельный обзор.
Верни JSON:
{
  "completionRate": number,
  "biggestWin": string,
  "needsAttention": string,
  "nextFocus": string,
  "aiNote": string,
  "areaDeltas": [{ "key": LifeAreaKey, "label": string, "delta": number }]
}
Контекст: ${JSON.stringify(compactContext(ctx))}`,
};
