import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { runUnifiedPromptAnalysis } from "@/lib/prompt-analysis";
import { listQualityAnalyzerProviders, QualityAnalyzerIdSchema } from "@/lib/quality-analyzer";
import {
  checkAndIncrementDailyUsage,
  DAILY_LIMIT_GUEST,
  DAILY_LIMIT_USER,
  getClientIp,
} from "@/lib/usage-limits";

const BodySchema = z.object({
  content: z.string().min(1).max(20_000),
  /** Quality analyzer: local (default), auto, openai, or ollama. */
  analyzerProvider: QualityAnalyzerIdSchema.optional(),
  /** When true, response includes a small debug object (same fields shape as after save). */
  debug: z.boolean().optional(),
});

export async function GET() {
  return NextResponse.json({ providers: listQualityAnalyzerProviders() });
}

export async function POST(req: Request) {
  const user = await getCurrentUser().catch(() => null);
  const limit = user ? DAILY_LIMIT_USER : DAILY_LIMIT_GUEST;
  const ip = getClientIp(req);

  const usage = await checkAndIncrementDailyUsage({
    userId: user?.id ?? null,
    ip,
    limit,
  }).catch(() => null);

  if (!usage?.ok) {
    return NextResponse.json(
      { error: "Daily limit reached. Please login or upgrade." },
      { status: 429 },
    );
  }

  const json = await req.json().catch(() => null);
  const parsed = BodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  const includeDebug =
    parsed.data.debug === true ||
    process.env.ANALYZER_DEBUG === "1" ||
    process.env.ANALYZER_PIPELINE_DEBUG === "1";

  const analyzerProvider = parsed.data.analyzerProvider ?? "local";

  const { preview } = await runUnifiedPromptAnalysis(parsed.data.content, {
    includeDebug,
    analyzerProvider,
  });

  return NextResponse.json({
    score: preview.score,
    overallScore: preview.score,
    aiStatus: preview.aiStatus,
    issues: preview.issues,
    suggestions: preview.suggestions,
    improvedPrompt: preview.improvedPrompt,
    source: preview.source,
    qualitySource: preview.qualitySource,
    analyzerProvider: preview.analyzerProvider,
    providerLabel: preview.providerLabel,
    promptType: preview.promptTypeLabel ?? preview.promptType,
    detectedIntent: preview.detectedIntent,
    dimensions: preview.dimensions,
    review: preview.review,
    breakdown: preview.breakdown,
    missingParts: preview.missingParts,
    fallbackFrom: preview.fallbackFrom,
    moderation: preview.moderation,
    ...(preview.debug ? { debug: preview.debug } : {}),
    usage: { limit, remaining: usage.remaining },
  });
}
