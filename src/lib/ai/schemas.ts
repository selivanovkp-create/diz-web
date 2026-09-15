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
  title: z.string().min(3).max(120),
  detail: z.string().max(240).optional(),
  duration: z.number().int().min(1).max(120).optional(),
  difficulty: z.number().int().min(1).max(5),
  category: z.string(),
  why: z.string().max(280).optional(),
  xp: z.number().int().min(5).max(50).default(10),
});

export const InitialAssessmentSchema = z.object({
  priority: LifeAreaKeySchema,
  secondary: LifeAreaKeySchema.optional(),
  reason: z.string(),
  confidence: z.number().min(0).max(1),
  strategy: z.array(z.string()).min(2).max(6),
  areas: z.array(
    z.object({
      key: LifeAreaKeySchema,
      score: z.number().int().min(0).max(100),
      trend: z.enum(["up", "down", "stable"]),
      confidence: z.number().min(0).max(1),
      problems: z.array(z.string()),
      goals: z.array(z.string()),
    }),
  ),
  summary: z.string(),
});

export const DailyPlanSchema = z.object({
  priority: LifeAreaKeySchema,
  reason: z.string(),
  confidence: z.number().min(0).max(1),
  difficultyMode: z.enum(["ease", "hold", "push"]),
  motivation: z.string(),
  tasks: z.array(GeneratedTaskSchema).min(1).max(5),
});

export const CheckInAnalysisSchema = z.object({
  primaryIssue: LifeAreaKeySchema,
  secondaryIssue: LifeAreaKeySchema.optional(),
  insight: z.string(),
  loadAdvice: z.enum(["reduce", "keep", "increase"]),
  confidence: z.number().min(0).max(1),
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
