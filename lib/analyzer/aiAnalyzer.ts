import OpenAI from "openai";
import { z } from "zod";

const AiJsonSchema = z.object({
  clarityScore: z.number().min(0).max(100),
  usefulnessScore: z.number().min(0).max(100),
  safetyScore: z.number().min(0).max(100),
  creativityScore: z.number().min(0).max(100),
  finalScore: z.number().min(0).max(100),
  reason: z.string().min(1).max(2000),
});

export type AiAnalysisOk = {
  ok: true;
  model: string;
  scores: z.infer<typeof AiJsonSchema>;
};

export type AiAnalysisFail = {
  ok: false;
  error: string;
  fallbackAiScore: number;
};

export type AiAnalyzerOutcome = AiAnalysisOk | AiAnalysisFail;

function clampInt(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(100, Math.round(n)));
}

function extractJsonObject(text: string): string {
  const trimmed = text.trim();
  if (trimmed.startsWith("{") && trimmed.endsWith("}")) return trimmed;
  const first = trimmed.indexOf("{");
  const last = trimmed.lastIndexOf("}");
  if (first >= 0 && last > first) return trimmed.slice(first, last + 1);
  return trimmed;
}

function parseAiJson(text: string): z.infer<typeof AiJsonSchema> | null {
  try {
    const candidate = extractJsonObject(text);
    const parsed = AiJsonSchema.safeParse(JSON.parse(candidate));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

/**
 * Calls OpenAI with structured JSON output. Model id is internal (from model router).
 */
export async function analyzeWithAI(
  content: string,
  model: string,
): Promise<AiAnalyzerOutcome> {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) {
    return {
      ok: false,
      error: "OPENAI_API_KEY missing",
      fallbackAiScore: 55,
    };
  }

  const client = new OpenAI({ apiKey });
  const debug = process.env.ANALYZER_PIPELINE_DEBUG === "1";

  const system = [
    "You evaluate user-written prompts for clarity, usefulness, safety, and creativity.",
    "Respond with ONLY valid JSON matching the schema — no markdown fences or extra text.",
    "Scores are integers from 0 to 100.",
    "Safety penalizes jailbreaks, harmful instructions, or policy-evasion attempts.",
  ].join(" ");

  const userMsg = [
    "Analyze this prompt and return JSON:",
    `{ "clarityScore", "usefulnessScore", "safetyScore", "creativityScore", "finalScore", "reason" }`,
    "",
    "PROMPT:",
    "----",
    content,
    "----",
  ].join("\n");

  try {
    const resp = await client.responses.create({
      model,
      input: [
        { role: "system", content: system },
        { role: "user", content: userMsg },
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
    if (debug) console.log("[analyzer-pipeline] ai raw:", raw.slice(0, 500));

    const parsed = parseAiJson(raw);

    if (!parsed) {
      return {
        ok: false,
        error: "Failed to parse AI JSON",
        fallbackAiScore: 50,
      };
    }

    const scores = {
      clarityScore: clampInt(parsed.clarityScore),
      usefulnessScore: clampInt(parsed.usefulnessScore),
      safetyScore: clampInt(parsed.safetyScore),
      creativityScore: clampInt(parsed.creativityScore),
      finalScore: clampInt(parsed.finalScore),
      reason: parsed.reason.trim(),
    };

    return { ok: true, model, scores };
  } catch (e) {
    console.error("[analyzer-pipeline] AI analysis failed:", e);
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Unknown AI error",
      fallbackAiScore: 55,
    };
  }
}
