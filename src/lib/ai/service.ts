import type {
  CheckInData,
  FormaState,
  JournalNote,
  OnboardingBehavior,
  OnboardingConstraints,
  OnboardingStateScores,
  OnboardingWhy,
  GoalDraft,
  Motivator,
  TaskItem,
} from "@/lib/types";
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

export interface AIContext {
  name: string;
  why: OnboardingWhy;
  currentState: OnboardingStateScores;
  behavior: OnboardingBehavior;
  constraints: OnboardingConstraints;
  goals: GoalDraft[];
  motivators: Motivator[];
  checkIns: CheckInData[];
  recentTasks: TaskItem[];
  journal: JournalNote[];
  completionRate14d: number;
  momentumDays: number;
  lifeProfileSummary?: string;
  priorityArea?: string;
  subscriptionPlan: "free" | "premium";
}

export interface AIService {
  generateInitialAssessment(ctx: AIContext): Promise<InitialAssessment>;
  generateDailyPlan(ctx: AIContext): Promise<DailyPlanAI>;
  generateTasks(ctx: AIContext, count: number): Promise<DailyPlanAI["tasks"]>;
  analyzeCheckIn(ctx: AIContext, checkIn: CheckInData): Promise<CheckInAnalysis>;
  analyzeProgress(ctx: AIContext): Promise<ProgressAnalysis>;
  generateMotivation(ctx: AIContext): Promise<MotivationAI>;
  adjustDifficulty(ctx: AIContext): Promise<DifficultyAdjust>;
  generateCoachResponse(ctx: AIContext, message: string): Promise<CoachResponseAI>;
  generateWeeklyReview(ctx: AIContext): Promise<WeeklyReviewAI>;
}

export function buildAIContext(state: FormaState): AIContext {
  const last14 = state.checkIns.slice(-14);
  const plans = state.plans.slice(-14);
  const tasks = plans.flatMap((p) => p.tasks);
  const done = tasks.filter((t) => t.status === "done").length;
  const completionRate14d = tasks.length ? done / tasks.length : 0.5;

  return {
    name: state.user?.name ?? "друг",
    why: state.why,
    currentState: state.currentState,
    behavior: state.behavior,
    constraints: state.constraints,
    goals: state.goals,
    motivators: state.motivators,
    checkIns: state.checkIns,
    recentTasks: tasks.slice(-40),
    journal: state.journal.slice(-20),
    completionRate14d,
    momentumDays: state.progress.momentumDays,
    lifeProfileSummary: state.lifeProfile?.summary,
    priorityArea: state.lifeProfile?.priorityArea,
    subscriptionPlan: state.subscription.plan,
  };
}
