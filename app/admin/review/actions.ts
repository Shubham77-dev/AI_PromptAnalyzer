"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { forbidIfNot, isAdmin } from "@/lib/rbac";

async function requireAdmin() {
  const user = await getCurrentUser();
  forbidIfNot(Boolean(user && isAdmin(user)), "Forbidden");
  return user!;
}

const MIN_ADMIN_PUBLISH_SCORE = 50;

function effectiveScore(prompt: { score: number | null; analysis: { accuracy: number } | null }) {
  if (typeof prompt.score === "number" && Number.isFinite(prompt.score)) return prompt.score;
  const acc = prompt.analysis?.accuracy;
  return typeof acc === "number" && Number.isFinite(acc) ? acc : null;
}

export async function adminApprovePrompt(formData: FormData) {
  await requireAdmin();
  const parsed = z.object({ promptId: z.string().uuid() }).safeParse(Object.fromEntries(formData));
  if (!parsed.success) throw new Error("Invalid input");

  const prompt = await prisma.prompt.findUnique({
    where: { id: parsed.data.promptId },
    select: { id: true, moderationStatus: true, score: true, analysis: { select: { accuracy: true } } },
  });
  if (!prompt) throw new Error("Not found");

  // Idempotent: already approved.
  if (prompt.moderationStatus === "APPROVED") return;

  forbidIfNot(prompt.moderationStatus === "PENDING", "Prompt is not pending review");

  const score = effectiveScore(prompt);
  forbidIfNot(
    typeof score === "number" && score >= MIN_ADMIN_PUBLISH_SCORE,
    `Publish requires score ≥ ${MIN_ADMIN_PUBLISH_SCORE}`,
  );

  await prisma.prompt.update({
    where: { id: prompt.id },
    data: {
      status: "PUBLISHED",
      moderationStatus: "APPROVED",
      flagged: false,
      reason: "Approved by admin.",
    },
  });

  revalidatePath("/admin/review");
  revalidatePath("/admin/prompts");
  revalidatePath("/dashboard");
  revalidatePath("/library");
}

export async function adminRejectPrompt(formData: FormData) {
  await requireAdmin();
  const parsed = z
    .object({
      promptId: z.string().uuid(),
      reason: z.string().max(2000).optional(),
    })
    .safeParse(Object.fromEntries(formData));
  if (!parsed.success) throw new Error("Invalid input");

  const prompt = await prisma.prompt.findUnique({
    where: { id: parsed.data.promptId },
    select: { id: true, moderationStatus: true },
  });
  if (!prompt) throw new Error("Not found");

  // Idempotent: already rejected.
  if (prompt.moderationStatus === "REJECTED") return;

  await prisma.prompt.update({
    where: { id: prompt.id },
    data: {
      status: "DRAFT",
      moderationStatus: "REJECTED",
      flagged: true,
      reason: parsed.data.reason?.trim() ? parsed.data.reason.trim() : "Rejected by admin.",
    },
  });

  revalidatePath("/admin/review");
  revalidatePath("/admin/prompts");
  revalidatePath("/dashboard");
  revalidatePath("/library");
}

