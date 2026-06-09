import { analyzePromptDeterministic } from "@/lib/deterministic-analyzer";
import { normalizeImprovedBrief } from "@/lib/deterministic-analyzer/improvedPrompt";
import { clampInt, uniq } from "./parse";
import type { QualityAnalyzerResult } from "./types";

/** Local deterministic analyzer — no network, no API keys. */
export function analyzeWithLocal(content: string): QualityAnalyzerResult {
  const det = analyzePromptDeterministic(content);
  return {
    score: clampInt(det.overallScore),
    overallScore: clampInt(det.overallScore),
    promptType: det.promptType,
    promptTypeLabel: det.promptTypeLabel,
    detectedIntent: det.detectedIntent,
    dimensions: det.dimensions,
    review: det.review,
    strengths: det.strengths,
    weaknesses: det.weaknesses,
    issues: uniq(det.issues).slice(0, 12),
    suggestions: uniq(det.suggestions).slice(0, 12),
    improvedPrompt: normalizeImprovedBrief(det.improvedPrompt),
    breakdown: det.breakdown,
    missingParts: det.missingParts,
    source: "rules",
    analyzerProvider: "local",
    providerLabel: "Local analyzer",
  };
}
