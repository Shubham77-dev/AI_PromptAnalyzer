import { analyzeWithAI } from "./aiAnalyzer";
import { analyzeModerationWithLocal } from "./localModeration";
import type { ModerationAiOk, ModerationProviderId } from "./moderationAiShared";
import { analyzeModerationWithOllama, isOllamaModerationAvailable } from "./ollamaModeration";
import { selectModel } from "./modelRouter";
import { isOpenAiModerationAvailable } from "./openaiModeration";

export type ModerationProviderAttempt = {
  outcome: ModerationAiOk;
  /** Providers that were tried but failed before success. */
  fallbacks: ModerationProviderId[];
};

export async function analyzeWithModerationProviders(
  content: string,
  ruleScore: number,
  flags: string[],
): Promise<ModerationProviderAttempt> {
  const fallbacks: ModerationProviderId[] = [];

  if (isOpenAiModerationAvailable()) {
    const routed = selectModel(content);
    const openai = await analyzeWithAI(content, routed.modelId);
    if (openai.ok) {
      return {
        outcome: { ...openai, provider: "openai" },
        fallbacks,
      };
    }
    fallbacks.push("openai");
    if (process.env.ANALYZER_PIPELINE_DEBUG === "1") {
      console.error("[analyzer-pipeline] OpenAI moderation failed:", openai.error);
    }
  }

  if (isOllamaModerationAvailable()) {
    const ollama = await analyzeModerationWithOllama(content);
    if (ollama.ok) {
      return { outcome: ollama, fallbacks };
    }
    fallbacks.push("ollama");
    if (process.env.ANALYZER_PIPELINE_DEBUG === "1") {
      console.error("[analyzer-pipeline] Ollama moderation failed:", ollama.error);
    }
  }

  return {
    outcome: analyzeModerationWithLocal(ruleScore, flags),
    fallbacks,
  };
}
