import { NextResponse } from "next/server";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { prismaKnownRequestResponse } from "@/lib/prisma-errors";
import { getCurrentUser, getCurrentUserOrBearer } from "@/lib/auth";
import { canBypassPromptValidation, canManagePrompt } from "@/lib/rbac";
import { normalizeOnly, validatePromptForPublish } from "@/lib/prompt-validator";
import { analyzePrompt } from "@/lib/analyzer";

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

    // Saving is allowed even if publish-validation fails; those prompts go to manual review.
    const normalized = normalizeOnly(parsed.data.content);
    const publishValidation = canBypassPromptValidation(user)
      ? { ok: true as const }
      : validatePromptForPublish(parsed.data.content);

    const analysis = await (async () => {
      if (!publishValidation.ok) {
        return {
          status: "pending" as const,
          score: 0,
          flags: ["prompt_validation_failed"],
          aiDetails: {
            skippedAi: true,
            reason: "prompt_validation_failed",
            issues: publishValidation.issues,
          },
        };
      }

      try {
        return await analyzePrompt(normalized);
      } catch (e) {
        console.error("[api/prompt] analyzer failed; saving as pending", e);
        return {
          status: "pending" as const,
          score: 0,
          flags: ["analyzer_error"],
          aiDetails: {
            aiError: e instanceof Error ? e.message : "Unknown analyzer error",
            pendingReview: true,
          },
        };
      }
    })();

    const moderationStatus =
      analysis.status === "approved"
        ? ("APPROVED" as const)
        : analysis.status === "pending"
          ? ("PENDING" as const)
          : ("REJECTED" as const);

    const nextStatus =
      moderationStatus === "APPROVED"
        ? ("PUBLISHED" as const)
        : moderationStatus === "PENDING"
          ? ("UNDER_REVIEW" as const)
          : ("DRAFT" as const);

    const flagged = moderationStatus !== "APPROVED";

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

    const created = await prisma.prompt.create({
      data: {
        userId: user.id,
        content: normalized,
        status: nextStatus,
        moderationStatus,
        flagged,
        reason:
          typeof analysis.aiDetails === "object" &&
          analysis.aiDetails &&
          "scores" in analysis.aiDetails &&
          typeof (analysis.aiDetails as { scores?: { reason?: unknown } }).scores?.reason === "string"
            ? String((analysis.aiDetails as { scores?: { reason?: unknown } }).scores?.reason).slice(0, 2000)
            : moderationStatus === "APPROVED"
              ? "Passed hybrid prompt analyzer."
              : moderationStatus === "PENDING"
                ? "Saved for admin review."
                : "Rejected by automated checks.",
        score: analysis.score,
        flags: analysis.flags,
        aiDetails: analysis.aiDetails ? (analysis.aiDetails as Prisma.InputJsonValue) : Prisma.DbNull,
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

    return NextResponse.json({
      // Legacy
      ok: true,
      prompt: created,
      // New structured format
      success: true,
      moderationStatus,
      status: nextStatus,
      message:
        moderationStatus === "APPROVED"
          ? "Saved and published."
          : moderationStatus === "PENDING"
            ? "Saved and submitted for admin review."
            : "Saved (rejected).",
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

