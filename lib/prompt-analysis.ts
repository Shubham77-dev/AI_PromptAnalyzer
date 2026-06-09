import type { HybridAnalyzeResult } from "@/lib/analyzer";
import { analyzePromptWithRecovery } from "@/lib/analyzer";
import { AUTO_PUBLISH_THRESHOLD_EXCLUSIVE } from "@/lib/analyzer/scoringEngine";
import type { ModerationProviderId } from "@/lib/analyzer/moderationAiShared";
import { analyzePromptQuality, type AnalyzerResult } from "@/lib/ai";
import type { QualityAnalyzerId } from "@/lib/quality-analyzer";

function breakdownFromHybrid(hybrid: HybridAnalyzeResult): AnalyzerResult["breakdown"] | undefined {
  const ad = hybrid.aiDetails;
  if (!ad || typeof ad !== "object" || !("scores" in ad)) return undefined;
  const s = (ad as { scores?: Record<string, unknown> }).scores;
  if (!s || typeof s !== "object") return undefined;
  const c = s.clarityScore;
  const u = s.usefulnessScore;
  const sf = s.safetyScore;
  const cr = s.creativityScore;
  const f = s.finalScore;
  if (typeof c !== "number") return undefined;
  const finalBlend = typeof f === "number" ? Math.round(f) : Math.round(hybrid.score);
  return {
    clarity: Math.round(c),
    structure: typeof cr === "number" ? Math.round(cr) : finalBlend,
    specificity: typeof u === "number" ? Math.round(u) : finalBlend,
    outputDefinition: typeof sf === "number" ? Math.round(sf) : finalBlend,
    accuracy:
      typeof u === "number"
        ? Math.round((c + u + finalBlend) / 3)
        : Math.round((c + finalBlend) / 2),
  };
}

export type UnifiedAnalysisPreview = {
  score: number;
  overallScore: number;
  /** Moderation pipeline source (publish decision). */
  source: "rule" | "rule+ai";
  /** Quality analysis source shown in the upload preview. */
  qualitySource: "ai" | "rules";
  analyzerProvider: QualityAnalyzerId;
  providerLabel: string;
  fallbackFrom?: QualityAnalyzerId;
  aiStatus: "ok" | "error" | "skipped";
  promptType?: string;
  promptTypeLabel?: string;
  detectedIntent?: string;
  dimensions?: NonNullable<AnalyzerResult["dimensions"]>;
  review?: NonNullable<AnalyzerResult["review"]>;
  issues: string[];
  suggestions: string[];
  improvedPrompt: string;
  breakdown?: AnalyzerResult["breakdown"];
  missingParts?: AnalyzerResult["missingParts"];
  moderation: {
    pipelineStatus: HybridAnalyzeResult["status"];
    canAutoPublish: boolean;
    autoPublishThresholdExclusive: number;
    pipelineScore: number;
    moderationProvider?: ModerationProviderId;
    moderationProviderLabel?: string;
    moderationFallbacks?: ModerationProviderId[];
  };
  debug?: Record<string, unknown>;
};

function moderationMetaFromHybrid(hybrid: HybridAnalyzeResult): UnifiedAnalysisPreview["moderation"] {
  const ad = hybrid.aiDetails;
  const pipelineScore = Math.round(hybrid.score);
  const provider =
    ad && typeof ad === "object" && typeof ad.provider === "string"
      ? (ad.provider as ModerationProviderId)
      : undefined;
  const providerLabel =
    ad && typeof ad === "object" && typeof ad.providerLabel === "string"
      ? ad.providerLabel
      : undefined;
  const fallbacks =
    ad && typeof ad === "object" && Array.isArray(ad.fallbacks)
      ? (ad.fallbacks as ModerationProviderId[])
      : undefined;

  return {
    pipelineStatus: hybrid.status,
    canAutoPublish: hybrid.status === "approved",
    autoPublishThresholdExclusive: AUTO_PUBLISH_THRESHOLD_EXCLUSIVE,
    pipelineScore,
    moderationProvider: provider,
    moderationProviderLabel: providerLabel,
    moderationFallbacks: fallbacks,
  };
}

function enrichReviewWithAiStatus(
  review: NonNullable<AnalyzerResult["review"]>,
  quality: AnalyzerResult,
): NonNullable<AnalyzerResult["review"]> {
  if (quality.source === "ai") return review;
  if (!quality.fallbackFrom) return review;
  return {
    ...review,
    aiEnhancementNote: `${quality.fallbackFrom} analysis was unavailable. Showing local analyzer results.`,
  };
}

export function buildUnifiedPreview(
  hybrid: HybridAnalyzeResult,
  quality: AnalyzerResult,
  includeDebug: boolean,
): UnifiedAnalysisPreview {
  const pipelineScore = Math.round(hybrid.score);
  const overallScore = quality.overallScore ?? quality.score;
  const score = overallScore;
  const breakdown =
    quality.source === "ai"
      ? quality.breakdown
      : quality.dimensions
        ? undefined
        : breakdownFromHybrid(hybrid) ?? quality.breakdown;

  const review = quality.review ? enrichReviewWithAiStatus(quality.review, quality) : undefined;

  const suggestions = review
    ? [...(review.highImpactImprovements ?? []), ...(review.optionalEnhancements ?? [])]
    : quality.suggestions;

  const preview: UnifiedAnalysisPreview = {
    score,
    overallScore,
    source: hybrid.source,
    qualitySource: quality.source === "ai" ? "ai" : "rules",
    analyzerProvider: quality.analyzerProvider,
    providerLabel: quality.providerLabel,
    aiStatus: hybrid.aiStatus,
    promptType: quality.promptType,
    promptTypeLabel: quality.promptTypeLabel,
    detectedIntent: quality.detectedIntent,
    dimensions: quality.source === "rules" ? quality.dimensions : undefined,
    review,
    issues: quality.review ? [] : quality.source === "ai" ? quality.issues : [],
    suggestions,
    improvedPrompt: quality.improvedPrompt,
    breakdown,
    missingParts: quality.missingParts,
    fallbackFrom: quality.fallbackFrom,
    moderation: moderationMetaFromHybrid(hybrid),
  };

  if (includeDebug) {
    const ad = hybrid.aiDetails;
    preview.debug = {
      displayScore: score,
      qualitySource: quality.source,
      analyzerProvider: quality.analyzerProvider,
      pipelineScore,
      decisionScore: pipelineScore,
      pipelineStatus: hybrid.status,
      ruleFlags: hybrid.flags,
      aiStatus: hybrid.aiStatus,
      moderationProvider: moderationMetaFromHybrid(hybrid).moderationProvider,
      aiDetailsKeys: ad && typeof ad === "object" ? Object.keys(ad) : [],
    };
  }

  return preview;
}

export async function runUnifiedPromptAnalysis(
  content: string,
  options?: { includeDebug?: boolean; analyzerProvider?: QualityAnalyzerId },
): Promise<{ hybrid: HybridAnalyzeResult; quality: AnalyzerResult; preview: UnifiedAnalysisPreview }> {
  const hybrid = await analyzePromptWithRecovery(content);
  const quality = await analyzePromptQuality(content, options?.analyzerProvider ?? "local");
  const preview = buildUnifiedPreview(hybrid, quality, options?.includeDebug === true);
  return { hybrid, quality, preview };
}
