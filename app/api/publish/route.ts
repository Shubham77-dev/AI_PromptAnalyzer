import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { isAdmin } from "@/lib/rbac";

const BodySchema = z.object({
  promptId: z.uuid(),
});

const MIN_ADMIN_PUBLISH_SCORE = 50;

function effectiveScore(prompt: { score: number | null; analysis: { accuracy: number } | null }) {
  if (typeof prompt.score === "number" && Number.isFinite(prompt.score)) return prompt.score;
  const acc = prompt.analysis?.accuracy;
  return typeof acc === "number" && Number.isFinite(acc) ? acc : null;
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      {
        success: false,
        error: "Unauthorized",
        message: "Please log in to publish prompts",
      },
      { status: 401 },
    );
  }

  // Deprecated endpoint: publishing is admin-only.
  if (!isAdmin(user)) {
    return NextResponse.json(
      {
        success: false,
        error: "Forbidden",
        message: "Only admins can publish prompts",
      },
      { status: 403 },
    );
  }

  const json = await req.json().catch(() => null);
  const parsed = BodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      {
        success: false,
        error: "Invalid input",
        message: "Invalid request data",
      },
      { status: 400 },
    );
  }

  const prompt = await prisma.prompt.findUnique({
    where: { id: parsed.data.promptId },
    include: { analysis: true },
  });

  if (!prompt) {
    return NextResponse.json(
      {
        success: false,
        error: "Not found",
        message: "Prompt not found",
      },
      { status: 404 },
    );
  }

  if (prompt.moderationStatus !== "PENDING") {
    return NextResponse.json(
      {
        success: false,
        error: "Invalid state",
        message: "Prompt is not pending review",
      },
      { status: 409 },
    );
  }

  const score = effectiveScore(prompt);
  if (!(typeof score === "number" && score >= MIN_ADMIN_PUBLISH_SCORE)) {
    return NextResponse.json(
      {
        success: false,
        error: "Score too low",
        message: `Publish requires score ≥ ${MIN_ADMIN_PUBLISH_SCORE}`,
      },
      { status: 400 },
    );
  }

  const updated = await prisma.prompt.update({
    where: { id: prompt.id },
    data: {
      status: "PUBLISHED",
      moderationStatus: "APPROVED",
      flagged: false,
      reason: "Approved by admin.",
    },
  });

  return NextResponse.json({
    success: true,
    ok: true,
    prompt: updated,
    status: "PUBLISHED",
    message: "Prompt published successfully",
  });
}

