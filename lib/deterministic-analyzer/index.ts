import { detectIntent } from "./intent";
import { parsePrompt } from "./parser";
import { promptTypeLabel } from "./promptType";
import { generateReview, type PromptReview } from "./review";
import { scorePromptDeterministic, type DimensionScores } from "./scoring";
import { buildStructuredSuggestions } from "./suggestions";
import { deriveImprovementRequirements } from "./improvementRequirements";
import { generateImprovedPrompt } from "./improvedPrompt";
import type { PromptType } from "./promptType";

export type DeterministicAnalyzerResult = {
  overallScore: number;
  /** @deprecated Use overallScore — kept for backward compatibility */
  score: number;
  promptType: PromptType;
  promptTypeLabel: string;
  detectedIntent: string;
  dimensions: DimensionScores;
  review: PromptReview;
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
  const detectedIntent = detectIntent(content, parsed, scored.promptType);
  const sug = buildStructuredSuggestions(content, parsed, scored);
  const requirements = deriveImprovementRequirements(parsed, scored, sug, content);
  const improvedPrompt = generateImprovedPrompt(
    content,
    scored.promptType,
    detectedIntent,
    parsed,
    requirements,
  );
  const review = generateReview(content, scored.dimensions, scored.promptType, scored.overallScore, scored, parsed);

  return {
    overallScore: scored.overallScore,
    score: scored.overallScore,
    promptType: scored.promptType,
    promptTypeLabel: promptTypeLabel(scored.promptType),
    detectedIntent,
    dimensions: scored.dimensions,
    review,
    strengths: review.strengths,
    weaknesses: review.weaknesses,
    issues: [],
    suggestions: [...sug.highImpactImprovements, ...sug.optionalEnhancements],
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

export type { DimensionScores, PromptReview, PromptType };
