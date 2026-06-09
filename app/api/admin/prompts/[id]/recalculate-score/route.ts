import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { isAdmin } from "@/lib/rbac";
import { analyzePromptDeterministic } from "@/lib/deterministic-analyzer";
import {
  buildAnalysisRowFromDeterministic,
  qualityDimensionsFromDeterministic,
} from "@/lib/prompt-display-score";

export async function POST(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user || !isAdmin(user)) {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  const params = await ctx.params;
  const parsed = z.object({ id: z.string().uuid() }).safeParse(params);
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: "Invalid prompt id" }, { status: 400 });
  }

  const prompt = await prisma.prompt.findUnique({
    where: { id: parsed.data.id },
    select: { id: true, content: true },
  });
  if (!prompt) {
    return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
  }

  const det = analyzePromptDeterministic(prompt.content);
  const analysisRow = buildAnalysisRowFromDeterministic(det);
  const dimensions = qualityDimensionsFromDeterministic(det);

  await prisma.prompt.update({
    where: { id: prompt.id },
    data: {
      score: det.overallScore,
      promptTypeLabel: det.promptTypeLabel,
      maturityLevel: det.review.promptMaturityLevel,
      qualityDimensions: dimensions as Prisma.InputJsonValue,
      analysis: {
        upsert: {
          create: analysisRow,
          update: analysisRow,
        },
      },
    },
  });

  return NextResponse.json({
    success: true,
    score: det.overallScore,
    dimensions,
    maturityLevel: det.review.promptMaturityLevel,
    promptTypeLabel: det.promptTypeLabel,
  });
}
