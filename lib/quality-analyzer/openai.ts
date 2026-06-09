import OpenAI from "openai";
import { buildQualityAnalyzerUserPrompt, QUALITY_ANALYZER_SYSTEM } from "./prompt";
import { parseQualityAnalyzerJson } from "./parse";

export function isOpenAiQualityAvailable(): boolean {
  return Boolean(process.env.OPENAI_API_KEY?.trim());
}

export async function analyzeWithOpenAi(content: string): Promise<ReturnType<typeof parseQualityAnalyzerJson>> {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) return null;

  const client = new OpenAI({ apiKey });
  const model = process.env.OPENAI_MODEL || "gpt-4o-mini";
  const debug = process.env.ANALYZER_DEBUG === "1";

  try {
    const resp = await client.responses.create({
      model,
      input: [
        { role: "system", content: QUALITY_ANALYZER_SYSTEM },
        { role: "user", content: buildQualityAnalyzerUserPrompt(content) },
      ],
      text: {
        format: {
          type: "json_schema",
          name: "prompt_analyzer_result",
          schema: {
            type: "object",
            additionalProperties: false,
            required: ["score", "breakdown", "missingParts", "issues", "suggestions", "improvedPrompt"],
            properties: {
              score: { type: "integer", minimum: 0, maximum: 100 },
              breakdown: {
                type: "object",
                additionalProperties: false,
                required: ["clarity", "structure", "specificity", "outputDefinition", "accuracy"],
                properties: {
                  clarity: { type: "integer", minimum: 0, maximum: 100 },
                  structure: { type: "integer", minimum: 0, maximum: 100 },
                  specificity: { type: "integer", minimum: 0, maximum: 100 },
                  outputDefinition: { type: "integer", minimum: 0, maximum: 100 },
                  accuracy: { type: "integer", minimum: 0, maximum: 100 },
                },
              },
              missingParts: {
                type: "object",
                additionalProperties: false,
                required: ["roleMissing", "vagueInstruction", "outputFormatMissing"],
                properties: {
                  roleMissing: { type: "boolean" },
                  vagueInstruction: { type: "boolean" },
                  outputFormatMissing: { type: "boolean" },
                },
              },
              issues: { type: "array", items: { type: "string" }, maxItems: 20 },
              suggestions: { type: "array", items: { type: "string" }, maxItems: 20 },
              improvedPrompt: { type: "string" },
            },
          },
          strict: true,
        },
      },
      temperature: 0.2,
    });

    const raw = resp.output_text?.trim() || "";
    if (debug) console.log("[quality-analyzer] openai raw:", raw.slice(0, 500));

    return parseQualityAnalyzerJson(raw, "openai", "OpenAI", content);
  } catch (e) {
    if (debug) console.error("[quality-analyzer] openai error:", e);
    return null;
  }
}
