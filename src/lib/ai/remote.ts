import type { AIContext, AIService } from "@/lib/ai/service";
import { MockAIService } from "@/lib/ai/mock";
import { publicAiApiBase } from "@/lib/ai/config";
import type { CheckInData } from "@/lib/types";
import type {
  CheckInAnalysis,
  CoachResponseAI,
  DailyPlanAI,
  DifficultyAdjust,
  InitialAssessment,
  MotivationAI,
  ProgressAnalysis,
  WeeklyReviewAI,
} from "@/lib/ai/schemas";

type Action =
  | "initialAssessment"
  | "dailyPlan"
  | "checkIn"
  | "progress"
  | "motivation"
  | "difficulty"
  | "coach"
  | "weekly";

/**
 * Client-side AI that calls our Next.js API proxy (holds Timeweb key server-side).
 * Falls back to mock if network/API fails.
 */
export class RemoteAIService implements AIService {
  private mock = new MockAIService();

  private async call<T>(
    action: Action,
    payload: { ctx: AIContext; checkIn?: CheckInData; message?: string; count?: number },
    fallback: () => Promise<T>,
  ): Promise<T> {
    const base = publicAiApiBase();
    const url = `${base}/api/ai`;
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ...payload }),
      });
      if (!res.ok) throw new Error(`AI API ${res.status}`);
      const data = await res.json();
      if (!data?.ok) throw new Error(data?.error || "AI failed");
      return data.result as T;
    } catch (err) {
      console.warn(`[remote-ai:${action}] fallback`, err);
      return fallback();
    }
  }

  generateInitialAssessment(ctx: AIContext): Promise<InitialAssessment> {
    return this.call("initialAssessment", { ctx }, () =>
      this.mock.generateInitialAssessment(ctx),
    );
  }

  generateDailyPlan(ctx: AIContext): Promise<DailyPlanAI> {
    return this.call("dailyPlan", { ctx }, () => this.mock.generateDailyPlan(ctx));
  }

  async generateTasks(ctx: AIContext, count: number) {
    const plan = await this.generateDailyPlan(ctx);
    return plan.tasks.slice(0, count);
  }

  analyzeCheckIn(ctx: AIContext, checkIn: CheckInData): Promise<CheckInAnalysis> {
    return this.call("checkIn", { ctx, checkIn }, () =>
      this.mock.analyzeCheckIn(ctx, checkIn),
    );
  }

  analyzeProgress(ctx: AIContext): Promise<ProgressAnalysis> {
    return this.call("progress", { ctx }, () => this.mock.analyzeProgress(ctx));
  }

  generateMotivation(ctx: AIContext): Promise<MotivationAI> {
    return this.call("motivation", { ctx }, () => this.mock.generateMotivation(ctx));
  }

  adjustDifficulty(ctx: AIContext): Promise<DifficultyAdjust> {
    return this.call("difficulty", { ctx }, () => this.mock.adjustDifficulty(ctx));
  }

  generateCoachResponse(ctx: AIContext, message: string): Promise<CoachResponseAI> {
    return this.call("coach", { ctx, message }, () =>
      this.mock.generateCoachResponse(ctx, message),
    );
  }

  generateWeeklyReview(ctx: AIContext): Promise<WeeklyReviewAI> {
    return this.call("weekly", { ctx }, () => this.mock.generateWeeklyReview(ctx));
  }
}
