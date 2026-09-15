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

export const GeneratedTaskSchema = z.object({
  title: z.string().min(2).max(160),
  detail: z.string().max(400).optional(),
  duration: z.coerce.number().int().min(1).max(120).optional(),
  difficulty: z.coerce.number().int().min(1).max(5).catch(2),
  category: z.string().min(1).catch("lifestyle"),
  why: z.string().max(400).optional(),
  xp: z.coerce.number().int().min(5).max(50).catch(10),
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
