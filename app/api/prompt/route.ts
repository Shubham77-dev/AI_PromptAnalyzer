import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

const AnalysisSchema = z
  .object({
    accuracy: z.number().int().min(0).max(100),
    clarity: z.number().int().min(0).max(100),
    suggestions: z.string().min(1).max(10_000),
  })
  .optional();

const HybridAnalysisSchema = z
  .object({
    score: z.number().int().min(0).max(100),
    issues: z.array(z.string().min(1)).max(50),
    suggestions: z.array(z.string().min(1)).max(50),
    improvedPrompt: z.string().min(1).max(30_000),
  })
  .optional();

const CreateSchema = z.object({
  content: z.string().min(1).max(20_000),
  analysis: z.union([AnalysisSchema, HybridAnalysisSchema]).optional(),
});

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const json = await req.json().catch(() => null);
  const parsed = CreateSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  const created = await prisma.prompt.create({
    data: {
      userId: user.id,
      content: parsed.data.content,
      status: "DRAFT",
      stats: { create: {} },
      ...(parsed.data.analysis
        ? {
            analysis: {
              create: (() => {
                const a = parsed.data.analysis as
                  | { accuracy: number; clarity: number; suggestions: string }
                  | { score: number; issues: string[]; suggestions: string[]; improvedPrompt: string };

                if ("accuracy" in a) return a;

                const suggestionsText = [
                  `Score: ${a.score}`,
                  a.issues.length ? `Issues:\n- ${a.issues.join("\n- ")}` : "",
                  a.suggestions.length ? `Suggestions:\n- ${a.suggestions.join("\n- ")}` : "",
                  `Improved prompt:\n${a.improvedPrompt}`,
                ]
                  .filter(Boolean)
                  .join("\n\n")
                  .slice(0, 10_000);

                return {
                  accuracy: a.score,
                  clarity: a.score,
                  suggestions: suggestionsText,
                };
              })(),
            },
          }
        : {}),
    },
    include: { analysis: true, stats: true },
  });

  return NextResponse.json({ ok: true, prompt: created });
}

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const prompts = await prisma.prompt.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    include: { analysis: true, stats: true },
  });

  return NextResponse.json({ ok: true, prompts });
}

