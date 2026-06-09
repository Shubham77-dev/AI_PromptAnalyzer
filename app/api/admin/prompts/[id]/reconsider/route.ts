import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { isAdmin } from "@/lib/rbac";

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
    select: { id: true, moderationStatus: true },
  });
  if (!prompt) {
    return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
  }

  const updated = await prisma.prompt.update({
    where: { id: prompt.id },
    data: {
      status: "UNDER_REVIEW",
      moderationStatus: "PENDING",
      flagged: true,
      rejectReason: null,
      reviewedAt: null,
      reviewedById: null,
      reason: "Returned to review queue by admin.",
    },
  });

  return NextResponse.json({ success: true, prompt: updated });
}
