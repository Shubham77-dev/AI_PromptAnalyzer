import type { HybridAnalyzeResult } from "@/lib/analyzer";
import { analyzePromptWithRecovery } from "@/lib/analyzer";
import { AUTO_PUBLISH_THRESHOLD_EXCLUSIVE } from "@/lib/analyzer/scoringEngine";
import { analyzePromptHeuristics, type AnalyzerResult } from "@/lib/ai";

function humanizeRuleFlag(flag: string): string {
  if (flag.startsWith("below_min_length:")) {
    const n = flag.split(":")[1] ?? "?";
    return `Prompt is shorter than the safe minimum (${n} characters).`;
  }
  if (flag.startsWith("above_max_length:")) {
    const n = flag.split(":")[1] ?? "?";
    return `Prompt exceeds maximum length (${n} characters).`;
  }
  if (flag.startsWith("banned_keyword:")) {
    const k = flag.slice("banned_keyword:".length);
    return `Potentially unsafe or disallowed content detected (${k}).`;
  }
  if (flag === "spam_like_repetition") return "Content looks highly repetitive (spam-like).";
  if (flag === "low_entropy_line") return "Contains very low-information lines.";
  if (flag === "possible_duplicate_content") return "Content may be duplicated back-to-back.";
  if (flag === "analyzer_exception") return "Analyzer hit an unexpected error; score used rule-based recovery.";
  if (flag === "analyzer_error") return "AI analysis was unavailable; conservative scoring was applied.";
  return flag.replace(/_/g, " ");
}

function breakdownFromHybrid(hybrid: HybridAnalyzeResult): AnalyzerResult["breakdown"] | undefined {
  const ad = hybrid.aiDetails;
  if (!ad || typeof ad !== "object" || !("scores" in ad)) return undefined;
  const s = (ad as { scores?: Record<string, unknown> }).scores;
  if (!s || typeof s !== "object") return undefined;
  const c = s.clarityScore;
  const u = s.usefulnessScore;
  const sf = s.safetyScore;
  const cr = s.creativityScore;
  const f = s.finalScore;
  if (typeof c !== "number") return undefined;
  const finalBlend = typeof f === "number" ? Math.round(f) : Math.round(hybrid.score);
  return {
    clarity: Math.round(c),
    structure: typeof cr === "number" ? Math.round(cr) : finalBlend,
    specificity: typeof u === "number" ? Math.round(u) : finalBlend,
    outputDefinition: typeof sf === "number" ? Math.round(sf) : finalBlend,
    accuracy:
      typeof u === "number"
        ? Math.round((c + u + finalBlend) / 3)
        : Math.round((c + finalBlend) / 2),
  };
}

export type UnifiedAnalysisPreview = {
  score: number;
  issues: string[];
  suggestions: string[];
  improvedPrompt: string;
  source: "hybrid+heuristics";
  breakdown?: AnalyzerResult["breakdown"];
  missingParts?: AnalyzerResult["missingParts"];
  moderation: {
    pipelineStatus: HybridAnalyzeResult["status"];
    /** True when blended score clears the same threshold used on save for auto-publish. */
    canAutoPublish: boolean;
    autoPublishThresholdExclusive: number;
  };
  debug?: Record<string, unknown>;
};

function uniqCap(strings: string[], max: number) {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of strings) {
    const s = raw.trim();
    if (!s) continue;
    const key = s.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(s);
    if (out.length >= max) break;
  }
  return out;
}

export function buildUnifiedPreview(
  hybrid: HybridAnalyzeResult,
  heuristics: AnalyzerResult,
  includeDebug: boolean,
): UnifiedAnalysisPreview {
  const issues: string[] = [];

  const ad = hybrid.aiDetails;
  if (ad && typeof ad === "object" && "scores" in ad) {
    const scores = (ad as { scores?: { reason?: string } }).scores;
    const r = scores?.reason?.trim();
    if (r) issues.push(r);
  }
  if (ad && typeof ad === "object" && "aiError" in ad && ad.aiError) {
    issues.push(
      `Automated review used a fallback signal: ${String((ad as { aiError?: unknown }).aiError).slice(0, 200)}`,
    );
  }

  for (const f of hybrid.flags) {
    issues.push(humanizeRuleFlag(f));
  }
  for (const iss of heuristics.issues) issues.push(iss);

  const score = Math.round(hybrid.score);
  const breakdown = breakdownFromHybrid(hybrid) ?? heuristics.breakdown;
  /** Same bar as save path: hybrid pipeline already encodes the > threshold exclusive rule. */
  const canAutoPublish = hybrid.status === "approved";

  const preview: UnifiedAnalysisPreview = {
    score,
    issues: uniqCap(issues, 14),
    suggestions: uniqCap(heuristics.suggestions, 14),
    improvedPrompt: heuristics.improvedPrompt,
    source: "hybrid+heuristics",
    breakdown,
    missingParts: heuristics.missingParts,
    moderation: {
      pipelineStatus: hybrid.status,
      canAutoPublish,
      autoPublishThresholdExclusive: AUTO_PUBLISH_THRESHOLD_EXCLUSIVE,
    },
  };

  if (includeDebug) {
    preview.debug = {
      decisionScore: score,
      pipelineStatus: hybrid.status,
      ruleFlags: hybrid.flags,
      aiDetailsKeys: ad && typeof ad === "object" ? Object.keys(ad) : [],
    };
  }

  return preview;
}

export async function runUnifiedPromptAnalysis(
  content: string,
  options?: { includeDebug?: boolean },
): Promise<{ hybrid: HybridAnalyzeResult; heuristics: AnalyzerResult; preview: UnifiedAnalysisPreview }> {
  const hybrid = await analyzePromptWithRecovery(content);
  const heuristics = analyzePromptHeuristics(content);
  const preview = buildUnifiedPreview(hybrid, heuristics, options?.includeDebug === true);
  return { hybrid, heuristics, preview };
}
