import { z } from "zod";

export const LifeAreaKeySchema = z.enum([
  "energy",
  "sleep",
  "physical",
  "mind",
  "productivity",
  "habits",
  "social",
  "lifestyle",
]);

/** LLM often returns "", null, "10 мин" — never let that become NaN. */
function looseInt(opts: {
  min: number;
  max: number;
  fallback?: number;
  optional?: boolean;
}) {
  return z.preprocess((raw) => {
    if (raw === null || raw === undefined || raw === "") {
      return opts.optional ? undefined : opts.fallback;
    }
    if (typeof raw === "string") {
      const m = raw.replace(",", ".").match(/-?\d+(\.\d+)?/);
      if (!m) return opts.optional ? undefined : opts.fallback;
      raw = Number(m[0]);
    }
    const n = typeof raw === "number" ? raw : Number(raw);
    if (!Number.isFinite(n)) return opts.optional ? undefined : opts.fallback;
    return Math.round(n);
  }, opts.optional
    ? z.number().int().min(opts.min).max(opts.max).optional()
    : z.number().int().min(opts.min).max(opts.max).catch(opts.fallback ?? opts.min));
}

export const GeneratedTaskSchema = z.object({
  title: z.string().min(2).max(160),
  detail: z.string().max(400).optional(),
  duration: looseInt({ min: 1, max: 120, optional: true }),
  difficulty: looseInt({ min: 1, max: 5, fallback: 2 }) as z.ZodType<number>,
  category: z.string().min(1).catch("lifestyle"),
  why: z.string().max(400).optional(),
  steps: z.array(z.string().min(2).max(200)).min(2).max(6).optional(),
  doneWhen: z.string().max(240).optional(),
  tip: z.string().max(240).optional(),
  xp: looseInt({ min: 5, max: 50, fallback: 10 }) as z.ZodType<number>,
});

export const InitialAssessmentSchema = z.object({
  priority: LifeAreaKeySchema.catch("energy"),
  secondary: LifeAreaKeySchema.optional(),
  reason: z.string().min(1),
  confidence: z.coerce.number().min(0).max(1).catch(0.6),
  strategy: z.array(z.string()).min(1).max(6),
  areas: z
    .array(
      z.object({
        key: LifeAreaKeySchema,
        score: z.coerce.number().min(0).max(100),
        trend: z.enum(["up", "down", "stable"]).catch("stable"),
        confidence: z.coerce.number().min(0).max(1).catch(0.5),
        problems: z.array(z.string()).default([]),
        goals: z.array(z.string()).default([]),
      }),
    )
    .min(1),
  summary: z.string().min(1),
  source: z.enum(["live", "mock"]).optional(),
});

export const DailyPlanSchema = z.object({
  priority: LifeAreaKeySchema.catch("energy"),
  reason: z.string().min(1),
  confidence: z.coerce.number().min(0).max(1).catch(0.6),
  difficultyMode: z.enum(["ease", "hold", "push"]).catch("hold"),
  motivation: z.string().min(1),
  tasks: z.array(GeneratedTaskSchema).min(1).max(5),
  /** Injected by AI layer — not from the model */
  source: z.enum(["live", "mock"]).optional(),
});

export const CheckInAnalysisSchema = z.object({
  primaryIssue: LifeAreaKeySchema.catch("energy"),
  secondaryIssue: LifeAreaKeySchema.optional(),
  insight: z.string().min(1),
  loadAdvice: z.enum(["reduce", "keep", "increase"]).catch("keep"),
  confidence: z.coerce.number().min(0).max(1).catch(0.6),
  source: z.enum(["live", "mock"]).optional(),
});

export const ProgressAnalysisSchema = z.object({
  summary: z.string(),
  wins: z.array(z.string()),
  risks: z.array(z.string()),
  nextMove: z.string(),
});

export const MotivationSchema = z.object({
  message: z.string(),
  tone: z.enum(["steady", "direct", "warm", "ironic"]),
});

export const DifficultyAdjustSchema = z.object({
  mode: z.enum(["ease", "hold", "push"]),
  taskCount: z.number().int().min(1).max(5),
  reason: z.string(),
});

export const CoachResponseSchema = z.object({
  reply: z.string(),
  safetyTriggered: z.boolean().default(false),
  suggestProfessionalHelp: z.boolean().default(false),
  relatedArea: LifeAreaKeySchema.optional(),
  source: z.enum(["live", "mock"]).optional(),
});

export const WeeklyReviewSchema = z.object({
  completionRate: z.number(),
  biggestWin: z.string(),
  needsAttention: z.string(),
  nextFocus: z.string(),
  aiNote: z.string(),
  areaDeltas: z.array(
    z.object({
      key: LifeAreaKeySchema,
      label: z.string(),
      delta: z.number(),
    }),
  ),
});

export type InitialAssessment = z.infer<typeof InitialAssessmentSchema>;
export type DailyPlanAI = z.infer<typeof DailyPlanSchema>;
export type CheckInAnalysis = z.infer<typeof CheckInAnalysisSchema>;
export type ProgressAnalysis = z.infer<typeof ProgressAnalysisSchema>;
export type MotivationAI = z.infer<typeof MotivationSchema>;
export type DifficultyAdjust = z.infer<typeof DifficultyAdjustSchema>;
export type CoachResponseAI = z.infer<typeof CoachResponseSchema>;
export type WeeklyReviewAI = z.infer<typeof WeeklyReviewSchema>;
