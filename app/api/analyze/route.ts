import { NextResponse } from "next/server";
import { z } from "zod";
import { analyzePrompt } from "@/lib/ai";
import { getCurrentUser } from "@/lib/auth";

const BodySchema = z.object({
  content: z.string().min(1).max(20_000),
});

export async function POST(req: Request) {
  // Optional auth: analysis can be used pre-save, but we still support anonymous.
  await getCurrentUser().catch(() => null);

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
  });
}

