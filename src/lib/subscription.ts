import type { SubscriptionData } from "@/lib/types";

export const FREE_LIMITS = {
  aiInsights: 5,
  coachMessages: 8,
} as const;

export const PREMIUM_LIMITS = {
  aiInsights: Infinity,
  coachMessages: Infinity,
} as const;

export function canUseInsight(sub: SubscriptionData) {
  if (sub.plan === "premium") return true;
  return sub.aiInsightsUsed < sub.aiInsightsLimit;
}

export function canUseCoach(sub: SubscriptionData) {
  if (sub.plan === "premium") return true;
  return sub.coachMessagesUsed < sub.coachMessagesLimit;
}

export function defaultSubscription(): SubscriptionData {
  return {
    plan: "free",
    status: "active",
    aiInsightsUsed: 0,
    aiInsightsLimit: FREE_LIMITS.aiInsights,
    coachMessagesUsed: 0,
    coachMessagesLimit: FREE_LIMITS.coachMessages,
  };
}

/** Billing provider abstraction — swap Stripe/RevenueCat later */
export interface BillingProvider {
  startCheckout(plan: "premium"): Promise<{ ok: boolean; url?: string }>;
  cancel(): Promise<{ ok: boolean }>;
}

export class MockBillingProvider implements BillingProvider {
  async startCheckout() {
    return { ok: true };
  }
  async cancel() {
    return { ok: true };
  }
}
