import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

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
    where: { id: parsed.data.promptId, status: "PUBLISHED" },
    select: { id: true },
  });

  if (!prompt) return NextResponse.json({ error: "Not found" }, { status: 404 });

  try {
    const result = await prisma.$transaction(async (tx) => {
      const existing = await tx.like.findUnique({
        where: { userId_promptId: { userId: user.id, promptId: prompt.id } },
        select: { id: true },
      });

      if (existing) {
        const stats = await tx.promptStats.findUnique({
          where: { promptId: prompt.id },
          select: { likes: true },
        });
        return { liked: false, likes: stats?.likes ?? 0 };
      }

      await tx.like.create({
        data: { userId: user.id, promptId: prompt.id },
      });

      const stats = await tx.promptStats.upsert({
        where: { promptId: prompt.id },
        create: { promptId: prompt.id, likes: 1, usage: 0 },
        update: { likes: { increment: 1 } },
        select: { likes: true },
      });

      return { liked: true, likes: stats.likes };
    });

    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    // If two requests race, unique constraint might trigger.
    if (
      typeof e === "object" &&
      e !== null &&
      "code" in e &&
      (e as { code?: unknown }).code === "P2002"
    ) {
      const stats = await prisma.promptStats.findUnique({
        where: { promptId: prompt.id },
        select: { likes: true },
      });
      return NextResponse.json({ ok: true, liked: false, likes: stats?.likes ?? 0 });
    }
    throw e;
  }
}

