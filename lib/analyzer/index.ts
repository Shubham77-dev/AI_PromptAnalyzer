/**
 * Hybrid prompt analyzer: rules → (optional) AI → weighted score → moderation decision.
 * Moderation AI fallback: OpenAI → Ollama → local rules scoring.
 */

import { analyzeWithModerationProviders } from "./moderationRouter";
import { analyzeWithRules } from "./ruleEngine";
import { calculateFinalScore } from "./scoringEngine";
import type { ModerationProviderId } from "./moderationAiShared";

function clampHybridScore(n: number): number {
  if (!Number.isFinite(n)) return 1;
  return Math.max(0, Math.min(100, Math.round(n)));
}

const MODERATION_PROVIDER_LABELS: Record<ModerationProviderId, string> = {
  openai: "OpenAI",
  ollama: "Ollama",
  local: "Local rules",
};

export type HybridAnalyzeResult = {
  status: "approved" | "pending" | "rejected";
  score: number;
  flags: string[];
  /**
   * "rule" when only local rules drove the score without AI blend;
   * "rule+ai" when an AI provider (OpenAI, Ollama, or local AI scoring) contributed.
   */
  source: "rule" | "rule+ai";
  /**
   * "ok" when a moderation provider succeeded;
   * "error" when all providers failed unexpectedly;
   * "skipped" when AI was intentionally not used (e.g. severe rule failure).
   */
  aiStatus: "ok" | "error" | "skipped";
  aiDetails?: Record<string, unknown>;
};

function buildAiSuccessDetails(
  provider: ModerationProviderId,
  model: string,
  scores: Record<string, unknown>,
  fallbacks: ModerationProviderId[],
  ruleWarnings?: string[],
): Record<string, unknown> {
  const details: Record<string, unknown> = {
    provider,
    providerLabel: MODERATION_PROVIDER_LABELS[provider],
    model,
    scores,
  };
  if (fallbacks.length > 0) details.fallbacks = fallbacks;
  if (ruleWarnings?.length) details.ruleWarnings = ruleWarnings;
  return details;
}

/**
 * End-to-end analysis for prompt creation / moderation.
 */
export async function analyzePrompt(content: string): Promise<HybridAnalyzeResult> {
  const rules = analyzeWithRules(content);

  if (rules.severeFailure) {
    const { finalScore } = calculateFinalScore(rules.score, rules.score);
    return {
      status: "rejected" as const,
      score: finalScore,
      flags: rules.flags,
      source: "rule",
      aiStatus: "skipped",
      aiDetails: {
        skippedAi: true,
        reason: "severe_rule_failure",
        ruleScore: rules.score,
      },
    };
  }

  const { outcome, fallbacks } = await analyzeWithModerationProviders(content, rules.score, rules.flags);

  const aiDetails = buildAiSuccessDetails(
    outcome.provider,
    outcome.model,
    outcome.scores,
    fallbacks,
    rules.passed ? undefined : rules.flags,
  );

  const { finalScore, decision } = calculateFinalScore(rules.score, outcome.scores.finalScore);

  return {
    status: decision,
    score: finalScore,
    flags: rules.flags,
    source: "rule+ai",
    aiStatus: "ok",
    aiDetails,
  };
}

/**
 * Same as {@link analyzePrompt} but never throws; uses rule-only recovery with logging.
 */
export async function analyzePromptWithRecovery(content: string): Promise<HybridAnalyzeResult> {
  try {
    return await analyzePrompt(content);
  } catch (e) {
    const errMsg = e instanceof Error ? e.message : "Unknown error";
    console.error("[analyzer-pipeline] analyzePrompt threw; using rule-only recovery", e);
    const rules = analyzeWithRules(content);
    const { finalScore, decision } = calculateFinalScore(rules.score, rules.score);
    const status: HybridAnalyzeResult["status"] = rules.severeFailure ? "rejected" : decision;
    const score = clampHybridScore(finalScore);
    return {
      status,
      score,
      flags: Array.from(new Set([...rules.flags, "analyzer_exception"])),
      source: "rule",
      aiStatus: "error",
      aiDetails: {
        aiError: errMsg,
        recover: true,
        ruleScore: rules.score,
      },
    };
  }
}

export { MODERATION_PROVIDER_LABELS };
