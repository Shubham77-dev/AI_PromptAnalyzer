import OpenAI from "openai";
import {
  buildModerationAiUserPrompt,
  MODERATION_AI_SYSTEM,
  parseModerationAiJson,
  type ModerationAiFail,
  type ModerationAiOk,
  type ModerationAiOutcome,
} from "./moderationAiShared";

export type { ModerationAiOk as AiAnalysisOk, ModerationAiFail as AiAnalysisFail, ModerationAiOutcome as AiAnalyzerOutcome };

/**
 * Calls OpenAI with structured JSON output. Model id is internal (from model router).
 */
export async function analyzeWithAI(content: string, model: string): Promise<ModerationAiOutcome> {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) {
    return {
      ok: false,
      provider: "openai",
      error: "OPENAI_API_KEY missing",
    };
  }

  const client = new OpenAI({ apiKey });
  const debug = process.env.ANALYZER_PIPELINE_DEBUG === "1";

  try {
    const resp = await client.responses.create({
      model,
      input: [
        { role: "system", content: MODERATION_AI_SYSTEM },
        { role: "user", content: buildModerationAiUserPrompt(content) },
      ],
      text: {
        format: {
          type: "json_schema",
          name: "hybrid_prompt_ai_analysis",
          schema: {
            type: "object",
            additionalProperties: false,
            required: [
              "clarityScore",
              "usefulnessScore",
              "safetyScore",
              "creativityScore",
              "finalScore",
              "reason",
            ],
            properties: {
              clarityScore: { type: "integer", minimum: 0, maximum: 100 },
              usefulnessScore: { type: "integer", minimum: 0, maximum: 100 },
              safetyScore: { type: "integer", minimum: 0, maximum: 100 },
              creativityScore: { type: "integer", minimum: 0, maximum: 100 },
              finalScore: { type: "integer", minimum: 0, maximum: 100 },
              reason: { type: "string", maxLength: 2000 },
            },
          },
          strict: true,
        },
      },
      temperature: 0.15,
    });

    const raw = resp.output_text?.trim() ?? "";
    if (debug) console.log("[analyzer-pipeline] openai moderation raw:", raw.slice(0, 500));

    const parsed = parseModerationAiJson(raw);
    if (!parsed) {
      return { ok: false, provider: "openai", error: "Failed to parse AI JSON" };
    }

    const ok: ModerationAiOk = { ok: true, provider: "openai", model, scores: parsed };
    return ok;
  } catch (e) {
    console.error("[analyzer-pipeline] OpenAI moderation failed:", e);
    return {
      ok: false,
      provider: "openai",
      error: e instanceof Error ? e.message : "Unknown AI error",
    };
  }
}
