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
import {
  buildTrackFromState,
  migrateTracksIfNeeded,
  mirrorTrackFields,
  plansForTrack,
  trackLabelFromWhy,
} from "@/lib/tracks";
import type {
  AchievementData,
  CheckInData,
  FocusTrack,
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

function isTodayPlanForActive(
  p: FormaState["plans"][number],
  date: string,
  activeTrackId: string | null,
) {
  return (
    p.date === date &&
    (!activeTrackId || p.trackId === activeTrackId || !p.trackId)
  );
}

function patchActiveTrack(
  s: Pick<FormaState, "tracks" | "activeTrackId" | "onboardingMode">,
  patch: Partial<FocusTrack>,
): FocusTrack[] {
  if (!s.activeTrackId || s.onboardingMode !== "idle") return s.tracks;
  return s.tracks.map((t) =>
    t.id === s.activeTrackId ? { ...t, ...patch } : t,
  );
}

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
  setActiveTrack: (id: string) => void;
  startAddTrack: () => void;
  removeTrack: (id: string) => void;
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
        onboardingMode: "idle",
        tracks: [],
        activeTrackId: null,
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

        setWhy: (why) =>
          set((s) => ({
            why,
            tracks: patchActiveTrack(s, {
              why,
              label: trackLabelFromWhy(why),
            }),
          })),

        setCurrentState: (partial) =>
          set((s) => {
            const currentState = { ...s.currentState, ...partial };
            return {
              currentState,
              tracks: patchActiveTrack(s, { currentState }),
            };
          }),

        setBehavior: (partial) =>
          set((s) => {
            const behavior = { ...s.behavior, ...partial };
            return {
              behavior,
              tracks: patchActiveTrack(s, { behavior }),
            };
          }),

        setConstraints: (partial) =>
          set((s) => {
            const constraints = { ...s.constraints, ...partial };
            return {
              constraints,
              tracks: patchActiveTrack(s, { constraints }),
            };
          }),

        setGoals: (goals) =>
          set((s) => ({
            goals,
            tracks: patchActiveTrack(s, { goals }),
          })),

        setMotivators: (motivators) => set({ motivators }),

        setActiveTrack: (id) => {
          const found = get().tracks.find((t) => t.id === id);
          if (!found) return;
          set({
            activeTrackId: id,
            ...mirrorTrackFields(found),
          });
        },

        startAddTrack: () => {
          track("onboarding_started", { mode: "add" });
          set({
            onboardingMode: "add",
            onboardingStep: 1,
            why: { selected: [] },
            currentState: defaultStateScores,
            behavior: defaultBehavior,
            constraints: defaultConstraints,
            goals: [],
            lifeProfile: null,
          });
        },

        removeTrack: (id) => {
          set((s) => {
            const tracks = s.tracks.filter((t) => t.id !== id);
            const plans = s.plans.filter((p) => p.trackId !== id);
            if (s.activeTrackId !== id) {
              return { tracks, plans };
            }
            const next = tracks[0] ?? null;
            if (next) {
              return {
                tracks,
                plans,
                activeTrackId: next.id,
                ...mirrorTrackFields(next),
              };
            }
            return {
              tracks,
              plans,
              activeTrackId: null,
              why: { selected: [] },
              currentState: defaultStateScores,
              behavior: defaultBehavior,
              constraints: defaultConstraints,
              goals: [],
              lifeProfile: null,
            };
          });
        },

        startOnboarding: () => {
          track("onboarding_started");
          set((s) => ({
            onboardingStep: 1,
            onboardingMode: "idle",
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
          const planAI = await ai.generateDailyPlan({
            ...ctx,
            priorityArea: assessment.priority,
            lifeProfileSummary: assessment.summary,
          });
          const date = todayISO();
          const aiSource =
            planAI.source === "live" || planAI.source === "mock"
              ? planAI.source
              : "live";
          if (aiSource !== "live") {
            throw new Error("DeepSeek вернул заглушку вместо живого плана");
          }
          const tasks: TaskItem[] = planAI.tasks.map((t) => ({
            id: uid("task"),
            title: t.title,
            detail: t.detail,
            category: t.category,
            difficulty: t.difficulty ?? 2,
            durationMin: t.duration,
            why: t.why,
            steps: t.steps,
            doneWhen: t.doneWhen,
            tip: t.tip,
            xp: t.xp ?? 10,
            status: "pending" as const,
            date,
          }));
          const lifeProfile = {
            areas: assessment.areas.map((a) => ({
              ...a,
              score: Math.round(Number(a.score)),
              label: areaLabels(a.key),
            })),
            priorityArea: assessment.priority,
            secondaryArea: assessment.secondary,
            summary: assessment.summary,
            strategy: assessment.strategy,
          };

          const state = get();
          const focusTrack = buildTrackFromState({
            why: state.why,
            currentState: state.currentState,
            behavior: state.behavior,
            constraints: state.constraints,
            goals: state.goals,
            lifeProfile,
          });
          const appending =
            state.onboardingMode === "add" || state.tracks.length > 0;
          const tracks = appending
            ? [...state.tracks, focusTrack]
            : [focusTrack];

          livePlanAttempted.add(`${focusTrack.id}:${date}`);

          set({
            tracks,
            activeTrackId: focusTrack.id,
            ...mirrorTrackFields(focusTrack),
            onboardingCompleted: true,
            onboardingMode: "idle",
            onboardingStep: 0,
            plans: [
              ...state.plans.filter((p) => {
                if (p.date !== date) return true;
                if (appending) return p.trackId !== focusTrack.id;
                return false;
              }),
              {
                date,
                trackId: focusTrack.id,
                focusArea: planAI.priority,
                reason: planAI.reason,
                motivation: planAI.motivation,
                difficultyMode: planAI.difficultyMode,
                tasks,
                aiSource,
              },
            ],
          });
          track("onboarding_completed", {
            priority: assessment.priority,
            aiSource,
            trackId: focusTrack.id,
          });
          tasks.forEach(() =>
            track("task_created", { date, aiSource, trackId: focusTrack.id }),
          );
        },

        ensureTodayPlan: async () => {
          const state = get();
          if (!state.onboardingCompleted) return;
          const date = todayISO();
          const { activeTrackId } = state;
          const existing = state.plans.find((p) =>
            isTodayPlanForActive(p, date, activeTrackId),
          );
          if (existing?.aiSource === "live") return;
          const attemptKey = `${activeTrackId}:${date}`;
          if (existing && livePlanAttempted.has(attemptKey)) return;
          livePlanAttempted.add(attemptKey);
          await get().regenerateTodayPlan();
        },

        regenerateTodayPlan: async () => {
          const state = get();
          if (!state.onboardingCompleted) return;
          const date = todayISO();
          const { activeTrackId } = state;
          livePlanAttempted.add(`${activeTrackId}:${date}`);
          set((s) => ({
            plans: s.plans.filter(
              (p) => !isTodayPlanForActive(p, date, s.activeTrackId),
            ),
          }));
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
            difficulty: t.difficulty ?? 2,
            durationMin: t.duration,
            why: t.why,
            steps: t.steps,
            doneWhen: t.doneWhen,
            tip: t.tip,
            xp: t.xp ?? 10,
            status: "pending" as const,
            date,
          }));
          tasks.forEach(() =>
            track("task_created", {
              date,
              aiSource,
              trackId: activeTrackId ?? undefined,
            }),
          );
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
              ...s.plans.filter(
                (p) => !isTodayPlanForActive(p, date, s.activeTrackId),
              ),
              {
                date,
                trackId: s.activeTrackId ?? undefined,
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
              if (!isTodayPlanForActive(p, date, s.activeTrackId)) return p;
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
            if (momentum >= 3) unlock.push("checkin_3");
            if (momentum >= 7) unlock.push("momentum_7");
            if (last && daysBetween(last, date) >= 3) unlock.push("comeback");
            if (momentum >= 14) unlock.push("no_zero_14");
            const hour = new Date().getHours();
            if (hour < 9) unlock.push("early_win");
            achievements = awardAchievements(achievements, unlock);

            const todayPlan = plans.find((p) =>
              isTodayPlanForActive(p, date, s.activeTrackId),
            );
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
              !isTodayPlanForActive(p, date, s.activeTrackId)
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
          const plan = state.plans.find((p) =>
            isTodayPlanForActive(p, date, state.activeTrackId),
          );
          if (analysis.loadAdvice === "reduce" && plan) {
            const pending = plan.tasks.filter((t) => t.status === "pending");
            if (pending.length > 2) {
              const keep = pending.slice(0, 2).map((t) => t.id);
              set((s) => ({
                plans: s.plans.map((p) =>
                  !isTodayPlanForActive(p, date, s.activeTrackId)
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
                  isTodayPlanForActive(p, date, s.activeTrackId)
                    ? { ...p, reason: analysis.insight }
                    : p,
                ),
              }));
            }
          }
          let achievements = get().achievements;
          if (get().progress.momentumDays >= 3) {
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
          try {
            const ai = getAIService();
            const res = await ai.generateCoachResponse(
              buildAIContext(get()),
              content,
            );
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
            track("coach_message_sent", {
              safety: res.safetyTriggered,
              aiSource: res.source ?? "live",
            });
            return res.reply;
          } catch (err) {
            const msg =
              err instanceof Error
                ? err.message
                : "Не удалось получить ответ DeepSeek";
            const assistant = {
              id: uid("m"),
              role: "assistant" as const,
              content: `Сейчас AI недоступен: ${msg}. Нажми ещё раз через пару секунд.`,
              createdAt: new Date().toISOString(),
            };
            set((s) => ({ coach: [...s.coach, assistant] }));
            return assistant.content;
          }
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
            onboardingMode: "idle",
            tracks: [],
            activeTrackId: null,
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
        if (!state) return;
        const migrated = migrateTracksIfNeeded(state as FormaState);
        Object.assign(state, migrated);
        state.hydrateDone();
      },
      partialize: (s) => {
        const { hydrated: _h, ...rest } = s as Store & { hydrated: boolean };
        // strip functions automatically by zustand persist of state fields only
        return {
          user: rest.user,
          onboardingStep: rest.onboardingStep,
          onboardingCompleted: rest.onboardingCompleted,
          onboardingMode: rest.onboardingMode,
          tracks: rest.tracks,
          activeTrackId: rest.activeTrackId,
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
