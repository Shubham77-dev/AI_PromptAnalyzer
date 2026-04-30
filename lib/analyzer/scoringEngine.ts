export type FinalDecision = "approved" | "pending" | "rejected";

const RULE_WEIGHT = 0.3;
const AI_WEIGHT = 0.7;

export function calculateFinalScore(ruleScore: number, aiScore: number): {
  finalScore: number;
  decision: FinalDecision;
} {
  const r = clamp(ruleScore);
  const a = clamp(aiScore);
  const finalScore = Math.round(r * RULE_WEIGHT + a * AI_WEIGHT);

  let decision: FinalDecision;
  if (finalScore > 75) decision = "approved";
  else if (finalScore >= 50) decision = "pending";
  else decision = "rejected";

  return { finalScore, decision };
}

function clamp(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(100, n));
}
