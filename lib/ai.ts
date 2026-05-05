import OpenAI from "openai";
import { z } from "zod";

const AnalyzerResultSchema = z.object({
  score: z.number().int().min(0).max(100),
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
  return /(^|\n)\s*(#{1,3}\s+|\d+[\).]\s+|- )/m.test(content);
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

/** Local heuristic analysis (no network). Used to enrich preview text alongside the hybrid pipeline. */
export function analyzePromptHeuristics(content: string): AnalyzerResult {
  const text = content.trim();
  const len = text.length;

  const issues: string[] = [];
  const suggestions: string[] = [];

  let score = 55;
  const breakdown = {
    clarity: 55,
    structure: 50,
    specificity: 50,
    outputDefinition: 50,
    accuracy: 60,
  };

  if (len < 30) {
    score -= 20;
    breakdown.clarity -= 20;
    issues.push("Prompt is very short; the intent and constraints are ambiguous.");
    suggestions.push("Add the goal, constraints, and the exact output format you want.");
  } else if (len < 80) {
    score -= 10;
    breakdown.clarity -= 10;
    issues.push("Prompt lacks detail for consistent results.");
    suggestions.push("Add context (audience, domain, input structure) and success criteria.");
  } else if (len > 3000) {
    score -= 8;
    breakdown.structure -= 8;
    issues.push("Prompt is very long; important constraints may be buried.");
    suggestions.push("Add headings and a short summary of requirements at the top.");
  } else {
    score += 4;
    breakdown.clarity += 4;
  }

  const roleMissing = !hasRole(text);
  if (!roleMissing) {
    score += 6;
    breakdown.clarity += 6;
  } else {
    issues.push("No explicit role or perspective is defined.");
    suggestions.push('Start with a role like: "You are a senior <role>…"');
  }

  const outputFormatMissing = !hasOutputFormat(text) || !hasOutputDirective(text);
  if (!outputFormatMissing) {
    score += 10;
    breakdown.outputDefinition += 14;
  } else {
    issues.push("No explicit output format is specified.");
    suggestions.push('Specify output format, e.g. "Return JSON with keys …" or "Use bullets".');
  }

  if (hasConstraints(text)) score += 10;
  else {
    issues.push("Constraints are missing (tone, length, exclusions, must-haves).");
    suggestions.push("Add constraints: tone, length, what to avoid, and what to include.");
  }

  if (hasStructure(text)) breakdown.structure += 12;
  else suggestions.push("Add simple structure (headings or numbered steps) to make constraints obvious.");

  if (hasSpecificity(text)) breakdown.specificity += 12;
  else suggestions.push("Add measurable details (limits, must-haves, exclusions) to reduce ambiguity.");

  if (hasExamples(text)) score += 6;
  else {
    suggestions.push("Add a small example input/output to reduce ambiguity.");
  }

  // Specificity hints
  if (/\b(api|sql|react|next\.js|prisma|postgres|supabase|python|node)\b/i.test(text)) {
    score += 6;
  } else {
    suggestions.push("Mention the exact tools/stack (e.g., Next.js, Prisma, Postgres) if relevant.");
  }

  score = clampInt(score);
  const vagueInstruction = isVagueInstruction(text);
  if (vagueInstruction) {
    issues.push("Instruction is vague; it’s unclear what success looks like.");
    suggestions.push("Specify the exact task, target audience, and what to include/exclude.");
    breakdown.clarity = clampInt(breakdown.clarity - 12);
  }

  const missingParts = {
    roleMissing,
    vagueInstruction,
    outputFormatMissing,
  };

  const clampedBreakdown = {
    clarity: clampInt(breakdown.clarity),
    structure: clampInt(breakdown.structure),
    specificity: clampInt(breakdown.specificity),
    outputDefinition: clampInt(breakdown.outputDefinition),
    accuracy: clampInt(breakdown.accuracy),
  };

  const improvedPrompt = [
    "You are an expert assistant.",
    "",
    "## Goal",
    text,
    "",
    "## Requirements",
    "- Provide a precise, actionable answer.",
    "- Ask clarifying questions only if truly necessary.",
    "- Follow any constraints (tone/length/output format).",
    "",
    "## Output format",
    "- Use bullet points for steps.",
    "- Include code blocks when relevant.",
  ].join("\n");

  return {
    score,
    issues: uniq(issues).slice(0, 12),
    suggestions: uniq(suggestions).slice(0, 12),
    improvedPrompt,
    breakdown: clampedBreakdown,
    missingParts,
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

  // Merge: keep AI as primary, but add any missing rule-based suggestions.
  const mergedSuggestions = uniq([...ai.suggestions, ...rules.suggestions]).slice(0, 12);
  const mergedIssues = uniq([...ai.issues, ...rules.issues]).slice(0, 12);

  const breakdown = ai.breakdown
    ? {
        clarity: clampInt(ai.breakdown.clarity),
        structure: clampInt(ai.breakdown.structure),
        specificity: clampInt(ai.breakdown.specificity),
        outputDefinition: clampInt(ai.breakdown.outputDefinition),
        accuracy: clampInt(ai.breakdown.accuracy),
      }
    : rules.breakdown;

  const missingParts = ai.missingParts ?? rules.missingParts;

  return {
    ...ai,
    issues: mergedIssues,
    suggestions: mergedSuggestions,
    breakdown,
    missingParts,
    source: mergedSuggestions.length === ai.suggestions.length ? "ai" : "merged",
  };
}

