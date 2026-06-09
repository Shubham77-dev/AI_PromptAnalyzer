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

export async function adminApprovePrompt(formData: FormData) {
  const admin = await requireAdmin();
  const parsed = z.object({ promptId: z.string().uuid() }).safeParse(Object.fromEntries(formData));
  if (!parsed.success) throw new Error("Invalid input");

  const prompt = await prisma.prompt.findUnique({
    where: { id: parsed.data.promptId },
    select: { id: true, moderationStatus: true },
  });
  if (!prompt) throw new Error("Not found");
  if (prompt.moderationStatus === "APPROVED") return;
  forbidIfNot(prompt.moderationStatus === "PENDING", "Prompt is not pending review");

  await prisma.prompt.update({
    where: { id: prompt.id },
    data: {
      status: "PUBLISHED",
      moderationStatus: "APPROVED",
      flagged: false,
      reason: "Approved by admin.",
      rejectReason: null,
      reviewedAt: new Date(),
      reviewedById: admin.id,
    },
  });

  revalidatePath("/admin/review");
  revalidatePath("/admin/prompts");
  revalidatePath("/dashboard");
  revalidatePath("/library");
}

export async function adminRejectPrompt(formData: FormData) {
  const admin = await requireAdmin();
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
  if (prompt.moderationStatus === "REJECTED") return;

  const rejectReason = parsed.data.reason?.trim() || "Rejected by admin.";

  await prisma.prompt.update({
    where: { id: prompt.id },
    data: {
      status: "DRAFT",
      moderationStatus: "REJECTED",
      flagged: true,
      reason: rejectReason,
      rejectReason,
      reviewedAt: new Date(),
      reviewedById: admin.id,
    },
  });

  revalidatePath("/admin/review");
  revalidatePath("/admin/prompts");
  revalidatePath("/dashboard");
  revalidatePath("/library");
}
