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

  const updated = await prisma.prompt.update({
    where: { id: prompt.id },
    data: { status: "PUBLISHED" },
  });

  return NextResponse.json({ ok: true, prompt: updated });
}

