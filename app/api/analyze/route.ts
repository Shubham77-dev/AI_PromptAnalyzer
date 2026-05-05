import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { runUnifiedPromptAnalysis } from "@/lib/prompt-analysis";
import {
  checkAndIncrementDailyUsage,
  DAILY_LIMIT_GUEST,
  DAILY_LIMIT_USER,
  getClientIp,
} from "@/lib/usage-limits";

const BodySchema = z.object({
  content: z.string().min(1).max(20_000),
  /** When true, response includes a small debug object (same fields shape as after save). */
  debug: z.boolean().optional(),
});

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

  const { preview } = await runUnifiedPromptAnalysis(parsed.data.content, { includeDebug });

  return NextResponse.json({
    score: preview.score,
    issues: preview.issues,
    suggestions: preview.suggestions,
    improvedPrompt: preview.improvedPrompt,
    source: preview.source,
    breakdown: preview.breakdown,
    missingParts: preview.missingParts,
    moderation: preview.moderation,
    ...(preview.debug ? { debug: preview.debug } : {}),
    usage: { limit, remaining: usage.remaining },
  });
}
