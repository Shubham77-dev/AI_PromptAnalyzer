import { NextResponse } from "next/server";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { prismaKnownRequestResponse } from "@/lib/prisma-errors";
import { getCurrentUser, getCurrentUserOrBearer } from "@/lib/auth";
import { canBypassPromptValidation, canManagePrompt } from "@/lib/rbac";
import { normalizeOnly, validatePromptForPublish } from "@/lib/prompt-validator";
import { runUnifiedPromptAnalysis } from "@/lib/prompt-analysis";
import {
  buildPromptAnalysisRow,
  resolveSavePersistence,
  saveDebugSnapshot,
  type SaveIntent,
} from "@/lib/prompt-save-state";

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
  /** `publish` mirrors legacy behavior; `draft` always stores a private draft. */
  saveIntent: z.enum(["draft", "publish"]).optional().default("publish"),
  /** Ignored for scoring — server always recomputes with the hybrid pipeline. */
  analysis: z.union([AnalysisSchema, HybridAnalysisSchema]).optional(),
});

export async function POST(req: Request) {
  try {
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

    const normalized = normalizeOnly(parsed.data.content);
    const publishValidation = canBypassPromptValidation(user)
      ? { ok: true as const, normalized }
      : validatePromptForPublish(parsed.data.content);

    const saveIntent = parsed.data.saveIntent as SaveIntent;

    const { hybrid, heuristics } = await runUnifiedPromptAnalysis(normalized);
    console.log("[analyzer-pipeline] unified save snapshot:", {
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

    // Best-effort de-dupe: avoid duplicate submissions on reload/double-click.
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
        success: true,
        moderationStatus: recentDuplicate.moderationStatus,
        status: recentDuplicate.status,
        message: "Already saved.",
      });
    }

    const analysisRow = buildPromptAnalysisRow(hybrid, heuristics);

    const created = await prisma.prompt.create({
      data: {
        userId: user.id,
        content: normalized,
        status: nextStatus,
        moderationStatus,
        flagged,
        reason: persistence.reason,
        score: hybrid.score,
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
    console.error("[api/prompt POST] failed", e);
    return NextResponse.json({ error: "Failed to create prompt" }, { status: 500 });
  }
}

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const prompts = await prisma.prompt.findMany({
    where: user.role === "ADMIN" ? {} : { userId: user.id },
    orderBy: { createdAt: "desc" },
    include: { analysis: true, stats: true },
  });

  return NextResponse.json({ ok: true, prompts });
}

const DeleteSchema = z.object({
  promptId: z.uuid(),
});

export async function DELETE(req: Request) {
  try {
    const authUser = await getCurrentUserOrBearer(req);

    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const json = await req.json().catch(() => null);
    const parsed = DeleteSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", issues: parsed.error.issues },
        { status: 400 },
      );
    }

    const prompt = await prisma.prompt.findUnique({
      where: { id: parsed.data.promptId },
      select: { id: true, userId: true },
    });

    if (!prompt) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (!canManagePrompt(authUser, prompt.userId)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.prompt.delete({ where: { id: prompt.id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[prompt/delete] failed");
    console.error(e);
    return NextResponse.json(
      { error: "Delete failed" },
      { status: 500 },
    );
  }
}

