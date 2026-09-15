import { NextRequest, NextResponse } from "next/server";
import { aiConfig } from "@/lib/ai/config";
import { TimewebDeepSeekService } from "@/lib/ai/deepseek";
import { MockAIService } from "@/lib/ai/mock";
import type { AIContext } from "@/lib/ai/service";
import type { CheckInData } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 60;

const ALLOWED_ORIGINS = [
  "https://selivanovkp-create.github.io",
  "https://forma-seven-alpha.vercel.app",
  "https://forma-selivanovkp-create.vercel.app",
  "https://t.me",
  "https://web.telegram.org",
  "https://webk.telegram.org",
  "https://webz.telegram.org",
  "http://localhost:3000",
  "http://127.0.0.1:3000",
];

function corsHeaders(origin: string | null) {
  const allow =
    origin &&
    (ALLOWED_ORIGINS.includes(origin) ||
      origin.endsWith(".vercel.app") ||
      origin.endsWith(".trycloudflare.com") ||
      origin.endsWith(".telegram.org") ||
      origin.includes("localhost"));
  return {
    "Access-Control-Allow-Origin": allow && origin ? origin : ALLOWED_ORIGINS[0],
    "Access-Control-Allow-Methods": "POST, OPTIONS, GET",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Credentials": "true",
  };
}

function getService() {
  return aiConfig().enabled ? new TimewebDeepSeekService() : new MockAIService();
}

function resultSource(result: unknown, enabled: boolean): "live" | "mock" {
  if (result && typeof result === "object" && "source" in result) {
    const s = (result as { source?: string }).source;
    if (s === "live" || s === "mock") return s;
  }
  return enabled ? "live" : "mock";
}

export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders(req.headers.get("origin")),
  });
}

export async function GET(req: NextRequest) {
  const cfg = aiConfig();
  return NextResponse.json(
    {
      ok: true,
      provider: cfg.enabled ? "timeweb-deepseek" : "mock",
      model: cfg.enabled ? cfg.model : null,
      baseUrl: cfg.enabled ? cfg.baseUrl : null,
    },
    { headers: corsHeaders(req.headers.get("origin")) },
  );
}

export async function POST(req: NextRequest) {
  const headers = corsHeaders(req.headers.get("origin"));
  try {
    const body = await req.json();
    const action = body.action as string;
    const ctx = body.ctx as AIContext;
    const ai = getService();

    let result: unknown;
    switch (action) {
      case "initialAssessment":
        result = await ai.generateInitialAssessment(ctx);
        break;
      case "dailyPlan":
        result = await ai.generateDailyPlan(ctx);
        break;
      case "checkIn":
        result = await ai.analyzeCheckIn(ctx, body.checkIn as CheckInData);
        break;
      case "progress":
        result = await ai.analyzeProgress(ctx);
        break;
      case "motivation":
        result = await ai.generateMotivation(ctx);
        break;
      case "difficulty":
        result = await ai.adjustDifficulty(ctx);
        break;
      case "coach":
        result = await ai.generateCoachResponse(ctx, String(body.message || ""));
        break;
      case "weekly":
        result = await ai.generateWeeklyReview(ctx);
        break;
      default:
        return NextResponse.json(
          { ok: false, error: `Unknown action: ${action}` },
          { status: 400, headers },
        );
    }

    return NextResponse.json(
      {
        ok: true,
        provider: aiConfig().enabled ? "timeweb-deepseek" : "mock",
        source: resultSource(result, aiConfig().enabled),
        result,
      },
      { headers },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "AI error";
    return NextResponse.json({ ok: false, error: message }, { status: 500, headers });
  }
}
