import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { prismaKnownRequestResponse } from "@/lib/prisma-errors";
import { validatePasswordStrength } from "@/lib/password-policy";
import { hashPasswordResetToken } from "@/lib/password-reset-token";

const BodySchema = z.object({
  token: z.string().min(10).max(512),
  password: z.string().min(8).max(256),
});

export async function POST(req: Request) {
  try {
    const json = await req.json().catch(() => null);
    const parsed = BodySchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", issues: parsed.error.issues },
        { status: 400 },
      );
    }

    const strength = validatePasswordStrength(parsed.data.password);
    if (!strength.ok) {
      return NextResponse.json({ error: strength.error }, { status: 400 });
    }

    const tokenHash = hashPasswordResetToken(parsed.data.token.trim());
    const now = new Date();

    const record = await prisma.passwordResetToken.findUnique({
      where: { token: tokenHash },
      select: { id: true, userId: true, expiresAt: true },
    });

    if (!record || record.expiresAt <= now) {
      return NextResponse.json(
        { error: "This reset link is invalid or has expired. Request a new one." },
        { status: 400 },
      );
    }

    const passwordHash = await bcrypt.hash(parsed.data.password, 12);

    const user = await prisma.$transaction(async (tx) => {
      const u = await tx.user.update({
        where: { id: record.userId },
        data: { password: passwordHash },
        select: { email: true },
      });
      await tx.passwordResetToken.deleteMany({ where: { userId: record.userId } });
      return u;
    });

    return NextResponse.json({ ok: true, email: user.email });
  } catch (e) {
    const mapped = prismaKnownRequestResponse(e);
    if (mapped) {
      return NextResponse.json(mapped.body, { status: mapped.status });
    }
    console.error("[auth/reset-password]", e);
    return NextResponse.json({ error: "Could not reset password." }, { status: 500 });
  }
}
