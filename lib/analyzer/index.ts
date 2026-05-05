/**
 * Hybrid prompt analyzer: rules → (optional) AI → weighted score → moderation decision.
 * Model routing stays internal — do not expose to API consumers.
 */

import { analyzeWithAI } from "./aiAnalyzer";
import { selectModel } from "./modelRouter";
import { analyzeWithRules } from "./ruleEngine";
import { calculateFinalScore } from "./scoringEngine";

function clampHybridScore(n: number): number {
  if (!Number.isFinite(n)) return 1;
  return Math.max(0, Math.min(100, Math.round(n)));
}

export type HybridAnalyzeResult = {
  status: "approved" | "pending" | "rejected";
  score: number;
  flags: string[];
  /**
   * "rule" when AI was skipped/unavailable; "rule+ai" when blended with AI.
   * This is safe to expose to API consumers.
   */
  source: "rule" | "rule+ai";
  /**
   * "ok" when AI contributed to the blend; "error" when AI was unavailable;
   * "skipped" when AI was intentionally not used (e.g. severe rule failure).
   */
  aiStatus: "ok" | "error" | "skipped";
  aiDetails?: Record<string, unknown>;
};

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

  const routed = selectModel(content);
  const ai = await analyzeWithAI(content, routed.modelId);

  if (!ai.ok) {
    // AI failure must not corrupt the outcome. Use rule score as the final score.
    console.error("[analyzer-pipeline] AI unavailable; using rule-only score:", ai.error);
    const ruleOnlyScore = clampHybridScore(rules.score);
    const { decision } = calculateFinalScore(ruleOnlyScore, ruleOnlyScore);
    return {
      status: decision,
      score: ruleOnlyScore,
      flags: Array.from(new Set([...rules.flags, "analyzer_error"])),
      source: "rule",
      aiStatus: "error",
      aiDetails: {
        provider: routed.provider,
        modelAttempted: routed.modelId,
        aiError: ai.error,
        ruleScore: rules.score,
      },
    };
  }

  const aiDetails: Record<string, unknown> = {
    provider: routed.provider,
    model: ai.model,
    scores: ai.scores,
  };

  if (!rules.passed) {
    aiDetails.ruleWarnings = rules.flags;
  }

  const { finalScore, decision } = calculateFinalScore(rules.score, ai.scores.finalScore);

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
    const score = clampHybridScore(rules.score);
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
