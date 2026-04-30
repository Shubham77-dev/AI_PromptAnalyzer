import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { isAdmin } from "@/lib/rbac";

const MIN_ADMIN_PUBLISH_SCORE = 50;

function effectiveScore(prompt: { score: number | null; analysis: { accuracy: number } | null }) {
  if (typeof prompt.score === "number" && Number.isFinite(prompt.score)) return prompt.score;
  const acc = prompt.analysis?.accuracy;
  return typeof acc === "number" && Number.isFinite(acc) ? acc : null;
}

export async function PATCH(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
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
    select: {
      id: true,
      status: true,
      moderationStatus: true,
      score: true,
      analysis: { select: { accuracy: true } },
    },
  });

  if (!prompt) {
    return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
  }

  if (prompt.status === "PUBLISHED") {
    return NextResponse.json({ success: true, message: "Already published" });
  }

  const score = effectiveScore(prompt);
  if (!(typeof score === "number" && score >= MIN_ADMIN_PUBLISH_SCORE)) {
    return NextResponse.json(
      { success: false, error: `Publish requires score ≥ ${MIN_ADMIN_PUBLISH_SCORE}` },
      { status: 400 },
    );
  }

  const updated = await prisma.prompt.update({
    where: { id: prompt.id },
    data: {
      status: "PUBLISHED",
      moderationStatus: "APPROVED",
      flagged: false,
      reason: prompt.moderationStatus === "PENDING" ? "Approved by admin." : "Published by admin.",
    },
  });

  return NextResponse.json({ success: true, prompt: updated });
}

