import {
  detectContentSignals,
  detectPromptPresence,
  filterFeedbackItems,
  isWellStructured,
} from "@/lib/deterministic-analyzer/promptPresence";
import { parsePrompt } from "@/lib/deterministic-analyzer/parser";
import { promptTypeLabel } from "@/lib/deterministic-analyzer/promptType";
import { generateReview } from "@/lib/deterministic-analyzer/review";
import { scorePromptDeterministic } from "@/lib/deterministic-analyzer/scoring";
import type { QualityAnalyzerResult } from "./types";

/**
 * Post-processes AI analyzer output (OpenAI/Ollama) to remove false-positive
 * issues and suggestions when the prompt already contains those elements.
 */
export function refineAiQualityResult(content: string, result: QualityAnalyzerResult): QualityAnalyzerResult {
  const parsed = parsePrompt(content);
  const presence = detectPromptPresence(content, parsed);
  const signals = detectContentSignals(content, parsed);
  const scored = scorePromptDeterministic(content, parsed);
  const score = result.overallScore ?? result.score;

  const issues = filterFeedbackItems(result.issues, presence, scored.promptType, content, score, signals);
  const suggestions = filterFeedbackItems(
    result.suggestions,
    presence,
    scored.promptType,
    content,
    score,
    signals,
  );

  const localReview = generateReview(
    content,
    scored.dimensions,
    scored.promptType,
    score,
    scored,
    parsed,
  );

  const wellStructured = isWellStructured(presence, score);
  const useLocalSuggestions = wellStructured && issues.length === 0;

  const review = {
    ...localReview,
    highImpactImprovements: useLocalSuggestions ? localReview.highImpactImprovements : issues,
    optionalEnhancements: useLocalSuggestions
      ? filterFeedbackItems(
          localReview.optionalEnhancements,
          presence,
          scored.promptType,
          content,
          score,
          signals,
        )
      : suggestions,
    reviewSummary:
      issues.length === 0 && suggestions.length === 0 && wellStructured
        ? localReview.reviewSummary
        : localReview.reviewSummary,
  };

  return {
    ...result,
    score,
    overallScore: score,
    issues,
    suggestions,
    review,
    promptType: result.promptType ?? scored.promptType,
    promptTypeLabel: result.promptTypeLabel ?? promptTypeLabel(scored.promptType),
    missingParts: {
      roleMissing: !presence.hasRole,
      vagueInstruction: result.missingParts?.vagueInstruction ?? scored.vagueInstruction,
      outputFormatMissing: !presence.hasOutputFormat,
    },
  };
}
