import type { AIContext } from "@/lib/ai/service";
import { primaryWhy, whyLabel, whyLabels } from "@/lib/plot";
import type { CheckInData } from "@/lib/types";

const SYSTEM_BASE = `Ты — AI-движок продукта FORMA (личная система изменений).
Отвечай ТОЛЬКО валидным JSON без markdown и пояснений.
Язык всех текстовых полей — русский.
Тон: коротко, по-человечески, уверенно, без токсичной мотивации и без инфантильности.
НЕ ставь медицинских диагнозов. НЕ назначай лекарства.
Если речь о серьёзных симптомах — recommendProfessionalHelp / safetyTriggered.
Задачи должны быть маленькими, конкретными, выполнимыми сегодня.
Life area keys: energy|sleep|physical|mind|productivity|habits|social|lifestyle.

ГЛАВНОЕ ПРАВИЛО СЮЖЕТА:
- why.selected / whyLabels / primaryWhy — источник правды о потребностях пользователя.
- priority, tasks, insight, strategy, relatedArea должны следовать теме онбординга.
- Низкая энергия/ресурс на план (capacity) только уменьшает нагрузку (ease), НЕ меняет тему на сон/энергию, если пользователь не выбирал их в why.
- Главный сигнал прогресса и нагрузки — закрытые задачи чеклиста (completionRate), а не отдельный wellness check-in.
- Не подсовывай курение/сон/энергию как дефолт, если это не why пользователя.`;

export function systemFor(action: string) {
  return `${SYSTEM_BASE}\nДействие: ${action}`;
}

export function compactContext(ctx: AIContext) {
  const behavior = ctx.behavior ?? ({} as AIContext["behavior"]);
  const goals = ctx.goals ?? [];
  const checkIns = ctx.checkIns ?? [];
  const recentTasks = ctx.recentTasks ?? [];
  const journal = ctx.journal ?? [];
  const selected = ctx.why?.selected ?? [];
  return {
    name: ctx.name,
    why: ctx.why,
    whyLabels: whyLabels(selected),
    primaryWhy: primaryWhy(selected),
    primaryWhyLabel: whyLabel(primaryWhy(selected)),
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
Верни КОМПАКТНЫЙ JSON (короткие строки, без воды):
{
  "priority": LifeAreaKey (должен соответствовать primaryWhy / why.selected),
  "secondary": LifeAreaKey,
  "reason": string (<=180 chars, явно про тему why),
  "confidence": 0..1,
  "strategy": string[2..4] (каждый <=100 chars, про why),
  "areas": ровно 8 объектов для energy|sleep|physical|mind|productivity|habits|social|lifestyle,
    каждый: { "key", "score":0..100, "trend":"up|down|stable", "confidence":0..1,
              "problems": string[0..2], "goals": string[0..2] },
  "summary": string (<=160 chars)
}
Контекст: ${JSON.stringify(compactContext(ctx))}
Важно: why.selected — главный приоритет. Свободный текст (why.custom / whyFailed / journal) уточняет, но не отменяет тему.`,

  dailyPlan: (ctx: AIContext) =>
    `Сгенерируй план на сегодня (2–4 задачи) СТРОГО под why.selected / primaryWhyLabel.
КОМПАКТНЫЙ JSON:
{
  "priority": LifeAreaKey (из темы why, не дефолт energy),
  "reason": string (<=180, про тему why),
  "confidence": 0..1,
  "difficultyMode": "ease|hold|push",
  "motivation": string (<=120),
  "tasks": [{ "title", "detail?", "duration"?, "difficulty":1..5, "category", "why" (личная польза по теме why), "xp":5..50 }]
}
Если ресурс/энергия низкие — ease и меньше задач, НО задачи всё равно про тему why.
Не предлагай сон/курение/энергию, если это не в why.selected.
Контекст: ${JSON.stringify(compactContext(ctx))}`,

  checkIn: (ctx: AIContext, checkIn: CheckInData) =>
    `Проанализируй сегодняшний сигнал (чек-ин) относительно темы why.
Верни JSON:
{ "primaryIssue": LifeAreaKey (тема why), "secondaryIssue"?: LifeAreaKey, "insight": string, "loadAdvice":"reduce|keep|increase", "confidence":0..1 }
Чек-ин: ${JSON.stringify(checkIn)}
Контекст: ${JSON.stringify(compactContext(ctx))}
loadAdvice смотри на capacity/energy и фокус темы; primaryIssue = тема why.`,

  progress: (ctx: AIContext) =>
    `Краткий анализ прогресса по теме why (не общий wellness).
Верни JSON: { "summary", "wins":string[], "risks":string[], "nextMove":string }
Контекст: ${JSON.stringify(compactContext(ctx))}`,

  motivation: (ctx: AIContext) =>
    `Одна мотивационная фраза на сегодня про тему why (не банальная).
Верни JSON: { "message": string, "tone":"steady|direct|warm|ironic" }
Контекст: ${JSON.stringify(compactContext(ctx))}`,

  difficulty: (ctx: AIContext) =>
    `Подстрой сложность под ресурс, не меняя тему why.
Верни JSON: { "mode":"ease|hold|push", "taskCount":1..5, "reason":string }
Контекст: ${JSON.stringify(compactContext(ctx))}`,

  coach: (ctx: AIContext, message: string) =>
    `Ответ AI Coach с опорой на why.selected / primaryWhyLabel.
Верни JSON:
{ "reply": string, "safetyTriggered": boolean, "suggestProfessionalHelp": boolean, "relatedArea"?: LifeAreaKey }
Сообщение: ${JSON.stringify(message)}
Контекст: ${JSON.stringify(compactContext(ctx))}
Не уводи разговор в сон/энергию, если пользователь про другое.`,

  weekly: (ctx: AIContext) =>
    `Недельный обзор по теме why.
Верни JSON:
{
  "completionRate": number,
  "biggestWin": string,
  "needsAttention": string,
  "nextFocus": string,
  "aiNote": string,
  "areaDeltas": [{ "key": LifeAreaKey, "label": string, "delta": number }]
}
Контекст: ${JSON.stringify(compactContext(ctx))}
biggestWin / needsAttention / nextFocus — про why, не про случайный сон.`,
};
