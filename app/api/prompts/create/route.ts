import { NextResponse } from "next/server";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { moderateContent } from "@/lib/moderation";

const BodySchema = z.object({
  content: z.string().min(1).max(20_000),
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

  const decision = await moderateContent(parsed.data.content);
  console.log("[moderation] decision:", {
    status: decision.status,
    flagged: decision.flagged,
    score: decision.score,
    reason: decision.reason,
  });

  if (decision.status === "rejected") {
    return NextResponse.json({ error: decision.reason, flagged: true }, { status: 400 });
  }

  let moderationStatus: "APPROVED" | "PENDING" | "REJECTED";
  if (decision.status === "approved") moderationStatus = "APPROVED";
  else if (decision.status === "pending") moderationStatus = "PENDING";
  else moderationStatus = "REJECTED";

  const created = await prisma.prompt.create({
    data: {
      userId: user.id,
      content: parsed.data.content,
      status: decision.status === "approved" ? "PUBLISHED" : "DRAFT",
      moderationStatus,
      flagged: decision.flagged,
      reason: decision.reason,
      moderationScore: decision.score ?? null,
      moderationRaw: decision.raw
        ? (decision.raw as Prisma.InputJsonValue)
        : Prisma.DbNull,
      stats: { create: {} },
    },
    include: { stats: true },
  });

  if (decision.status === "pending") {
    return NextResponse.json(
      { ok: true, prompt: created, moderation: decision },
      { status: 202 },
    );
  }

  return NextResponse.json({ ok: true, prompt: created, moderation: decision });
}

