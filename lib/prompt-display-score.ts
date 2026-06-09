import type { AnalyzerResult } from "@/lib/ai";
import type { HybridAnalyzeResult } from "@/lib/analyzer";
import type { DeterministicAnalyzerResult } from "@/lib/deterministic-analyzer";

export type StoredQualityDimensions = {
  clarity: number;
  specificity: number;
  completeness: number;
  context: number;
  actionability: number;
  outputDefinition: number;
};

export type PromptScoreFields = {
  score: number | null;
  analysis: { accuracy: number; clarity: number } | null;
  qualityDimensions?: unknown;
};

/** Score shown to the user in upload preview (quality analyzer), not moderation pipeline. */
export function displayScoreFromQuality(quality: AnalyzerResult): number {
  return Math.round(quality.overallScore ?? quality.score);
}

export function qualityDimensionsFromResult(
  quality: AnalyzerResult,
): StoredQualityDimensions | null {
  if (quality.dimensions) return quality.dimensions;
  if (quality.breakdown) {
    return {
      clarity: quality.breakdown.clarity,
      specificity: quality.breakdown.specificity,
      completeness: quality.breakdown.accuracy,
      context: quality.breakdown.structure,
      actionability: quality.breakdown.structure,
      outputDefinition: quality.breakdown.outputDefinition,
    };
  }
  return null;
}

export function qualityDimensionsFromDeterministic(
  det: DeterministicAnalyzerResult,
): StoredQualityDimensions {
  return det.dimensions;
}

export function effectiveDisplayScore(prompt: PromptScoreFields): number | null {
  if (typeof prompt.score === "number" && Number.isFinite(prompt.score) && prompt.score > 0) {
    return Math.round(prompt.score);
  }
  const acc = prompt.analysis?.accuracy;
  if (typeof acc === "number" && Number.isFinite(acc) && acc > 0) return acc;
  return null;
}

export function parseStoredDimensions(raw: unknown): StoredQualityDimensions | null {
  if (!raw || typeof raw !== "object") return null;
  const d = raw as Record<string, unknown>;
  const keys = ["clarity", "specificity", "completeness", "context", "actionability", "outputDefinition"] as const;
  if (!keys.every((k) => typeof d[k] === "number")) return null;
  return d as StoredQualityDimensions;
}

export function scoreBadgeTone(score: number | null): "none" | "low" | "mid" | "high" {
  if (score === null || score <= 0) return "none";
  if (score <= 40) return "low";
  if (score <= 70) return "mid";
  return "high";
}

export function buildAnalysisRowFromQuality(
  hybrid: HybridAnalyzeResult,
  quality: AnalyzerResult,
): { accuracy: number; clarity: number; suggestions: string } {
  const displayScore = displayScoreFromQuality(quality);
  const dims = qualityDimensionsFromResult(quality);
  const suggestionsText = [
    `Display score (upload preview): ${displayScore}`,
    `Moderation pipeline score: ${Math.round(hybrid.score)}`,
    hybrid.flags.length ? `Flags:\n- ${hybrid.flags.join("\n- ")}` : "",
    quality.issues.length ? `Issues:\n- ${quality.issues.join("\n- ")}` : "",
    quality.suggestions.length ? `Suggestions:\n- ${quality.suggestions.join("\n- ")}` : "",
    quality.review?.reviewSummary ? `Review:\n${quality.review.reviewSummary}` : "",
  ]
    .filter(Boolean)
    .join("\n\n")
    .slice(0, 10_000);

  return {
    accuracy: dims?.clarity ?? displayScore,
    clarity: dims?.specificity ?? displayScore,
    suggestions: suggestionsText,
  };
}

export function buildAnalysisRowFromDeterministic(
  det: DeterministicAnalyzerResult,
): { accuracy: number; clarity: number; suggestions: string } {
  const dims = det.dimensions;
  const suggestionsText = [
    `Recalculated local score: ${det.overallScore}`,
    det.review.reviewSummary,
    det.suggestions.length ? `Suggestions:\n- ${det.suggestions.join("\n- ")}` : "",
  ]
    .filter(Boolean)
    .join("\n\n")
    .slice(0, 10_000);

  return {
    accuracy: dims.clarity,
    clarity: dims.specificity,
    suggestions: suggestionsText,
  };
}
