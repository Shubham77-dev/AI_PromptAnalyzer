import { NextResponse } from "next/server";
import { z } from "zod";
import { analyzePrompt } from "@/lib/ai";
import { getCurrentUser } from "@/lib/auth";
import {
  checkAndIncrementDailyUsage,
  DAILY_LIMIT_GUEST,
  DAILY_LIMIT_USER,
  getClientIp,
} from "@/lib/usage-limits";

const BodySchema = z.object({
  content: z.string().min(1).max(20_000),
});

export async function POST(req: Request) {
  // Optional auth: guests can analyze (limited), saving/publishing requires login.
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

  const result = await analyzePrompt(parsed.data.content);
  return NextResponse.json({
    score: result.score,
    issues: result.issues,
    suggestions: result.suggestions,
    improvedPrompt: result.improvedPrompt,
    source: result.source,
    usage: { limit, remaining: usage.remaining },
  });
}

