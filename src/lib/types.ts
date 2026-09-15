export type LifeAreaKey =
  | "energy"
  | "sleep"
  | "physical"
  | "mind"
  | "productivity"
  | "habits"
  | "social"
  | "lifestyle";

export type Trend = "up" | "down" | "stable";

export type Motivator =
  | "competition"
  | "streaks"
  | "visible_progress"
  | "achievements"
  | "statistics"
  | "rewards"
  | "narrative"
  | "ai_feedback"
  | "financial";

export type WhyOption =
  | "energy"
  | "sleep"
  | "fitness"
  | "nutrition"
  | "smoking"
  | "alcohol"
  | "stress"
  | "productivity"
  | "discipline"
  | "relationships"
  | "confidence"
  | "appearance"
  | "focus"
  | "other";

export interface AreaState {
  key: LifeAreaKey;
  label: string;
  score: number;
  trend: Trend;
  confidence: number;
  problems: string[];
  goals: string[];
}

export interface LifeProfile {
  areas: AreaState[];
  priorityArea: LifeAreaKey;
  secondaryArea?: LifeAreaKey;
  summary: string;
  strategy: string[];
}

export interface OnboardingWhy {
  selected: WhyOption[];
  custom?: string;
}

export interface OnboardingStateScores {
  sleep: number;
  energy: number;
  mood: number;
  stress: number;
  activity: number;
  nutrition: number;
  habits: number;
  work: number;
  social: number;
  control: number;
  satisfaction: number;
}

export interface OnboardingBehavior {
  sleepHours: number;
  sleepStable: number;
  phoneHours: number;
  movementMinutes: number;
  habitsToChange: string[];
  triedBefore: string;
  whyFailed: string;
  quitPattern: string;
  discipline: number;
}

export interface OnboardingConstraints {
  minutesPerDay: number;
  difficulty: 1 | 2 | 3;
  avoid: string[];
  limits: string;
  preferTiny: boolean;
}

export interface GoalDraft {
  id: string;
  title: string;
  area: LifeAreaKey | "general";
  priority: number;
}

export interface CheckInData {
  date: string;
  energy: number;
  mood: number;
  sleep: number;
  stress: number;
  activity: number;
  focus: number;
  drive: number;
  habits: number;
  control: number;
  note?: string;
}

export interface TaskItem {
  id: string;
  title: string;
  detail?: string;
  category: string;
  difficulty: number;
  durationMin?: number;
  why?: string;
  /** Step-by-step how-to for the detail sheet */
  steps?: string[];
  doneWhen?: string;
  tip?: string;
  xp: number;
  status: "pending" | "done" | "skipped";
  date: string;
  completedAt?: string;
}

export type AISource = "live" | "mock";

export interface DailyPlanData {
  date: string;
  /** Which problem-track this plan belongs to */
  trackId?: string;
  focusArea: LifeAreaKey;
  reason: string;
  motivation: string;
  difficultyMode: "ease" | "hold" | "push";
  tasks: TaskItem[];
  /** live = Timeweb DeepSeek; mock = local fallback / old cache */
  aiSource?: AISource;
}

/** One problem the user works on in parallel (own onboarding + plan). */
export interface FocusTrack {
  id: string;
  label: string;
  why: OnboardingWhy;
  currentState: OnboardingStateScores;
  behavior: OnboardingBehavior;
  constraints: OnboardingConstraints;
  goals: GoalDraft[];
  lifeProfile: LifeProfile | null;
  createdAt: string;
}

export type OnboardingMode = "idle" | "add";

export interface ProgressData {
  xp: number;
  level: number;
  levelTitle: string;
  momentumDays: number;
  lastActiveDate?: string;
  totalTasks: number;
  completedTasks: number;
}

export interface AchievementData {
  key: string;
  title: string;
  description: string;
  unlockedAt: string;
}

export interface JournalNote {
  id: string;
  date: string;
  body: string;
  createdAt: string;
}

export interface CoachMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  createdAt: string;
}

export interface SubscriptionData {
  plan: "free" | "premium";
  status: "active" | "cancelled";
  aiInsightsUsed: number;
  aiInsightsLimit: number;
  coachMessagesUsed: number;
  coachMessagesLimit: number;
}

export interface WeeklyReviewData {
  weekStart: string;
  days: number;
  tasksTotal: number;
  tasksCompleted: number;
  completionRate: number;
  areaDeltas: { key: LifeAreaKey; label: string; delta: number }[];
  biggestWin: string;
  needsAttention: string;
  nextFocus: string;
  aiNote: string;
}

export interface AppUser {
  id: string;
  name: string;
  createdAt: string;
}

export interface FormaState {
  hydrated: boolean;
  user: AppUser | null;
  onboardingStep: number;
  onboardingCompleted: boolean;
  /** idle = normal; add = onboarding a new problem track */
  onboardingMode: OnboardingMode;
  /** Parallel problems; active mirrored into why/currentState/… */
  tracks: FocusTrack[];
  activeTrackId: string | null;
  why: OnboardingWhy;
  currentState: OnboardingStateScores;
  behavior: OnboardingBehavior;
  constraints: OnboardingConstraints;
  goals: GoalDraft[];
  motivators: Motivator[];
  lifeProfile: LifeProfile | null;
  checkIns: CheckInData[];
  plans: DailyPlanData[];
  progress: ProgressData;
  achievements: AchievementData[];
  journal: JournalNote[];
  coach: CoachMessage[];
  subscription: SubscriptionData;
  weeklyReviews: WeeklyReviewData[];
  events: { name: string; props?: Record<string, unknown>; at: string }[];
}
