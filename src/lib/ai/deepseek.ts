import type { AIContext, AIService } from "@/lib/ai/service";
import { MockAIService } from "@/lib/ai/mock";
import { chatCompletion, extractJson } from "@/lib/ai/llm";
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

async function structured<T>(
  action: string,
  user: string,
  schema: ZodType<T>,
  fallback: () => Promise<T>,
): Promise<T> {
  try {
    const raw = await chatCompletion({
      system: systemFor(action),
      user,
      temperature: 0.35,
    });
    const parsed = extractJson(raw);
    return schema.parse(parsed);
  } catch (err) {
    console.warn(`[ai:${action}] fallback to mock`, err);
    return fallback();
  }
}

export class TimewebDeepSeekService implements AIService {
  private mock = new MockAIService();

  async generateInitialAssessment(ctx: AIContext) {
    return structured(
      "initialAssessment",
      PROMPTS.initialAssessment(ctx),
      InitialAssessmentSchema,
      () => this.mock.generateInitialAssessment(ctx),
    );
  }

  async generateDailyPlan(ctx: AIContext) {
    return structured(
      "dailyPlan",
      PROMPTS.dailyPlan(ctx),
      DailyPlanSchema,
      () => this.mock.generateDailyPlan(ctx),
    );
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
      () => this.mock.analyzeCheckIn(ctx, checkIn),
    );
  }

  async analyzeProgress(ctx: AIContext) {
    return structured(
      "progress",
      PROMPTS.progress(ctx),
      ProgressAnalysisSchema,
      () => this.mock.analyzeProgress(ctx),
    );
  }

  async generateMotivation(ctx: AIContext) {
    return structured(
      "motivation",
      PROMPTS.motivation(ctx),
      MotivationSchema,
      () => this.mock.generateMotivation(ctx),
    );
  }

  async adjustDifficulty(ctx: AIContext) {
    return structured(
      "difficulty",
      PROMPTS.difficulty(ctx),
      DifficultyAdjustSchema,
      () => this.mock.adjustDifficulty(ctx),
    );
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
    return structured(
      "coach",
      PROMPTS.coach(ctx, message),
      CoachResponseSchema,
      () => this.mock.generateCoachResponse(ctx, message),
    );
  }

  async generateWeeklyReview(ctx: AIContext) {
    return structured(
      "weekly",
      PROMPTS.weekly(ctx),
      WeeklyReviewSchema,
      () => this.mock.generateWeeklyReview(ctx),
    );
  }
}
