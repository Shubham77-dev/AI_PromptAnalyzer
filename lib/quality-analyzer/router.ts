import { analyzeWithLocal } from "./local";
import { analyzeWithOllama, isOllamaQualityAvailable } from "./ollama";
import { analyzeWithOpenAi, isOpenAiQualityAvailable } from "./openai";
import type { QualityAnalyzerId, QualityAnalyzerProviderInfo, QualityAnalyzerResult } from "./types";

export function listQualityAnalyzerProviders(): QualityAnalyzerProviderInfo[] {
  const openaiAvailable = isOpenAiQualityAvailable();
  const ollamaAvailable = isOllamaQualityAvailable();

  const openaiModel = process.env.OPENAI_MODEL?.trim() || "gpt-4o-mini";
  const ollamaModel = process.env.OLLAMA_MODEL?.trim() || "gpt-oss:120b-cloud";

  return [
    {
      id: "local",
      label: "Local",
      description: "Fast offline analysis using the built-in Prompt Quality Engine.",
      available: true,
    },
    {
      id: "auto",
      label: "Auto",
      description: "Automatically uses the best available AI for this request.",
      available: openaiAvailable || ollamaAvailable,
    },
    {
      id: "openai",
      label: "OpenAI",
      description: `Cloud analysis with ${openaiModel}.`,
      available: openaiAvailable,
    },
    {
      id: "ollama",
      label: "Ollama",
      description: `Cloud analysis with ${ollamaModel}.`,
      available: ollamaAvailable,
    },
  ];
}

async function tryAutoProviders(content: string): Promise<QualityAnalyzerResult | null> {
  if (isOpenAiQualityAvailable()) {
    const openai = await analyzeWithOpenAi(content);
    if (openai) return openai;
  }
  if (isOllamaQualityAvailable()) {
    const ollama = await analyzeWithOllama(content);
    if (ollama) return ollama;
  }
  return null;
}

function withLocalFallback(requested: QualityAnalyzerId, content: string): QualityAnalyzerResult {
  return {
    ...analyzeWithLocal(content),
    fallbackFrom: requested,
  };
}

/**
 * Runs quality analysis for the upload preview.
 * Default is local. AI providers fall back to local on failure.
 */
export async function analyzeWithQualityProvider(
  content: string,
  provider: QualityAnalyzerId = "local",
): Promise<QualityAnalyzerResult> {
  if (provider === "local") {
    return analyzeWithLocal(content);
  }

  if (provider === "auto") {
    const auto = await tryAutoProviders(content);
    return auto ?? withLocalFallback("auto", content);
  }

  if (provider === "openai") {
    const openai = await analyzeWithOpenAi(content);
    return openai ?? withLocalFallback("openai", content);
  }

  if (provider === "ollama") {
    const ollama = await analyzeWithOllama(content);
    return ollama ?? withLocalFallback("ollama", content);
  }

  return analyzeWithLocal(content);
}
