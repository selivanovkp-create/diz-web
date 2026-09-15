import { primaryWhy, whyLabel } from "@/lib/plot";
import type {
  FocusTrack,
  FormaState,
  OnboardingWhy,
} from "@/lib/types";
import { uid } from "@/lib/utils";

export function trackLabelFromWhy(why: OnboardingWhy): string {
  if (why.selected.length === 0) {
    return why.custom?.trim().slice(0, 28) || "Новая тема";
  }
  if (why.selected.length === 1) return whyLabel(why.selected[0]!);
  return why.selected.map((w) => whyLabel(w)).join(" · ");
}

export function mirrorTrackFields(track: FocusTrack) {
  return {
    why: track.why,
    currentState: track.currentState,
    behavior: track.behavior,
    constraints: track.constraints,
    goals: track.goals,
    lifeProfile: track.lifeProfile,
  };
}

export function buildTrackFromState(
  state: Pick<
    FormaState,
    "why" | "currentState" | "behavior" | "constraints" | "goals" | "lifeProfile"
  >,
  id = uid("track"),
): FocusTrack {
  return {
    id,
    label: trackLabelFromWhy(state.why),
    why: state.why,
    currentState: state.currentState,
    behavior: state.behavior,
    constraints: state.constraints,
    goals: state.goals,
    lifeProfile: state.lifeProfile,
    createdAt: new Date().toISOString(),
  };
}

/** Migrate pre-tracks users into a single track. */
export function migrateTracksIfNeeded<T extends FormaState>(state: T): T {
  if (state.tracks && state.tracks.length > 0) {
    if (!state.activeTrackId) {
      return { ...state, activeTrackId: state.tracks[0]!.id };
    }
    return state;
  }
  if (!state.onboardingCompleted || state.why.selected.length === 0) {
    return {
      ...state,
      tracks: state.tracks ?? [],
      activeTrackId: state.activeTrackId ?? null,
      onboardingMode: state.onboardingMode ?? "idle",
    };
  }
  const track = buildTrackFromState(state);
  return {
    ...state,
    tracks: [track],
    activeTrackId: track.id,
    onboardingMode: "idle",
    plans: (state.plans ?? []).map((p) =>
      p.trackId ? p : { ...p, trackId: track.id },
    ),
  };
}

export function plansForTrack(
  plans: FormaState["plans"],
  trackId: string | null | undefined,
) {
  if (!trackId) return plans;
  return plans.filter((p) => !p.trackId || p.trackId === trackId);
}

export { primaryWhy, whyLabel };
