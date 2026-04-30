/**
 * Hybrid prompt analyzer: rules → (optional) AI → weighted score → moderation decision.
 * Model routing stays internal — do not expose to API consumers.
 */

import { analyzeWithAI } from "./aiAnalyzer";
import { selectModel } from "./modelRouter";
import { analyzeWithRules } from "./ruleEngine";
import { calculateFinalScore } from "./scoringEngine";

export type HybridAnalyzeResult = {
  status: "approved" | "pending" | "rejected";
  score: number;
  flags: string[];
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
      aiDetails: {
        skippedAi: true,
        reason: "severe_rule_failure",
        ruleScore: rules.score,
      },
    };
  }

  const routed = selectModel(content);
  const ai = await analyzeWithAI(content, routed.modelId);

  let aiScoreForBlend: number;
  let aiDetails: Record<string, unknown>;

  if (ai.ok) {
    aiScoreForBlend = ai.scores.finalScore;
    aiDetails = {
      provider: routed.provider,
      model: ai.model,
      scores: ai.scores,
    };
  } else {
    // Policy: never hard-fail the request — queue for review with conservative score
    console.error("[analyzer-pipeline] AI unavailable; using fallback:", ai.error);
    aiScoreForBlend = ai.fallbackAiScore;
    aiDetails = {
      provider: routed.provider,
      modelAttempted: routed.modelId,
      aiError: ai.error,
      fallbackAiScore: ai.fallbackAiScore,
      pendingReview: true,
    };
  }

  // When rules did not pass minimum bar, still blend but bias toward rules (already reflected in low rule score)
  if (!rules.passed && ai.ok) {
    aiDetails = {
      ...aiDetails,
      ruleWarnings: rules.flags,
    };
  }

  const { finalScore, decision } = calculateFinalScore(rules.score, aiScoreForBlend);

  // API outage / parse failure: always queue for human review (never auto-approve without AI signal)
  const status: HybridAnalyzeResult["status"] = ai.ok ? decision : "pending";

  return {
    status,
    score: finalScore,
    flags: rules.flags,
    aiDetails,
  };
}
