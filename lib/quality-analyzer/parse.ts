import { cleanImprovedPrompt } from "@/lib/clean-improved-prompt";
import { AnalyzerResultSchema, type QualityAnalyzerResult } from "./types";
import type { QualityAnalyzerId } from "./types";
import { refineAiQualityResult } from "./refineAiFeedback";
export function clampInt(n: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, Math.round(n)));
}

export function uniq(items: string[]) {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const s of items) {
    const key = s.trim();
    if (!key) continue;
    if (seen.has(key.toLowerCase())) continue;
    seen.add(key.toLowerCase());
    out.push(key);
  }
  return out;
}

function extractJsonObject(text: string) {
  const trimmed = text.trim();
  if (trimmed.startsWith("{") && trimmed.endsWith("}")) return trimmed;

  const first = trimmed.indexOf("{");
  const last = trimmed.lastIndexOf("}");
  if (first >= 0 && last > first) return trimmed.slice(first, last + 1);
  return trimmed;
}

export function parseQualityAnalyzerJson(
  text: string,
  provider: QualityAnalyzerId,
  providerLabel: string,
  content: string,
): QualityAnalyzerResult | null {
  const candidate = extractJsonObject(text);
  try {
    const parsed = AnalyzerResultSchema.safeParse(JSON.parse(candidate));
    if (!parsed.success) return null;

    const base: QualityAnalyzerResult = {
      ...parsed.data,
      score: clampInt(parsed.data.score),
      issues: uniq(parsed.data.issues).slice(0, 12),
      suggestions: uniq(parsed.data.suggestions).slice(0, 12),
      improvedPrompt: cleanImprovedPrompt(parsed.data.improvedPrompt),
      overallScore: parsed.data.overallScore ?? clampInt(parsed.data.score),
      source: "ai",
      analyzerProvider: provider,
      providerLabel,
    };

    return refineAiQualityResult(content, base);
  } catch {
    return null;
  }
}