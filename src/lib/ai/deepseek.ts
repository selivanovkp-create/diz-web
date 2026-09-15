import type { AIContext, AIService } from "@/lib/ai/service";
import { chatCompletion, extractJson, LLMError } from "@/lib/ai/llm";
import { PROMPTS, systemFor } from "@/lib/ai/prompts";
import { detectSafetyRisk, safetyCoachReply } from "@/lib/ai/safety";
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
} from "@/lib/ai/schemas";
import type { CheckInData } from "@/lib/types";
import type { ZodType } from "zod";

type AiSource = "live" | "mock";

const MAX_TOKENS: Record<string, number> = {
  initialAssessment: 3500,
  dailyPlan: 1800,
  checkIn: 800,
  progress: 800,
  motivation: 400,
  difficulty: 400,
  coach: 1200,
  weekly: 2000,
};

async function structured<T extends object>(
  action: string,
  user: string,
  schema: ZodType<T>,
  attempts = 2,
): Promise<T & { source: AiSource }> {
  let lastErr: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      const raw = await chatCompletion({
        system: systemFor(action),
        user:
          i === 0
            ? user
            : `${user}\n\nВажно: верни ТОЛЬКО компактный валидный JSON без markdown. Уложись в лимит.`,
        temperature: i === 0 ? 0.3 : 0.1,
        maxTokens: MAX_TOKENS[action] ?? 1500,
      });
      const parsed = extractJson(raw);
      const data = schema.parse(parsed);
      return { ...data, source: "live" as const };
    } catch (err) {
      lastErr = err;
      console.warn(`[ai:${action}] attempt ${i + 1} failed`, err);
    }
  }
  const message =
    lastErr instanceof Error ? lastErr.message : `AI ${action} failed`;
  throw new LLMError(`DeepSeek не смог собрать ответ (${action}): ${message}`);
}

export class TimewebDeepSeekService implements AIService {
  async generateInitialAssessment(ctx: AIContext) {
    return structured(
      "initialAssessment",
      PROMPTS.initialAssessment(ctx),
      InitialAssessmentSchema,
    );
  }

  async generateDailyPlan(ctx: AIContext) {
    return structured("dailyPlan", PROMPTS.dailyPlan(ctx), DailyPlanSchema);
  }

  async generateTasks(ctx: AIContext, count: number) {
    const plan = await this.generateDailyPlan(ctx);
    return plan.tasks.slice(0, count) as DailyPlanAI["tasks"];
  }

  async analyzeCheckIn(ctx: AIContext, checkIn: CheckInData) {
    return structured(
      "checkIn",
      PROMPTS.checkIn(ctx, checkIn),
      CheckInAnalysisSchema,
    );
  }

  async analyzeProgress(ctx: AIContext) {
    return structured("progress", PROMPTS.progress(ctx), ProgressAnalysisSchema);
  }

  async generateMotivation(ctx: AIContext) {
    return structured("motivation", PROMPTS.motivation(ctx), MotivationSchema);
  }

  async adjustDifficulty(ctx: AIContext) {
    return structured(
      "difficulty",
      PROMPTS.difficulty(ctx),
      DifficultyAdjustSchema,
    );
  }

  async generateCoachResponse(ctx: AIContext, message: string) {
    const risk = detectSafetyRisk(message);
    if (risk.crisis) {
      return {
        ...CoachResponseSchema.parse({
          reply: safetyCoachReply("crisis"),
          safetyTriggered: true,
          suggestProfessionalHelp: true,
        }),
        source: "live" as const,
      };
    }
    if (risk.medical) {
      return {
        ...CoachResponseSchema.parse({
          reply: safetyCoachReply("medical"),
          safetyTriggered: true,
          suggestProfessionalHelp: true,
          relatedArea: "energy",
        }),
        source: "live" as const,
      };
    }
    return structured("coach", PROMPTS.coach(ctx, message), CoachResponseSchema);
  }

  async generateWeeklyReview(ctx: AIContext) {
    return structured("weekly", PROMPTS.weekly(ctx), WeeklyReviewSchema);
  }
}
