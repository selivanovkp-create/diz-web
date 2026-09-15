export type AnalyticsEventName =
  | "onboarding_started"
  | "onboarding_completed"
  | "checkin_started"
  | "checkin_completed"
  | "task_created"
  | "task_completed"
  | "task_skipped"
  | "task_failed"
  | "daily_plan_completed"
  | "ai_insight_viewed"
  | "coach_opened"
  | "coach_message_sent"
  | "weekly_review_viewed"
  | "achievement_unlocked"
  | "subscription_started"
  | "subscription_cancelled";

export interface AnalyticsEvent {
  name: AnalyticsEventName;
  props?: Record<string, unknown>;
  at: string;
}

type Sink = (event: AnalyticsEvent) => void;

const sinks: Sink[] = [];

export function registerAnalyticsSink(sink: Sink) {
  sinks.push(sink);
}

export function track(name: AnalyticsEventName, props?: Record<string, unknown>) {
  const event: AnalyticsEvent = { name, props, at: new Date().toISOString() };
  if (typeof window !== "undefined") {
    // eslint-disable-next-line no-console
    console.debug("[analytics]", event.name, event.props ?? {});
  }
  sinks.forEach((s) => s(event));
  return event;
}
