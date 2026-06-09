import type { HybridAnalyzeResult } from "@/lib/analyzer";
import { AUTO_PUBLISH_THRESHOLD_EXCLUSIVE } from "@/lib/analyzer/scoringEngine";
import type { AnalyzerResult } from "@/lib/ai";
import type { PromptValidationResult } from "@/lib/prompt-validator";
import {
  buildAnalysisRowFromQuality,
  displayScoreFromQuality,
  qualityDimensionsFromResult,
} from "@/lib/prompt-display-score";
import { buildSearchMetadataFields } from "@/lib/prompt-search-metadata";

export type SaveIntent = "draft" | "publish";

export type UserPublishOutcome = "published" | "under_review" | "rejected" | "draft_saved";

export type SavePersistence = {
  moderationStatus: "APPROVED" | "PENDING" | "REJECTED";
  nextStatus: "PUBLISHED" | "UNDER_REVIEW" | "DRAFT";
  flagged: boolean;
  reason: string;
  outcome: UserPublishOutcome;
  userMessage: string;
  flags: string[];
};

function buildHybridReason(hybrid: HybridAnalyzeResult): string {
  const ad = hybrid.aiDetails;
  if (ad && typeof ad === "object" && "scores" in ad) {
    const scores = (ad as { scores?: { reason?: string } }).scores;
    if (scores?.reason?.trim()) return scores.reason.trim();
  }
  if (ad && typeof ad === "object" && "skippedAi" in ad && ad.skippedAi) {
    return "Rejected by automated rule validation.";
  }
  if (ad && typeof ad === "object" && "aiError" in ad && ad.aiError) {
    return "AI signal was partial; prompt was scored with conservative blending.";
  }
  if (hybrid.status === "approved") return "Passed hybrid prompt analyzer.";
  if (hybrid.status === "pending") return "Queued for review based on analyzer score.";
  return "Did not meet publication threshold.";
}

export function buildPromptAnalysisRow(
  hybrid: HybridAnalyzeResult,
  quality: AnalyzerResult,
): { accuracy: number; clarity: number; suggestions: string } {
  return buildAnalysisRowFromQuality(hybrid, quality);
}

export function buildPromptQualityFields(content: string, quality: AnalyzerResult) {
  const searchFields = buildSearchMetadataFields(content, quality);
  return {
    score: displayScoreFromQuality(quality),
    qualityDimensions: qualityDimensionsFromResult(quality),
    promptTypeLabel: quality.promptTypeLabel ?? quality.promptType ?? null,
    maturityLevel: quality.review?.promptMaturityLevel ?? null,
    ...searchFields,
  };
}

/**
 * Maps hybrid analyzer output + publish intent + strict publish gate to DB fields and user-facing copy.
 */
export function resolveSavePersistence(input: {
  hybrid: HybridAnalyzeResult;
  publishValidation: PromptValidationResult;
  saveIntent: SaveIntent;
}): SavePersistence {
  const flags = [...input.hybrid.flags];

  if (input.saveIntent === "draft") {
    return {
      moderationStatus: "PENDING",
      nextStatus: "DRAFT",
      flagged: true,
      reason: buildHybridReason(input.hybrid),
      outcome: "draft_saved",
      userMessage: "Your prompt was saved as a draft.",
      flags,
    };
  }

  let moderationStatus: SavePersistence["moderationStatus"] =
    input.hybrid.status === "approved"
      ? "APPROVED"
      : input.hybrid.status === "pending"
        ? "PENDING"
        : "REJECTED";

  const publishGateFailed = !input.publishValidation.ok;
  if (publishGateFailed) {
    flags.push("publish_validation_failed");
    console.warn("[analyzer-pipeline] strict publish validation failed; blocking auto-publish", {
      issues: input.publishValidation.ok ? [] : input.publishValidation.issues,
    });
    if (moderationStatus === "APPROVED") moderationStatus = "PENDING";
  }

  const nextStatus: SavePersistence["nextStatus"] =
    moderationStatus === "APPROVED"
      ? "PUBLISHED"
      : moderationStatus === "PENDING"
        ? "UNDER_REVIEW"
        : "DRAFT";

  const flagged = moderationStatus !== "APPROVED";

  let outcome: UserPublishOutcome;
  if (moderationStatus === "APPROVED" && !publishGateFailed) outcome = "published";
  else if (moderationStatus === "REJECTED") outcome = "rejected";
  else outcome = "under_review";

  let reason = buildHybridReason(input.hybrid);
  if (publishGateFailed && input.saveIntent === "publish") {
    reason = `${reason} Strict publish checklist was not satisfied.`;
  }

  let userMessage: string;
  if (outcome === "published") {
    userMessage = "Your prompt has been published successfully.";
  } else if (outcome === "rejected") {
    userMessage = "Your prompt needs improvement before publishing.";
  } else if (publishGateFailed) {
    userMessage =
      "Your prompt is under review. Add an explicit role, a clear task, and an output format to qualify for auto-publish next time.";
  } else {
    userMessage = "Your prompt is under review due to medium quality.";
  }

  return {
    moderationStatus,
    nextStatus,
    flagged,
    reason,
    outcome,
    userMessage,
    flags,
  };
}

export function saveDebugSnapshot(input: {
  hybrid: HybridAnalyzeResult;
  persistence: SavePersistence;
  publishGateFailed: boolean;
}): Record<string, unknown> {
  const h = input.hybrid;
  return {
    decisionScore: h.score,
    pipelineStatus: h.status,
    autoPublishThresholdExclusive: AUTO_PUBLISH_THRESHOLD_EXCLUSIVE,
    moderationStatus: input.persistence.moderationStatus,
    outcome: input.persistence.outcome,
    publishGateFailed: input.publishGateFailed,
    aiOk: Boolean(
      h.aiDetails &&
        typeof h.aiDetails === "object" &&
        !("aiError" in h.aiDetails && (h.aiDetails as { aiError?: unknown }).aiError),
    ),
    reviewOrRejectReason: input.persistence.userMessage,
  };
}
