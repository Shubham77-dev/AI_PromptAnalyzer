import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { checkForDuplicates } from "@/lib/prompt-duplicates";

const BodySchema = z.object({
  content: z.string().min(1).max(20_000),
  excludePromptId: z.string().uuid().optional(),
});

export async function POST(req: Request) {
  try {
    const json = await req.json().catch(() => null);
    const parsed = BodySchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: "Invalid input" }, { status: 400 });
    }

    const published = await prisma.prompt.findMany({
      where: {
        status: "PUBLISHED",
        moderationStatus: "APPROVED",
      },
      select: {
        id: true,
        content: true,
        createdAt: true,
        user: { select: { email: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 500,
    });

    const result = checkForDuplicates(
      parsed.data.content,
      published.map((p) => ({
        id: p.id,
        content: p.content,
        publishedBy: p.user.email,
        publishedAt: p.createdAt,
      })),
      { excludePromptId: parsed.data.excludePromptId },
    );

    return NextResponse.json({ success: true, ...result });
  } catch (e) {
    console.error("[prompts/check-duplicates] failed", e);
    return NextResponse.json({ success: false, error: "Duplicate check failed" }, { status: 500 });
  }
}
