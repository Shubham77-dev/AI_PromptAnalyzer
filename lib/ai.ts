import {
  analyzeWithLocal,
  analyzeWithQualityProvider,
  isOllamaQualityAvailable,
  isOpenAiQualityAvailable,
  type QualityAnalyzerId,
  type QualityAnalyzerResult,
} from "@/lib/quality-analyzer";

/** @deprecated Use QualityAnalyzerResult from @/lib/quality-analyzer */
export type AnalyzerResult = QualityAnalyzerResult;

export function isAiQualityAnalyzerAvailable(): boolean {
  return isOpenAiQualityAvailable() || isOllamaQualityAvailable();
}

/** Local deterministic analysis only — no network. */
export function analyzePromptHeuristics(content: string): AnalyzerResult {
  return analyzeWithLocal(content);
}

/** @deprecated Use analyzeWithOpenAi from quality-analyzer */
export async function openAiAnalyze(content: string): Promise<AnalyzerResult | null> {
  const { analyzeWithOpenAi } = await import("@/lib/quality-analyzer/openai");
  return analyzeWithOpenAi(content);
}

export async function analyzePromptQuality(
  content: string,
  provider: QualityAnalyzerId = "local",
): Promise<AnalyzerResult> {
  return analyzeWithQualityProvider(content, provider);
}
