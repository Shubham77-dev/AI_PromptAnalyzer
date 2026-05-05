import { parsePrompt } from "./parser";
import { scorePromptDeterministic } from "./scoring";
import { buildSuggestions } from "./suggestions";
import { generateImprovedPrompt } from "./improvedPrompt";

export type DeterministicAnalyzerResult = {
  score: number;
  promptType: "simple" | "instruction" | "structured" | "creative" | "technical";
  strengths: string[];
  weaknesses: string[];
  issues: string[];
  suggestions: string[];
  improvedPrompt: string;
  breakdown: {
    clarity: number;
    structure: number;
    specificity: number;
    outputDefinition: number;
    accuracy: number;
  };
  missingParts: {
    roleMissing: boolean;
    vagueInstruction: boolean;
    outputFormatMissing: boolean;
  };
  parsed: ReturnType<typeof parsePrompt>;
  debug: {
    penalties: string[];
  };
};

export function analyzePromptDeterministic(content: string): DeterministicAnalyzerResult {
  const parsed = parsePrompt(content);
  const scored = scorePromptDeterministic(content, parsed);
  const sug = buildSuggestions(content, parsed, scored);
  const improvedPrompt = generateImprovedPrompt(parsed);

  const strengths = buildStrengths(scored);
  const weaknesses = buildWeaknesses(scored);

  return {
    score: scored.score,
    promptType: scored.promptType,
    strengths,
    weaknesses,
    issues: sug.issues,
    suggestions: sug.suggestions,
    improvedPrompt,
    breakdown: scored.breakdown,
    missingParts: {
      roleMissing: !scored.signals.hasRole,
      vagueInstruction: scored.vagueInstruction,
      outputFormatMissing: scored.outputFormatMissing,
    },
    parsed,
    debug: { penalties: scored.penalties },
  };
}

function buildStrengths(scored: ReturnType<typeof scorePromptDeterministic>) {
  const b = scored.breakdown;
  const pairs: Array<[string, number]> = [
    ["Clarity is strong", b.clarity],
    ["Structure is clear", b.structure],
    ["Specificity is strong", b.specificity],
    ["Output format is well-defined", b.outputDefinition],
  ];
  pairs.sort((a, z) => z[1] - a[1]);
  return pairs.filter((p) => p[1] >= 70).slice(0, 3).map((p) => p[0]);
}

function buildWeaknesses(scored: ReturnType<typeof scorePromptDeterministic>) {
  const map: Record<string, string> = {
    too_short: "Too short to be unambiguous",
    short: "Could use more detail",
    long: "Long enough that requirements may be buried",
    very_long: "Very long; structure/priority is unclear",
    missing_role: "No explicit role/persona (useful for complex prompts)",
    missing_goal: "No clear goal/task",
    vague_goal: "Goal/task is vague",
    unclear_structure: "Structure is unclear",
    missing_requirements: "No explicit requirements",
    missing_constraints: "No explicit constraints",
    missing_output_format: "No explicit output format",
    vague_words: "Uses vague language without specifics",
    bad_vague_pattern: "Uses a vague request pattern",
    duplicate_sections: "Duplicate/repeated sections detected",
  };
  return scored.penalties.map((p) => map[p] ?? p).slice(0, 5);
}

