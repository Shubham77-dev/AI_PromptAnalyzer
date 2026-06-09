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

export async function adminSuspendUser(formData: FormData) {
  await requireAdmin();
  const parsed = z.object({ userId: z.string().min(1) }).safeParse(Object.fromEntries(formData));
  if (!parsed.success) throw new Error("Invalid input");

  await prisma.user.update({
    where: { id: parsed.data.userId },
    data: { status: "SUSPENDED" },
  });
  revalidatePath("/admin/users");
}

export async function adminSetUserRole(formData: FormData) {
  await requireAdmin();
  const parsed = z
    .object({
      userId: z.string().min(1),
      role: z.enum(["USER", "ADMIN"]),
    })
    .safeParse(Object.fromEntries(formData));
  if (!parsed.success) throw new Error("Invalid input");

  await prisma.user.update({
    where: { id: parsed.data.userId },
    data: { role: parsed.data.role },
  });
  revalidatePath("/admin/users");
}

export async function adminUnpublishPrompt(formData: FormData) {
  await requireAdmin();
  const parsed = z.object({ promptId: z.string().min(1) }).safeParse(Object.fromEntries(formData));
  if (!parsed.success) throw new Error("Invalid input");

  await prisma.prompt.update({
    where: { id: parsed.data.promptId },
    data: { status: "DRAFT" },
  });
  revalidatePath("/admin/prompts");
  revalidatePath("/admin/flagged");
  revalidatePath("/admin/flags");
  revalidatePath("/library");
}

export async function adminRemovePrompt(formData: FormData) {
  await requireAdmin();
  const parsed = z.object({ promptId: z.string().min(1) }).safeParse(Object.fromEntries(formData));
  if (!parsed.success) throw new Error("Invalid input");

  await prisma.prompt.delete({ where: { id: parsed.data.promptId } });
  revalidatePath("/admin/prompts");
  revalidatePath("/admin/flagged");
  revalidatePath("/admin/flags");
  revalidatePath("/library");
}

export async function adminIgnoreFlag(formData: FormData) {
  await requireAdmin();
  const parsed = z.object({ promptId: z.string().min(1) }).safeParse(Object.fromEntries(formData));
  if (!parsed.success) throw new Error("Invalid input");

  await prisma.prompt.update({
    where: { id: parsed.data.promptId },
    data: { flagged: false, reason: null },
  });
  revalidatePath("/admin/flagged");
  revalidatePath("/admin/flags");
}

export async function adminUpsertAppConfig(formData: FormData) {
  await requireAdmin();

  const parsed = z
    .object({
      min_publish_score: z.coerce.number().int().min(0).max(100),
      free_tier_daily_limit: z.coerce.number().int().min(0).max(10_000),
      require_email_verification: z.string().optional(),
      allow_public_registration: z.string().optional(),
      maintenance_mode: z.string().optional(),
    })
    .safeParse(Object.fromEntries(formData));
  if (!parsed.success) throw new Error("Invalid input");

  const row = {
    id: 1,
    minPublishScore: parsed.data.min_publish_score,
    freeTierDailyLimit: parsed.data.free_tier_daily_limit,
    requireEmailVerification: parsed.data.require_email_verification === "on",
    allowPublicRegistration: parsed.data.allow_public_registration === "on",
    maintenanceMode: parsed.data.maintenance_mode === "on",
  };

  await prisma.appConfig.upsert({
    where: { id: 1 },
    create: row,
    update: row,
  });

  revalidatePath("/admin/settings");
}

