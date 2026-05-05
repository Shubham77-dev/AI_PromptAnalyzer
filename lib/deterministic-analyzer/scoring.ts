import { BAD_VAGUE_PATTERNS, TECH_KEYWORDS, VAGUE_WORDS } from "./patterns";
import type { ParsedPrompt } from "./parser";
import { detectPromptType, type PromptType } from "./promptType";

export type ScoreBreakdown = {
  clarity: number;
  structure: number;
  specificity: number;
  outputDefinition: number;
  accuracy: number;
};

export type ScoreResult = {
  score: number;
  promptType: PromptType;
  breakdown: ScoreBreakdown;
  penalties: string[];
  signals: {
    hasRole: boolean;
    hasGoal: boolean;
    requirementCount: number;
    constraintCount: number;
    hasOutputFormat: boolean;
    hasExamples: boolean;
    hasHeadings: boolean;
  };
  vagueInstruction: boolean;
  outputFormatMissing: boolean;
};

function clampInt(n: number) {
  return Math.max(0, Math.min(100, Math.round(n)));
}

function countKeywordHits(text: string, keywords: string[]) {
  const lower = text.toLowerCase();
  let hits = 0;
  for (const k of keywords) if (lower.includes(k)) hits += 1;
  return hits;
}

function hasAnyBadVague(text: string) {
  return BAD_VAGUE_PATTERNS.some((re) => re.test(text));
}

function vagueWordCount(text: string) {
  const lower = text.toLowerCase();
  let c = 0;
  for (const w of VAGUE_WORDS) {
    const re = new RegExp(`\\b${w.replaceAll(".", "\\.")}\\b`, "i");
    if (re.test(lower)) c += 1;
  }
  return c;
}

function headingRepeatPenalty(headingCounts: Record<string, number>) {
  let repeats = 0;
  for (const n of Object.values(headingCounts)) {
    if (n > 1) repeats += n - 1;
  }
  return repeats;
}

function isVeryShortGoal(goal?: string) {
  if (!goal) return true;
  const t = goal.trim();
  if (t.length < 20) return true;
  // Too many question marks / overly generic
  if (t.length < 80 && /\b(help|improve|fix|make|build|analyze)\b/i.test(t) && !/\b(exactly|must|return|format|json)\b/i.test(t)) {
    return true;
  }
  return false;
}

export function scorePromptDeterministic(content: string, parsed: ParsedPrompt): ScoreResult {
  const text = content.trim();
  const len = text.length;

  const promptType = detectPromptType(content, parsed);

  const hasRole = Boolean(parsed.role?.trim());
  const hasGoal = Boolean(parsed.goal?.trim());
  const requirementCount = parsed.requirements.length;
  const constraintCount = parsed.constraints.length;
  const hasOutputFormat = Boolean(parsed.outputFormat?.trim());
  const hasExamples = parsed.examples.length > 0;
  const hasHeadings = Object.keys(parsed.headingCounts).length > 0;

  // Dimension scores (0..100). These are deterministic and explainable.
  let clarity = 55;
  let structure = 50;
  let specificity = 50;
  let outputDefinition = 50;
  let accuracy = 60;

  const penalties: string[] = [];

  // Length banding
  if (len < 30) {
    clarity -= 25;
    structure -= 10;
    penalties.push("too_short");
  } else if (len < 80) {
    clarity -= 12;
    penalties.push("short");
  } else if (len > 6000) {
    structure -= 10;
    penalties.push("very_long");
  } else if (len > 3000) {
    structure -= 6;
    penalties.push("long");
  } else {
    clarity += 6;
  }

  // Core parts (adaptive by prompt type)
  // - simple: don't require role/output/requirements; focus clarity
  // - instruction: role optional, output recommended, constraints helpful
  // - structured: reward/penalize structure strongly
  // - creative: role optional; output format optional; tone/constraints matter
  // - technical: output + constraints + specificity matter; role optional
  if (hasRole) clarity += promptType === "structured" ? 12 : 6;
  else if (promptType === "structured") penalties.push("missing_role");

  const vagueGoal = isVeryShortGoal(parsed.goal);
  if (hasGoal && !vagueGoal) clarity += 12;
  else penalties.push(hasGoal ? "vague_goal" : "missing_goal");

  if (hasHeadings) structure += promptType === "structured" ? 14 : 8;
  else if (requirementCount + constraintCount >= 2) structure += 4;
  else if (promptType === "structured") penalties.push("unclear_structure");

  // Requirements / constraints
  if (requirementCount >= 3) structure += 10;
  else if (requirementCount >= 1) structure += 5;
  else if (promptType === "structured") penalties.push("missing_requirements");

  if (constraintCount >= 2) specificity += 12;
  else if (constraintCount === 1) specificity += 6;
  else if (promptType === "structured" || promptType === "technical") penalties.push("missing_constraints");

  // Output format
  if (hasOutputFormat) outputDefinition += promptType === "technical" ? 22 : 16;
  else if (promptType === "technical" || promptType === "structured") penalties.push("missing_output_format");

  // Examples
  if (hasExamples) clarity += 6;

  // Semantic-ish heuristics: tech keywords and vague language
  const techHits = countKeywordHits(text, TECH_KEYWORDS);
  specificity += Math.min(12, techHits * 3);

  const vagueHits = vagueWordCount(text);
  if (vagueHits >= 2) {
    clarity -= 6;
    specificity -= 6;
    penalties.push("vague_words");
  }

  if (hasAnyBadVague(text)) {
    clarity -= 10;
    penalties.push("bad_vague_pattern");
  }

  // Duplicate / repeated headings penalty
  const repeats = headingRepeatPenalty(parsed.headingCounts);
  if (repeats > 0) {
    structure -= Math.min(12, repeats * 4);
    penalties.push("duplicate_sections");
  }

  // Clamp dimensions
  clarity = clampInt(clarity);
  structure = clampInt(structure);
  specificity = clampInt(specificity);
  outputDefinition = clampInt(outputDefinition);
  accuracy = clampInt(accuracy);

  // Weighted final score (deterministic)
  const score = clampInt(
    clarity * 0.32 +
      structure * 0.22 +
      specificity * 0.22 +
      outputDefinition * 0.16 +
      accuracy * 0.08,
  );

  const vagueInstruction = vagueGoal || hasAnyBadVague(text);
  const outputFormatMissing =
    (promptType === "technical" || promptType === "structured") && !hasOutputFormat;

  return {
    score,
    promptType,
    breakdown: { clarity, structure, specificity, outputDefinition, accuracy },
    penalties: Array.from(new Set(penalties)),
    signals: {
      hasRole,
      hasGoal,
      requirementCount,
      constraintCount,
      hasOutputFormat,
      hasExamples,
      hasHeadings,
    },
    vagueInstruction,
    outputFormatMissing,
  };
}

