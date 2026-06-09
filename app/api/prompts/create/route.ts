import { NextResponse } from "next/server";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { prismaKnownRequestResponse } from "@/lib/prisma-errors";
import { getCurrentUser } from "@/lib/auth";
import { canBypassPromptValidation } from "@/lib/rbac";
import { normalizeOnly, validatePromptForPublish } from "@/lib/prompt-validator";
import { runUnifiedPromptAnalysis } from "@/lib/prompt-analysis";
import {
  buildPromptAnalysisRow,
  buildPromptQualityFields,
  resolveSavePersistence,
  saveDebugSnapshot,
  type SaveIntent,
} from "@/lib/prompt-save-state";

const BodySchema = z.object({
  content: z.string().min(1).max(20_000),
  saveIntent: z.enum(["draft", "publish"]).optional().default("publish"),
});

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const json = await req.json().catch(() => null);
    const parsed = BodySchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", issues: parsed.error.issues },
        { status: 400 },
      );
    }

    const normalized = normalizeOnly(parsed.data.content);
    const publishValidation = canBypassPromptValidation(user)
      ? { ok: true as const, normalized }
      : validatePromptForPublish(parsed.data.content);

    const saveIntent = parsed.data.saveIntent as SaveIntent;

    const { hybrid, quality } = await runUnifiedPromptAnalysis(normalized);
    console.log("[prompts/create] unified snapshot:", {
      saveIntent,
      pipelineStatus: hybrid.status,
      decisionScore: hybrid.score,
      publishValidationOk: publishValidation.ok,
    });

    const persistence = resolveSavePersistence({
      hybrid,
      publishValidation,
      saveIntent,
    });

    const moderationStatus = persistence.moderationStatus;
    const nextStatus = persistence.nextStatus;
    const flagged = persistence.flagged;

    const recentDuplicate = await prisma.prompt.findFirst({
      where: {
        userId: user.id,
        content: normalized,
        createdAt: { gt: new Date(Date.now() - 5 * 60 * 1000) },
      },
      orderBy: { createdAt: "desc" },
      include: { analysis: true, stats: true },
    });
    if (recentDuplicate) {
      return NextResponse.json({
        ok: true,
        prompt: recentDuplicate,
        analysis: hybrid,
        success: true,
        moderationStatus: recentDuplicate.moderationStatus,
        status: recentDuplicate.status,
        message: "Already saved.",
      });
    }

    const analysisRow = buildPromptAnalysisRow(hybrid, quality);
    const qualityFields = buildPromptQualityFields(normalized, quality);

    const created = await prisma.prompt.create({
      data: {
        userId: user.id,
        content: normalized,
        status: nextStatus,
        moderationStatus,
        flagged,
        reason: persistence.reason,
        score: qualityFields.score,
        qualityDimensions: qualityFields.qualityDimensions
          ? (qualityFields.qualityDimensions as Prisma.InputJsonValue)
          : Prisma.DbNull,
        promptTypeLabel: qualityFields.promptTypeLabel,
        maturityLevel: qualityFields.maturityLevel,
        detectedIntent: qualityFields.detectedIntent,
        techStack: qualityFields.techStack,
        searchDomain: qualityFields.searchDomain,
        searchRole: qualityFields.searchRole,
        searchKeywords: qualityFields.searchKeywords,
        flags: persistence.flags,
        aiDetails: hybrid.aiDetails ? (hybrid.aiDetails as Prisma.InputJsonValue) : Prisma.DbNull,
        moderationScore: hybrid.score,
        moderationRaw: hybrid.aiDetails ? (hybrid.aiDetails as Prisma.InputJsonValue) : Prisma.DbNull,
        stats: { create: {} },
        analysis: { create: analysisRow },
      },
      include: { analysis: true, stats: true },
    });

    const publishGateFailed = !publishValidation.ok && saveIntent === "publish";
    const debug =
      process.env.ANALYZER_DEBUG === "1" || process.env.ANALYZER_PIPELINE_DEBUG === "1"
        ? saveDebugSnapshot({
            hybrid,
            persistence,
            publishGateFailed,
          })
        : undefined;

    return NextResponse.json({
      ok: true,
      prompt: created,
      analysis: hybrid,
      success: true,
      moderationStatus,
      status: nextStatus,
      outcome: persistence.outcome,
      message: persistence.userMessage,
      ...(debug ? { debug } : {}),
    });
  } catch (e) {
    const mapped = prismaKnownRequestResponse(e);
    if (mapped) {
      return NextResponse.json(mapped.body, { status: mapped.status });
    }
    console.error("[prompts/create] failed", e);
    return NextResponse.json({ error: "Failed to create prompt" }, { status: 500 });
  }
}
