"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { getAIService } from "@/lib/ai";
import { buildAIContext } from "@/lib/ai/service";
import { track, registerAnalyticsSink, type AnalyticsEventName } from "@/lib/analytics";
import {
  ACHIEVEMENT_DEFS,
  daysBetween,
  levelFromXp,
  todayISO,
} from "@/lib/gamification";
import { canUseCoach, canUseInsight, defaultSubscription, PREMIUM_LIMITS } from "@/lib/subscription";
import type {
  AchievementData,
  CheckInData,
  FormaState,
  GoalDraft,
  LifeAreaKey,
  Motivator,
  OnboardingBehavior,
  OnboardingConstraints,
  OnboardingStateScores,
  OnboardingWhy,
  TaskItem,
} from "@/lib/types";
import { uid } from "@/lib/utils";

/** Avoid re-hitting DeepSeek every page load when today's plan is still mock. */
const livePlanAttempted = new Set<string>();

const defaultStateScores: OnboardingStateScores = {
  sleep: 5,
  energy: 5,
  mood: 5,
  stress: 5,
  activity: 4,
  nutrition: 5,
  habits: 4,
  work: 5,
  social: 5,
  control: 4,
  satisfaction: 4,
};

const defaultBehavior: OnboardingBehavior = {
  sleepHours: 6.5,
  sleepStable: 4,
  phoneHours: 5,
  movementMinutes: 20,
  habitsToChange: [],
  triedBefore: "",
  whyFailed: "",
  quitPattern: "",
  discipline: 4,
};

const defaultConstraints: OnboardingConstraints = {
  minutesPerDay: 20,
  difficulty: 1,
  avoid: [],
  limits: "",
  preferTiny: true,
};

type Store = FormaState & {
  hydrateDone: () => void;
  setName: (name: string) => void;
  setOnboardingStep: (step: number) => void;
  setWhy: (why: OnboardingWhy) => void;
  setCurrentState: (s: Partial<OnboardingStateScores>) => void;
  setBehavior: (b: Partial<OnboardingBehavior>) => void;
  setConstraints: (c: Partial<OnboardingConstraints>) => void;
  setGoals: (goals: GoalDraft[]) => void;
  setMotivators: (m: Motivator[]) => void;
  startOnboarding: () => void;
  completeOnboarding: () => Promise<void>;
  ensureTodayPlan: () => Promise<void>;
  regenerateTodayPlan: () => Promise<void>;
  completeTask: (taskId: string) => void;
  skipTask: (taskId: string) => void;
  saveCheckIn: (data: Omit<CheckInData, "date"> & { date?: string }) => Promise<void>;
  addJournal: (body: string) => void;
  sendCoachMessage: (content: string) => Promise<string | null>;
  unlockPremium: () => void;
  cancelPremium: () => void;
  generateWeeklyReview: () => Promise<void>;
  resetAll: () => void;
  trackEvent: (name: AnalyticsEventName, props?: Record<string, unknown>) => void;
};

const initialProgress = {
  xp: 0,
  level: 1,
  levelTitle: "Точка старта",
  momentumDays: 0,
  totalTasks: 0,
  completedTasks: 0,
};

function areaLabels(key: LifeAreaKey) {
  const map: Record<LifeAreaKey, string> = {
    energy: "Энергия",
    sleep: "Сон",
    physical: "Движение",
    mind: "Голова",
    productivity: "Продуктивность",
    habits: "Привычки",
    social: "Социум",
    lifestyle: "Образ жизни",
  };
  return map[key];
}

function awardAchievements(
  current: AchievementData[],
  keys: string[],
): AchievementData[] {
  const have = new Set(current.map((a) => a.key));
  const next = [...current];
  for (const key of keys) {
    if (have.has(key)) continue;
    const def = ACHIEVEMENT_DEFS.find((d) => d.key === key);
    if (!def) continue;
    next.push({
      key: def.key,
      title: def.title,
      description: def.description,
      unlockedAt: new Date().toISOString(),
    });
    track("achievement_unlocked", { key });
  }
  return next;
}

export const useFormaStore = create<Store>()(
  persist(
    (set, get) => {
      registerAnalyticsSink((e) => {
        set((s) => ({ events: [...s.events.slice(-200), e] }));
      });

      return {
        hydrated: false,
        user: null,
        onboardingStep: 0,
        onboardingCompleted: false,
        why: { selected: [] },
        currentState: defaultStateScores,
        behavior: defaultBehavior,
        constraints: defaultConstraints,
        goals: [],
        motivators: ["visible_progress", "ai_feedback"],
        lifeProfile: null,
        checkIns: [],
        plans: [],
        progress: initialProgress,
        achievements: [],
        journal: [],
        coach: [],
        subscription: defaultSubscription(),
        weeklyReviews: [],
        events: [],

        hydrateDone: () => set({ hydrated: true }),

        trackEvent: (name, props) => track(name, props),

        setName: (name) =>
          set((s) => ({
            user: s.user
              ? { ...s.user, name }
              : { id: uid("user"), name, createdAt: new Date().toISOString() },
          })),

        setOnboardingStep: (step) => set({ onboardingStep: step }),
        setWhy: (why) => set({ why }),
        setCurrentState: (partial) =>
          set((s) => ({ currentState: { ...s.currentState, ...partial } })),
        setBehavior: (partial) =>
          set((s) => ({ behavior: { ...s.behavior, ...partial } })),
        setConstraints: (partial) =>
          set((s) => ({ constraints: { ...s.constraints, ...partial } })),
        setGoals: (goals) => set({ goals }),
        setMotivators: (motivators) => set({ motivators }),

        startOnboarding: () => {
          track("onboarding_started");
          set((s) => ({
            onboardingStep: 1,
            user:
              s.user ??
              ({
                id: uid("user"),
                name: "Konstantin",
                createdAt: new Date().toISOString(),
              } as const),
          }));
        },

        completeOnboarding: async () => {
          const ai = getAIService();
          const ctx = buildAIContext(get());
          const assessment = await ai.generateInitialAssessment(ctx);
          const lifeProfile = {
            areas: assessment.areas.map((a) => ({
              ...a,
              label: areaLabels(a.key),
            })),
            priorityArea: assessment.priority,
            secondaryArea: assessment.secondary,
            summary: assessment.summary,
            strategy: assessment.strategy,
          };
          set({
            lifeProfile,
            onboardingCompleted: true,
            onboardingStep: 0,
          });
          track("onboarding_completed", { priority: assessment.priority });
          await get().ensureTodayPlan();
        },

        ensureTodayPlan: async () => {
          const state = get();
          if (!state.onboardingCompleted) return;
          const date = todayISO();
          const existing = state.plans.find((p) => p.date === date);
          if (existing?.aiSource === "live") return;
          if (existing && livePlanAttempted.has(date)) return;
          livePlanAttempted.add(date);
          await get().regenerateTodayPlan();
        },

        regenerateTodayPlan: async () => {
          const state = get();
          if (!state.onboardingCompleted) return;
          const date = todayISO();
          livePlanAttempted.add(date);
          set((s) => ({ plans: s.plans.filter((p) => p.date !== date) }));
          const ai = getAIService();
          const planAI = await ai.generateDailyPlan(buildAIContext(get()));
          const aiSource =
            planAI.source === "live" || planAI.source === "mock"
              ? planAI.source
              : "mock";
          const tasks: TaskItem[] = planAI.tasks.map((t) => ({
            id: uid("task"),
            title: t.title,
            detail: t.detail,
            category: t.category,
            difficulty: t.difficulty,
            durationMin: t.duration,
            why: t.why,
            xp: t.xp ?? 10,
            status: "pending",
            date,
          }));
          tasks.forEach(() => track("task_created", { date, aiSource }));
          if (canUseInsight(state.subscription)) {
            set((s) => ({
              subscription: {
                ...s.subscription,
                aiInsightsUsed: s.subscription.aiInsightsUsed + 1,
              },
            }));
            track("ai_insight_viewed", { date, aiSource });
          }
          set((s) => ({
            plans: [
              ...s.plans.filter((p) => p.date !== date),
              {
                date,
                focusArea: planAI.priority,
                reason: planAI.reason,
                motivation: planAI.motivation,
                difficultyMode: planAI.difficultyMode,
                tasks,
                aiSource,
              },
            ],
          }));
        },

        completeTask: (taskId) => {
          const date = todayISO();
          if (typeof window !== "undefined") {
            try {
              window.Telegram?.WebApp?.HapticFeedback?.notificationOccurred("success");
            } catch {
              /* ignore */
            }
          }
          set((s) => {
            const plans = s.plans.map((p) => {
              if (p.date !== date) return p;
              return {
                ...p,
                tasks: p.tasks.map((t) =>
                  t.id === taskId
                    ? { ...t, status: "done" as const, completedAt: new Date().toISOString() }
                    : t,
                ),
              };
            });
            const task = s.plans.flatMap((p) => p.tasks).find((t) => t.id === taskId);
            const xpGain = task?.xp ?? 10;
            const xp = s.progress.xp + xpGain;
            const lvl = levelFromXp(xp);
            let momentum = s.progress.momentumDays;
            const last = s.progress.lastActiveDate;
            if (!last) momentum = 1;
            else {
              const gap = daysBetween(last, date);
              if (gap === 0) momentum = Math.max(1, momentum);
              else if (gap === 1) momentum = momentum + 1;
              else if (gap >= 3) {
                // comeback — don't zero forever, restart with credit
                momentum = 1;
              } else momentum = 1;
            }

            let achievements = s.achievements;
            const completedTotal = s.progress.completedTasks + 1;
            const unlock: string[] = [];
            if (completedTotal === 1) unlock.push("first_step");
            if (momentum >= 7) unlock.push("momentum_7");
            if (last && daysBetween(last, date) >= 3) unlock.push("comeback");
            if (momentum >= 14) unlock.push("no_zero_14");
            const hour = new Date().getHours();
            if (hour < 9) unlock.push("early_win");
            achievements = awardAchievements(achievements, unlock);

            const todayPlan = plans.find((p) => p.date === date);
            if (todayPlan && todayPlan.tasks.every((t) => t.status === "done" || t.status === "skipped")) {
              track("daily_plan_completed", { date });
            }

            return {
              plans,
              progress: {
                ...s.progress,
                xp,
                level: lvl.level,
                levelTitle: lvl.title,
                momentumDays: momentum,
                lastActiveDate: date,
                totalTasks: s.progress.totalTasks + (task ? 0 : 0),
                completedTasks: completedTotal,
              },
              achievements,
            };
          });
          track("task_completed", { taskId });
        },

        skipTask: (taskId) => {
          const date = todayISO();
          set((s) => ({
            plans: s.plans.map((p) =>
              p.date !== date
                ? p
                : {
                    ...p,
                    tasks: p.tasks.map((t) =>
                      t.id === taskId ? { ...t, status: "skipped" as const } : t,
                    ),
                  },
            ),
          }));
          track("task_skipped", { taskId });
        },

        saveCheckIn: async (data) => {
          track("checkin_started");
          const date = data.date ?? todayISO();
          const checkIn: CheckInData = { ...data, date };
          set((s) => ({
            checkIns: [...s.checkIns.filter((c) => c.date !== date), checkIn],
          }));
          const ai = getAIService();
          const analysis = await ai.analyzeCheckIn(buildAIContext(get()), checkIn);
          // regenerate today plan lightly if reduce advice and plan not mostly done
          const state = get();
          const plan = state.plans.find((p) => p.date === date);
          if (analysis.loadAdvice === "reduce" && plan) {
            const pending = plan.tasks.filter((t) => t.status === "pending");
            if (pending.length > 2) {
              const keep = pending.slice(0, 2).map((t) => t.id);
              set((s) => ({
                plans: s.plans.map((p) =>
                  p.date !== date
                    ? p
                    : {
                        ...p,
                        difficultyMode: "ease",
                        reason: analysis.insight,
                        tasks: p.tasks.map((t) =>
                          t.status === "pending" && !keep.includes(t.id)
                            ? { ...t, status: "skipped" as const }
                            : t,
                        ),
                      },
                ),
              }));
            } else {
              set((s) => ({
                plans: s.plans.map((p) =>
                  p.date === date ? { ...p, reason: analysis.insight } : p,
                ),
              }));
            }
          }
          let achievements = get().achievements;
          if (get().checkIns.length >= 3) {
            achievements = awardAchievements(achievements, ["checkin_3"]);
            set({ achievements });
          }
          track("checkin_completed", { date });
        },

        addJournal: (body) => {
          const date = todayISO();
          set((s) => ({
            journal: [
              ...s.journal,
              { id: uid("j"), date, body, createdAt: new Date().toISOString() },
            ],
          }));
        },

        sendCoachMessage: async (content) => {
          track("coach_opened");
          const state = get();
          if (!canUseCoach(state.subscription)) {
            return null;
          }
          const userMsg = {
            id: uid("m"),
            role: "user" as const,
            content,
            createdAt: new Date().toISOString(),
          };
          set((s) => ({ coach: [...s.coach, userMsg] }));
          const ai = getAIService();
          const res = await ai.generateCoachResponse(buildAIContext(get()), content);
          const assistant = {
            id: uid("m"),
            role: "assistant" as const,
            content: res.reply,
            createdAt: new Date().toISOString(),
          };
          set((s) => ({
            coach: [...s.coach, assistant],
            subscription: {
              ...s.subscription,
              coachMessagesUsed: s.subscription.coachMessagesUsed + 1,
            },
          }));
          track("coach_message_sent", { safety: res.safetyTriggered });
          return res.reply;
        },

        unlockPremium: () => {
          set({
            subscription: {
              plan: "premium",
              status: "active",
              aiInsightsUsed: 0,
              aiInsightsLimit: Number.MAX_SAFE_INTEGER,
              coachMessagesUsed: 0,
              coachMessagesLimit: Number.MAX_SAFE_INTEGER,
            },
          });
          track("subscription_started", { plan: "premium" });
          // silence unused
          void PREMIUM_LIMITS;
        },

        cancelPremium: () => {
          set({ subscription: { ...defaultSubscription(), status: "cancelled" } });
          track("subscription_cancelled");
        },

        generateWeeklyReview: async () => {
          const ai = getAIService();
          const review = await ai.generateWeeklyReview(buildAIContext(get()));
          const weekStart = todayISO();
          const tasks = get().plans.slice(-7).flatMap((p) => p.tasks);
          set((s) => ({
            weeklyReviews: [
              ...s.weeklyReviews.filter((w) => w.weekStart !== weekStart),
              {
                weekStart,
                days: Math.min(7, s.plans.length),
                tasksTotal: tasks.length,
                tasksCompleted: tasks.filter((t) => t.status === "done").length,
                completionRate: review.completionRate,
                areaDeltas: review.areaDeltas,
                biggestWin: review.biggestWin,
                needsAttention: review.needsAttention,
                nextFocus: review.nextFocus,
                aiNote: review.aiNote,
              },
            ],
            achievements: awardAchievements(s.achievements, ["week_review"]),
          }));
          track("weekly_review_viewed");
        },

        resetAll: () => {
          set({
            user: null,
            onboardingStep: 0,
            onboardingCompleted: false,
            why: { selected: [] },
            currentState: defaultStateScores,
            behavior: defaultBehavior,
            constraints: defaultConstraints,
            goals: [],
            motivators: ["visible_progress", "ai_feedback"],
            lifeProfile: null,
            checkIns: [],
            plans: [],
            progress: initialProgress,
            achievements: [],
            journal: [],
            coach: [],
            subscription: defaultSubscription(),
            weeklyReviews: [],
          });
        },
      };
    },
    {
      name: "forma-mvp-v2-ru",
      onRehydrateStorage: () => (state) => {
        state?.hydrateDone();
      },
      partialize: (s) => {
        const { hydrated: _h, ...rest } = s as Store & { hydrated: boolean };
        // strip functions automatically by zustand persist of state fields only
        return {
          user: rest.user,
          onboardingStep: rest.onboardingStep,
          onboardingCompleted: rest.onboardingCompleted,
          why: rest.why,
          currentState: rest.currentState,
          behavior: rest.behavior,
          constraints: rest.constraints,
          goals: rest.goals,
          motivators: rest.motivators,
          lifeProfile: rest.lifeProfile,
          checkIns: rest.checkIns,
          plans: rest.plans,
          progress: rest.progress,
          achievements: rest.achievements,
          journal: rest.journal,
          coach: rest.coach,
          subscription: rest.subscription,
          weeklyReviews: rest.weeklyReviews,
          events: rest.events,
        };
      },
    },
  ),
);
