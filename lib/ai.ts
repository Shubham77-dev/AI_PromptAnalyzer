import OpenAI from "openai";
import { z } from "zod";
import { cleanImprovedPrompt } from "@/lib/clean-improved-prompt";
import { analyzePromptDeterministic } from "@/lib/deterministic-analyzer";

const AnalyzerResultSchema = z.object({
  score: z.number().int().min(0).max(100),
  promptType: z.enum(["simple", "instruction", "structured", "creative", "technical"]).optional(),
  strengths: z.array(z.string().min(1)).max(20).optional(),
  weaknesses: z.array(z.string().min(1)).max(20).optional(),
  issues: z.array(z.string().min(1)).max(20),
  suggestions: z.array(z.string().min(1)).max(20),
  improvedPrompt: z.string().min(1).max(30_000),
  breakdown: z
    .object({
      clarity: z.number().int().min(0).max(100),
      structure: z.number().int().min(0).max(100),
      specificity: z.number().int().min(0).max(100),
      outputDefinition: z.number().int().min(0).max(100),
      accuracy: z.number().int().min(0).max(100),
    })
    .optional(),
  missingParts: z
    .object({
      roleMissing: z.boolean(),
      vagueInstruction: z.boolean(),
      outputFormatMissing: z.boolean(),
    })
    .optional(),
});

export type AnalyzerResult = z.infer<typeof AnalyzerResultSchema> & {
  source: "ai" | "rules" | "merged";
};

function clampInt(n: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, Math.round(n)));
}

function uniq(items: string[]) {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const s of items) {
    const key = s.trim();
    if (!key) continue;
    if (seen.has(key.toLowerCase())) continue;
    seen.add(key.toLowerCase());
    out.push(key);
  }
  return out;
}

function extractJsonObject(text: string) {
  const trimmed = text.trim();
  if (trimmed.startsWith("{") && trimmed.endsWith("}")) return trimmed;

  const first = trimmed.indexOf("{");
  const last = trimmed.lastIndexOf("}");
  if (first >= 0 && last > first) return trimmed.slice(first, last + 1);
  return trimmed;
}

function parseAnalyzerJson(text: string) {
  const candidate = extractJsonObject(text);
  try {
    const parsed = AnalyzerResultSchema.safeParse(JSON.parse(candidate));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

function hasRole(content: string) {
  return /\b(you are|act as|as an|as a)\b/i.test(content);
}

function hasOutputFormat(content: string) {
  return /\b(json|table|bullet|bullets|steps|markdown|csv|yaml|xml)\b/i.test(content);
}

function hasOutputDirective(content: string) {
  return /\b(output|return|respond with|format)\b/i.test(content);
}

function hasStructure(content: string) {
  return /(^|\n)\s*(#{1,3}\s+|\d+[.)]\s+|- )/m.test(content);
}

function hasSpecificity(content: string) {
  return /\b(exactly|at least|at most|under \d+|include|exclude|must|should|do not|avoid)\b/i.test(
    content,
  );
}

function isVagueInstruction(content: string) {
  // Heuristic: short + generic verbs without details.
  const t = content.trim();
  if (t.length > 120) return false;
  return /\b(help|do it|make it better|improve this|fix this|analyze)\b/i.test(t) && !hasConstraints(t);
}

function hasConstraints(content: string) {
  return /\b(limit|under \d+|no more than|avoid|do not|must|should|tone|style|format)\b/i.test(
    content,
  );
}

function hasExamples(content: string) {
  return /\b(example|for example|e\.g\.)\b/i.test(content);
}

/** Local deterministic analysis (no network). Used to enrich preview text alongside the hybrid pipeline. */
export function analyzePromptHeuristics(content: string): AnalyzerResult {
  const det = analyzePromptDeterministic(content);
  return {
    score: clampInt(det.score),
    promptType: det.promptType,
    strengths: det.strengths,
    weaknesses: det.weaknesses,
    issues: uniq(det.issues).slice(0, 12),
    suggestions: uniq(det.suggestions).slice(0, 12),
    improvedPrompt: cleanImprovedPrompt(det.improvedPrompt),
    breakdown: det.breakdown,
    missingParts: det.missingParts,
    source: "rules",
  };
}

async function openAiAnalyze(content: string): Promise<AnalyzerResult | null> {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) return null;

  const client = new OpenAI({ apiKey });
  const model = process.env.OPENAI_MODEL || "gpt-4o-mini";
  const debug = process.env.ANALYZER_DEBUG === "1";

  const system = [
    "You are a strict prompt quality analyzer.",
    "You MUST return ONLY valid JSON that matches the schema.",
    "Be concrete and actionable. No generic advice.",
    "Keep the improved prompt intent identical to the original.",
    "The improvedPrompt must be clean and structured. Do not repeat sections or headings.",
    "Do not append multiple templates. Each heading (Goal, Context, Requirements, Constraints, Output format) must appear at most once.",
  ].join(" ");

  const user = [
    "Analyze the following prompt.",
    "Return STRICT JSON with:",
    `{
  "score": number (0-100),
  "breakdown": { "clarity": number, "structure": number, "specificity": number, "outputDefinition": number, "accuracy": number },
  "missingParts": { "roleMissing": boolean, "vagueInstruction": boolean, "outputFormatMissing": boolean },
  "issues": string[],
  "suggestions": string[],
  "improvedPrompt": string
}`,
    "",
    "Rules:",
    "- issues: explain what's wrong (max 12).",
    "- suggestions: actionable fixes (max 12). Each suggestion must be specific (what to add/change).",
    "- improvedPrompt: rewrite the prompt with clear structure: Role, Goal, Context, Constraints, Output format, Examples (if helpful).",
    "- breakdown: score each dimension from 0-100 (integers).",
    "- missingParts: booleans indicating whether the prompt is missing key components.",
    "- Do NOT include markdown fences or extra text outside JSON.",
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
        { role: "user", content: user },
      ],
      text: {
        format: {
          type: "json_schema",
          name: "prompt_analyzer_result",
          schema: {
            type: "object",
            additionalProperties: false,
            required: ["score", "issues", "suggestions", "improvedPrompt"],
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
    if (debug) console.log("[analyzer] openai raw:", raw);

    const parsed = parseAnalyzerJson(raw);
    if (!parsed) return null;

    return {
      ...parsed,
      score: clampInt(parsed.score),
      issues: uniq(parsed.issues).slice(0, 12),
      suggestions: uniq(parsed.suggestions).slice(0, 12),
      improvedPrompt: cleanImprovedPrompt(parsed.improvedPrompt),
      source: "ai",
    };
  } catch (e) {
    if (debug) console.error("[analyzer] openai error:", e);
    return null;
  }
}

export async function analyzePromptQuality(content: string): Promise<AnalyzerResult> {
  const rules = analyzePromptHeuristics(content);
  const ai = await openAiAnalyze(content);

  if (!ai) {
    if (process.env.ANALYZER_DEBUG === "1") console.log("[analyzer] using rule-based fallback");
    return rules;
  }

  // Merge: deterministic score remains source of truth; AI only enhances text artifacts.
  const mergedSuggestions = uniq([...rules.suggestions, ...ai.suggestions]).slice(0, 12);
  const mergedIssues = uniq([...rules.issues, ...ai.issues]).slice(0, 12);
  const improvedPrompt = cleanImprovedPrompt(ai.improvedPrompt || rules.improvedPrompt);

  return {
    score: rules.score,
    issues: mergedIssues,
    suggestions: mergedSuggestions,
    improvedPrompt,
    breakdown: rules.breakdown,
    missingParts: rules.missingParts,
    source: "merged",
  };
}

