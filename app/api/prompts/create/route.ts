import { NextResponse } from "next/server";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { prismaKnownRequestResponse } from "@/lib/prisma-errors";
import { getCurrentUser } from "@/lib/auth";
import { analyzePrompt } from "@/lib/analyzer";
import { canBypassPromptValidation } from "@/lib/rbac";
import { normalizeOnly, validatePromptForPublish } from "@/lib/prompt-validator";

const BodySchema = z.object({
  content: z.string().min(1).max(20_000),
});

function buildReason(analysis: Awaited<ReturnType<typeof analyzePrompt>>): string {
  const ad = analysis.aiDetails;
  if (ad && typeof ad === "object" && "scores" in ad) {
    const scores = (ad as { scores?: { reason?: string } }).scores;
    if (scores?.reason?.trim()) return scores.reason.trim();
  }
  if (ad && typeof ad === "object" && "skippedAi" in ad && ad.skippedAi) {
    return "Rejected by automated rule validation.";
  }
  if (ad && typeof ad === "object" && "aiError" in ad) {
    return "AI analysis unavailable; prompt saved for manual review.";
  }
  if (analysis.status === "approved") return "Passed hybrid prompt analyzer.";
  if (analysis.status === "pending") return "Queued for review based on analyzer score.";
  return "Did not meet publication threshold.";
}

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

    // Do not block saving on strict publish-validation; invalid content goes to review.
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
        console.error("[prompts/create] analyzer failed; saving as pending", e);
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

    console.log("[analyzer-pipeline] decision:", {
      status: analysis.status,
      score: analysis.score,
      flags: analysis.flags,
    });

    let moderationStatus: "APPROVED" | "PENDING" | "REJECTED";
    if (analysis.status === "approved") moderationStatus = "APPROVED";
    else if (analysis.status === "pending") moderationStatus = "PENDING";
    else moderationStatus = "REJECTED";

    const reason = buildReason(analysis);
    const flagged = moderationStatus !== "APPROVED";

    const nextStatus =
      moderationStatus === "APPROVED"
        ? ("PUBLISHED" as const)
        : moderationStatus === "PENDING"
          ? ("UNDER_REVIEW" as const)
          : ("DRAFT" as const);

    // Best-effort de-dupe: avoid duplicate submissions on reload/double-click.
    const recentDuplicate = await prisma.prompt.findFirst({
      where: {
        userId: user.id,
        content: normalized,
        createdAt: { gt: new Date(Date.now() - 5 * 60 * 1000) },
      },
      orderBy: { createdAt: "desc" },
      include: { stats: true },
    });
    if (recentDuplicate) {
      return NextResponse.json({
        ok: true,
        prompt: recentDuplicate,
        analysis,
        success: true,
        moderationStatus: recentDuplicate.moderationStatus,
        status: recentDuplicate.status,
        message: "Already saved.",
      });
    }

    const data: Prisma.PromptUncheckedCreateInput = {
      userId: user.id,
      content: normalized,
      status: nextStatus,
      moderationStatus,
      flagged,
      reason,
      score: analysis.score,
      flags: analysis.flags,
      aiDetails: analysis.aiDetails ? (analysis.aiDetails as Prisma.InputJsonValue) : Prisma.DbNull,
      moderationScore: analysis.score,
      moderationRaw: analysis.aiDetails ? (analysis.aiDetails as Prisma.InputJsonValue) : Prisma.DbNull,
    };

    const created = await prisma.prompt.create({
      data: { ...data, stats: { create: {} } },
      include: { stats: true },
    });

    return NextResponse.json({
      // Legacy
      ok: true,
      prompt: created,
      analysis,
      // New structured response format
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
    console.error("[prompts/create] failed", e);
    return NextResponse.json({ error: "Failed to create prompt" }, { status: 500 });
  }
}
