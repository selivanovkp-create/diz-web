import { aiConfig } from "@/lib/ai/config";
import { TimewebDeepSeekService } from "@/lib/ai/deepseek";
import { MockAIService } from "@/lib/ai/mock";
import { RemoteAIService } from "@/lib/ai/remote";
import type { AIService } from "@/lib/ai/service";

let singleton: AIService | null = null;

/**
 * - Server + TIMEWEB_AI_API_KEY → Timeweb DeepSeek
 * - Browser → RemoteAIService (прокси /api/ai), иначе mock
 */
export function getAIService(): AIService {
  if (singleton) return singleton;

  if (typeof window === "undefined") {
    singleton = aiConfig().enabled
      ? new TimewebDeepSeekService()
      : new MockAIService();
  } else {
    // Always use remote in browser so key never ships to client.
    // Remote falls back to mock if API unavailable.
    singleton = new RemoteAIService();
  }
  return singleton;
}

export function setAIService(service: AIService) {
  singleton = service;
}

export function resetAIService() {
  singleton = null;
}
