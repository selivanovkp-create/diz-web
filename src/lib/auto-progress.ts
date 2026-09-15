import { CHECKIN_BY_WHY } from "@/lib/checkin-plot";
import { primaryWhy, whyLabel } from "@/lib/plot";
import type {
  DailyPlanData,
  FocusTrack,
  OnboardingStateScores,
  WhyOption,
} from "@/lib/types";

export type AutoProgress = {
  label: string;
  /** 0–100: onboarding baseline + automatic drift from actions */
  score: number;
  baseline: number;
  delta: number;
  stepsDone: number;
  minutesDone: number;
  activeDays: number;
  calendarDays: number;
  consistency: number;
  streak: number;
  series: { date: string; score: number; steps: number }[];
  empty: boolean;
};

function clamp(n: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, Math.round(n)));
}

function dayList(fromISO: string, toISO: string): string[] {
  const out: string[] = [];
  const cur = new Date(`${fromISO}T12:00:00`);
  const end = new Date(`${toISO}T12:00:00`);
  if (Number.isNaN(cur.getTime()) || Number.isNaN(end.getTime())) return out;
  while (cur <= end) {
    out.push(cur.toISOString().slice(0, 10));
    cur.setDate(cur.getDate() + 1);
  }
  return out;
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function score10ForWhy(why: WhyOption, state: OnboardingStateScores): number {
  const field = CHECKIN_BY_WHY[why].field;
  if (field === "stress") return Math.max(1, 11 - state.stress);
  if (field === "focus") return state.work;
  if (field === "drive") return state.energy;
  if (field === "energy") return state.energy;
  if (field === "sleep") return state.sleep;
  if (field === "mood") return state.mood;
  if (field === "activity") return state.activity;
  if (field === "habits") return state.habits;
  if (field === "control") return state.control;
  return state.satisfaction;
}

/** Baseline 0–100 from onboarding scales for selected whys. */
export function baselineFromState(
  whySelected: WhyOption[],
  state: OnboardingStateScores,
): number {
  const goals = whySelected.length ? whySelected : (["other"] as WhyOption[]);
  const vals = goals.map((w) => score10ForWhy(w, state));
  const avg10 = vals.reduce((a, b) => a + b, 0) / vals.length;
  return clamp(avg10 * 10);
}

/**
 * Automatic progress for a track — no extra user marks.
 * Score starts at onboarding baseline and moves only from completed steps
 * and inactive gaps.
 */
export function computeAutoProgress(
  track: FocusTrack | null | undefined,
  plans: DailyPlanData[],
  fallbackWhy: WhyOption[] = [],
  fallbackState?: OnboardingStateScores,
): AutoProgress {
  const whySelected = track?.why.selected?.length
    ? track.why.selected
    : fallbackWhy;
  const label = track?.label || whyLabel(primaryWhy(whySelected));
  const state = track?.currentState ?? fallbackState;
  const baseline = state ? baselineFromState(whySelected, state) : 40;

  const sorted = [...plans].sort((a, b) => a.date.localeCompare(b.date));
  const start =
    track?.createdAt?.slice(0, 10) || sorted[0]?.date || todayISO();
  const end = todayISO();
  const days = dayList(start, end);
  const byDate = new Map(sorted.map((p) => [p.date, p]));

  let score = baseline;
  const series: AutoProgress["series"] = [];
  let stepsDone = 0;
  let minutesDone = 0;
  let activeDays = 0;
  let streak = 0;
  let lockingStreak = false;

  for (const date of days) {
    const plan = byDate.get(date);
    const doneTasks = (plan?.tasks ?? []).filter((t) => t.status === "done");
    const steps = doneTasks.length;
    const minutes = doneTasks.reduce((s, t) => s + (t.durationMin ?? 5), 0);

    if (steps > 0) {
      activeDays += 1;
      stepsDone += steps;
      minutesDone += minutes;
      const lift = Math.min(8, 2.2 * steps + Math.min(minutes, 40) / 20);
      const room = Math.max(0.25, (100 - score) / 100);
      score = clamp(score + lift * room);
    } else if (activeDays > 0 || score !== baseline) {
      score = clamp(score - 1.4);
    }

    series.push({ date, score: clamp(score), steps });
  }

  for (let i = days.length - 1; i >= 0; i--) {
    const d = days[i]!;
    const plan = byDate.get(d);
    const had = (plan?.tasks ?? []).some((t) => t.status === "done");
    if (had) {
      if (!lockingStreak) streak += 1;
    } else if (d === end) {
      continue;
    } else if (streak > 0) {
      lockingStreak = true;
      break;
    }
  }

  const calendarDays = Math.max(1, days.length);
  const consistency = clamp((activeDays / calendarDays) * 100);

  return {
    label,
    score: clamp(score),
    baseline: clamp(baseline),
    delta: clamp(score) - clamp(baseline),
    stepsDone,
    minutesDone,
    activeDays,
    calendarDays,
    consistency,
    streak,
    series: series.slice(-14),
    empty: stepsDone === 0 && activeDays === 0,
  };
}
