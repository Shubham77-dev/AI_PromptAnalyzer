export type FinalDecision = "approved" | "pending" | "rejected";

// Hybrid blend weights (AI is optional; rules must remain reliable on their own).
const RULE_WEIGHT = 0.7;
const AI_WEIGHT = 0.3;

/** Blended score must be strictly greater than this to auto-approve (i.e. 76+). */
export const AUTO_PUBLISH_THRESHOLD_EXCLUSIVE = 75;

export function calculateFinalScore(ruleScore: number, aiScore: number): {
  finalScore: number;
  decision: FinalDecision;
} {
  const r = clamp(ruleScore);
  const a = clamp(aiScore);
  const finalScore = Math.round(r * RULE_WEIGHT + a * AI_WEIGHT);

  let decision: FinalDecision;
  if (finalScore > AUTO_PUBLISH_THRESHOLD_EXCLUSIVE) decision = "approved";
  else if (finalScore >= 50) decision = "pending";
  else decision = "rejected";

  return { finalScore, decision };
}

function clamp(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(100, n));
}
