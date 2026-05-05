import type { ParsedPrompt } from "./parser";
import type { ScoreResult } from "./scoring";

export type SuggestionsResult = {
  issues: string[];
  suggestions: string[];
};

function uniqCap(items: string[], max: number) {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of items) {
    const s = raw.trim();
    if (!s) continue;
    const key = s.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(s);
    if (out.length >= max) break;
  }
  return out;
}

export function buildSuggestions(content: string, parsed: ParsedPrompt, score: ScoreResult): SuggestionsResult {
  const issues: string[] = [];
  const suggestions: string[] = [];

  // Adaptive suggestions: avoid "add role" for simple/creative prompts.
  if (!score.signals.hasRole && (score.promptType === "structured" || score.promptType === "technical")) {
    issues.push("Missing an explicit role/persona.");
    suggestions.push('Add a role line at the top, e.g. "You are a senior <role>…" or "Act as a …".');
  }

  if (!score.signals.hasGoal) {
    issues.push("Missing a clear goal/task.");
    suggestions.push("Add a Goal section describing exactly what to do and what success looks like.");
  } else if (score.vagueInstruction) {
    issues.push("Goal/task is vague; success criteria are unclear.");
    suggestions.push("Add measurable requirements (must-haves, constraints, and the exact output format).");
  }

  if (score.outputFormatMissing) {
    issues.push("Missing an explicit output format.");
    suggestions.push('Specify output explicitly, e.g. "Return JSON with keys …" or "Respond in Markdown with sections …".');
  }

  if (score.signals.requirementCount < 1 && score.promptType === "structured") {
    issues.push("No requirements listed.");
    suggestions.push("Add 3–7 requirements as bullet points (what to include, what to verify, what to avoid).");
  } else if (score.signals.requirementCount < 3 && (score.promptType === "structured" || score.promptType === "technical")) {
    suggestions.push("Add a few more requirements to reduce ambiguity (inputs, edge cases, success criteria).");
  }

  if (score.signals.constraintCount < 1 && (score.promptType === "structured" || score.promptType === "technical")) {
    issues.push("No constraints listed (must/avoid/limits).");
    suggestions.push("Add constraints: length limits, exclusions, tone, and any must/never rules.");
  }

  if (
    score.promptType === "structured" &&
    !score.signals.hasHeadings &&
    (score.signals.requirementCount + score.signals.constraintCount) < 2
  ) {
    issues.push("Structure is unclear.");
    suggestions.push("Add headings: Goal / Context / Requirements / Constraints / Output format.");
  }

  // Duplicates / repetition
  if (score.penalties.includes("duplicate_sections")) {
    issues.push("Duplicate/repeated sections detected (e.g., repeated headings).");
    suggestions.push("Keep each section once; merge duplicates into a single set of requirements/constraints.");
  }

  // Context-sensitive nudge
  if (!parsed.context && score.promptType !== "simple") {
    suggestions.push("If relevant, add a short Context section (audience, domain, inputs, constraints).");
  }

  // Always encourage examples when missing (but not as a hard fail)
  if (parsed.examples.length === 0 && score.promptType !== "simple") {
    suggestions.push("Add a small example input/output to make the expected result unambiguous.");
  }

  // Very long prompt hint
  if (content.trim().length > 3000) {
    issues.push("Prompt is long; key requirements may be buried.");
    suggestions.push("Add a short summary at the top and group requirements into subsections.");
  }

  return {
    issues: uniqCap(issues, 12),
    suggestions: uniqCap(suggestions, 12),
  };
}

