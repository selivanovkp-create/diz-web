import type { AIContext, AIService } from "@/lib/ai/service";
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

type AiSource = "live" | "mock";

/**
 * Browser → same-origin /api/ai (Timeweb key stays on server).
 * No silent mock fallback — errors surface to the UI.
 */
export class RemoteAIService implements AIService {
  lastSource: AiSource = "mock";
  lastError: string | null = null;

  private async call<T extends object>(
    action: Action,
    payload: {
      ctx: AIContext;
      checkIn?: CheckInData;
      message?: string;
      count?: number;
    },
  ): Promise<T & { source?: AiSource }> {
    const base = publicAiApiBase();
    const url = `${base}/api/ai`;
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ...payload }),
        signal: AbortSignal.timeout(120_000),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok) {
        throw new Error(data?.error || `AI API ${res.status}`);
      }
      const source: AiSource = data.source === "live" ? "live" : "mock";
      this.lastSource = source;
      this.lastError = null;
      if (source !== "live") {
        throw new Error(
          "Сервер вернул заглушку вместо DeepSeek. Попробуй ещё раз.",
        );
      }
      return { ...(data.result as T), source };
    } catch (err) {
      this.lastSource = "mock";
      this.lastError = err instanceof Error ? err.message : "AI error";
      console.warn(`[remote-ai:${action}]`, err);
      throw err instanceof Error ? err : new Error(String(err));
    }
  }

  generateInitialAssessment(ctx: AIContext): Promise<InitialAssessment> {
    return this.call("initialAssessment", { ctx });
  }

  generateDailyPlan(ctx: AIContext): Promise<DailyPlanAI> {
    return this.call("dailyPlan", { ctx });
  }

  async generateTasks(ctx: AIContext, count: number) {
    const plan = await this.generateDailyPlan(ctx);
    return plan.tasks.slice(0, count);
  }

  analyzeCheckIn(ctx: AIContext, checkIn: CheckInData): Promise<CheckInAnalysis> {
    return this.call("checkIn", { ctx, checkIn });
  }

  analyzeProgress(ctx: AIContext): Promise<ProgressAnalysis> {
    return this.call("progress", { ctx });
  }

  generateMotivation(ctx: AIContext): Promise<MotivationAI> {
    return this.call("motivation", { ctx });
  }

  adjustDifficulty(ctx: AIContext): Promise<DifficultyAdjust> {
    return this.call("difficulty", { ctx });
  }

  generateCoachResponse(ctx: AIContext, message: string): Promise<CoachResponseAI> {
    return this.call("coach", { ctx, message });
  }

  generateWeeklyReview(ctx: AIContext): Promise<WeeklyReviewAI> {
    return this.call("weekly", { ctx });
  }
}
