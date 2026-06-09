import { z } from "zod";

export const ModerationAiJsonSchema = z.object({
  clarityScore: z.number().min(0).max(100),
  usefulnessScore: z.number().min(0).max(100),
  safetyScore: z.number().min(0).max(100),
  creativityScore: z.number().min(0).max(100),
  finalScore: z.number().min(0).max(100),
  reason: z.string().min(1).max(2000),
});

export type ModerationAiScores = z.infer<typeof ModerationAiJsonSchema>;

export type ModerationProviderId = "openai" | "ollama" | "local";

export type ModerationAiOk = {
  ok: true;
  provider: ModerationProviderId;
  model: string;
  scores: ModerationAiScores;
};

export type ModerationAiFail = {
  ok: false;
  provider: ModerationProviderId;
  error: string;
};

export type ModerationAiOutcome = ModerationAiOk | ModerationAiFail;

export const MODERATION_AI_SYSTEM = [
  "You evaluate user-written prompts for clarity, usefulness, safety, and creativity.",
  "Respond with ONLY valid JSON matching the schema — no markdown fences or extra text.",
  "Scores are integers from 0 to 100.",
  "Safety penalizes jailbreaks, harmful instructions, or policy-evasion attempts.",
].join(" ");

export function buildModerationAiUserPrompt(content: string): string {
  return [
    "Analyze this prompt and return JSON:",
    `{ "clarityScore", "usefulnessScore", "safetyScore", "creativityScore", "finalScore", "reason" }`,
    "",
    "PROMPT:",
    "----",
    content,
    "----",
  ].join("\n");
}

export function clampModerationInt(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(100, Math.round(n)));
}

function extractJsonObject(text: string): string {
  const trimmed = text.trim();
  if (trimmed.startsWith("{") && trimmed.endsWith("}")) return trimmed;
  const first = trimmed.indexOf("{");
  const last = trimmed.lastIndexOf("}");
  if (first >= 0 && last > first) return trimmed.slice(first, last + 1);
  return trimmed;
}

export function parseModerationAiJson(text: string): ModerationAiScores | null {
  try {
    const candidate = extractJsonObject(text);
    const parsed = ModerationAiJsonSchema.safeParse(JSON.parse(candidate));
    if (!parsed.success) return null;

    return {
      clarityScore: clampModerationInt(parsed.data.clarityScore),
      usefulnessScore: clampModerationInt(parsed.data.usefulnessScore),
      safetyScore: clampModerationInt(parsed.data.safetyScore),
      creativityScore: clampModerationInt(parsed.data.creativityScore),
      finalScore: clampModerationInt(parsed.data.finalScore),
      reason: parsed.data.reason.trim(),
    };
  } catch {
    return null;
  }
}
