import { aiConfig } from "@/lib/ai/config";

export class LLMError extends Error {
  constructor(
    message: string,
    public status?: number,
  ) {
    super(message);
    this.name = "LLMError";
  }
}

export async function chatCompletion(params: {
  system: string;
  user: string;
  temperature?: number;
  maxTokens?: number;
}): Promise<string> {
  const { apiKey, baseUrl, model, enabled } = aiConfig();
  if (!enabled) {
    throw new LLMError("TIMEWEB_AI_API_KEY не задан");
  }

  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      temperature: params.temperature ?? 0.4,
      max_tokens: params.maxTokens ?? 2000,
      messages: [
        { role: "system", content: params.system },
        { role: "user", content: params.user },
      ],
    }),
    signal: AbortSignal.timeout(90_000),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new LLMError(
      `Timeweb AI error ${res.status}: ${text.slice(0, 300)}`,
      res.status,
    );
  }

  const data = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const content = data.choices?.[0]?.message?.content?.trim();
  if (!content) throw new LLMError("Пустой ответ модели");
  return content;
}

/** Extract first JSON object/array from model output */
export function extractJson(raw: string): unknown {
  const cleaned = raw
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    const startObj = cleaned.indexOf("{");
    const startArr = cleaned.indexOf("[");
    let start = -1;
    if (startObj >= 0 && (startArr < 0 || startObj < startArr)) start = startObj;
    else if (startArr >= 0) start = startArr;
    if (start < 0) throw new Error("JSON не найден в ответе");
    const slice = cleaned.slice(start);
    const endObj = slice.lastIndexOf("}");
    const endArr = slice.lastIndexOf("]");
    const end = Math.max(endObj, endArr);
    if (end < 0) throw new Error("JSON неполный");
    return JSON.parse(slice.slice(0, end + 1));
  }
}
