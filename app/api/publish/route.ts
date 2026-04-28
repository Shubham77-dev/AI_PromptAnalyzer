import { NextResponse } from "next/server";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { moderateContent } from "@/lib/moderation";

const BodySchema = z.object({
  promptId: z.uuid(),
});

export async function POST(req: Request) {
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

  const prompt = await prisma.prompt.findFirst({
    where: { id: parsed.data.promptId, userId: user.id },
    include: { analysis: true },
  });

  if (!prompt) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!prompt.analysis) {
    return NextResponse.json(
      { error: "Analyze this prompt before publishing." },
      { status: 400 },
    );
  }

  const decision = await moderateContent(prompt.content);
  console.log("[moderation] publish decision:", {
    promptId: prompt.id,
    status: decision.status,
    flagged: decision.flagged,
    score: decision.score,
    reason: decision.reason,
  });

  if (decision.status === "rejected") {
    await prisma.prompt.update({
      where: { id: prompt.id },
      data: {
        moderationStatus: "REJECTED",
        flagged: decision.flagged,
        reason: decision.reason,
        moderationScore: decision.score ?? null,
        moderationRaw: decision.raw ? (decision.raw as Prisma.InputJsonValue) : Prisma.DbNull,
      },
    });
    return NextResponse.json({ error: decision.reason, flagged: true }, { status: 400 });
  }

  if (decision.status === "pending") {
    await prisma.prompt.update({
      where: { id: prompt.id },
      data: {
        moderationStatus: "PENDING",
        flagged: decision.flagged,
        reason: decision.reason,
        moderationScore: decision.score ?? null,
        moderationRaw: decision.raw ? (decision.raw as Prisma.InputJsonValue) : Prisma.DbNull,
      },
    });
    return NextResponse.json(
      { error: "Pending admin review", moderation: decision },
      { status: 202 },
    );
  }

  const updated = await prisma.prompt.update({
    where: { id: prompt.id },
    data: {
      status: "PUBLISHED",
      moderationStatus: "APPROVED",
      flagged: decision.flagged,
      reason: decision.reason,
      moderationScore: decision.score ?? null,
      moderationRaw: decision.raw ? (decision.raw as Prisma.InputJsonValue) : Prisma.DbNull,
    },
  });

  return NextResponse.json({ ok: true, prompt: updated, moderation: decision });
}

