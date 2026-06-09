import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { isAdmin } from "@/lib/rbac";

const BodySchema = z
  .object({
    reason: z.string().max(2000).optional(),
  })
  .optional();

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user || !isAdmin(user)) {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  const params = await ctx.params;
  const parsedParams = z.object({ id: z.string().uuid() }).safeParse(params);
  if (!parsedParams.success) {
    return NextResponse.json({ success: false, error: "Invalid prompt id" }, { status: 400 });
  }

  const json = await req.json().catch(() => null);
  const parsedBody = BodySchema.safeParse(json);
  if (!parsedBody.success) {
    return NextResponse.json({ success: false, error: "Invalid input" }, { status: 400 });
  }

  const rejectReason = parsedBody.data?.reason?.trim() || "Rejected by admin.";

  const prompt = await prisma.prompt.findUnique({
    where: { id: parsedParams.data.id },
    select: { id: true, moderationStatus: true },
  });

  if (!prompt) {
    return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
  }

  if (prompt.moderationStatus === "REJECTED") {
    return NextResponse.json({ success: true, message: "Already rejected" });
  }

  const updated = await prisma.prompt.update({
    where: { id: prompt.id },
    data: {
      status: "DRAFT",
      moderationStatus: "REJECTED",
      flagged: true,
      reason: rejectReason,
      rejectReason,
      reviewedAt: new Date(),
      reviewedById: user.id,
    },
  });

  return NextResponse.json({ success: true, prompt: updated });
}
