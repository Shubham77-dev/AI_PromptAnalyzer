import OpenAI from "openai";
import { z } from "zod";

const AnalyzerResultSchema = z.object({
  score: z.number().int().min(0).max(100),
  issues: z.array(z.string().min(1)).max(20),
  suggestions: z.array(z.string().min(1)).max(20),
  improvedPrompt: z.string().min(1).max(30_000),
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

function hasConstraints(content: string) {
  return /\b(limit|under \d+|no more than|avoid|do not|must|should|tone|style|format)\b/i.test(
    content,
  );
}

function hasExamples(content: string) {
  return /\b(example|for example|e\.g\.)\b/i.test(content);
}

function ruleBasedAnalyze(content: string): AnalyzerResult {
  const text = content.trim();
  const len = text.length;

  const issues: string[] = [];
  const suggestions: string[] = [];

  let score = 55;

  if (len < 30) {
    score -= 20;
    issues.push("Prompt is very short; the intent and constraints are ambiguous.");
    suggestions.push("Add the goal, constraints, and the exact output format you want.");
  } else if (len < 80) {
    score -= 10;
    issues.push("Prompt lacks detail for consistent results.");
    suggestions.push("Add context (audience, domain, input structure) and success criteria.");
  } else if (len > 3000) {
    score -= 8;
    issues.push("Prompt is very long; important constraints may be buried.");
    suggestions.push("Add headings and a short summary of requirements at the top.");
  } else {
    score += 4;
  }

  if (hasRole(text)) score += 6;
  else {
    issues.push("No explicit role or perspective is defined.");
    suggestions.push('Start with a role like: "You are a senior <role>…"');
  }

  if (hasOutputFormat(text)) score += 10;
  else {
    issues.push("No explicit output format is specified.");
    suggestions.push('Specify output format, e.g. "Return JSON with keys …" or "Use bullets".');
  }

  if (hasConstraints(text)) score += 10;
  else {
    issues.push("Constraints are missing (tone, length, exclusions, must-haves).");
    suggestions.push("Add constraints: tone, length, what to avoid, and what to include.");
  }

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
  "issues": string[],
  "suggestions": string[],
  "improvedPrompt": string
}`,
    "",
    "Rules:",
    "- issues: explain what's wrong (max 12).",
    "- suggestions: actionable fixes (max 12). Each suggestion must be specific (what to add/change).",
    "- improvedPrompt: rewrite the prompt with clear structure: Role, Goal, Context, Constraints, Output format, Examples (if helpful).",
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

export async function analyzePrompt(content: string): Promise<AnalyzerResult> {
  const rules = ruleBasedAnalyze(content);
  const ai = await openAiAnalyze(content);

  if (!ai) {
    if (process.env.ANALYZER_DEBUG === "1") console.log("[analyzer] using rule-based fallback");
    return rules;
  }

  // Merge: keep AI as primary, but add any missing rule-based suggestions.
  const mergedSuggestions = uniq([...ai.suggestions, ...rules.suggestions]).slice(0, 12);
  const mergedIssues = uniq([...ai.issues, ...rules.issues]).slice(0, 12);

  return {
    ...ai,
    issues: mergedIssues,
    suggestions: mergedSuggestions,
    source: mergedSuggestions.length === ai.suggestions.length ? "ai" : "merged",
  };
}

