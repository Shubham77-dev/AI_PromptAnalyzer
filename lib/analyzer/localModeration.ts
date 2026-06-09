import { clampModerationInt, type ModerationAiOk } from "./moderationAiShared";

/**
 * Deterministic moderation scores derived from rule-engine output.
 * Used when OpenAI and Ollama are unavailable.
 */
export function analyzeModerationWithLocal(
  ruleScore: number,
  flags: string[],
): ModerationAiOk {
  const hasBanned = flags.some((f) => f.startsWith("banned_keyword"));
  const hasSpam = flags.includes("spam_like_repetition") || flags.includes("low_entropy_line");

  const safetyScore = clampModerationInt(hasBanned ? 15 : hasSpam ? 45 : 88);
  const clarityScore = clampModerationInt(ruleScore * 0.92);
  const usefulnessScore = clampModerationInt(ruleScore);
  const creativityScore = clampModerationInt(Math.min(usefulnessScore + 8, 100));
  const finalScore = clampModerationInt(
    (clarityScore + usefulnessScore + safetyScore + creativityScore) / 4,
  );

  return {
    ok: true,
    provider: "local",
    model: "local-rules",
    scores: {
      clarityScore,
      usefulnessScore,
      safetyScore,
      creativityScore,
      finalScore,
      reason: "Local rule-based moderation scoring (cloud AI providers unavailable).",
    },
  };
}
