export function aiConfig() {
  const apiKey = process.env.TIMEWEB_AI_API_KEY?.trim() || "";
  const baseUrl = (
    process.env.TIMEWEB_AI_BASE_URL?.trim() || "https://api.timeweb.ai/v1"
  ).replace(/\/$/, "");
  const model =
    process.env.TIMEWEB_AI_MODEL?.trim() || "deepseek/deepseek-chat";
  return {
    apiKey,
    baseUrl,
    model,
    enabled: Boolean(apiKey),
  };
}

export function publicAiApiBase() {
  // Client: same-origin /api/ai or absolute backend for static Mini App
  if (typeof window === "undefined") return "";
  return (process.env.NEXT_PUBLIC_AI_API_BASE || "").replace(/\/$/, "");
}
