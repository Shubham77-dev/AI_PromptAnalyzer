import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { prismaKnownRequestResponse } from "@/lib/prisma-errors";
import { sendPasswordResetEmail } from "@/lib/email/send-password-reset";
import { generatePasswordResetRawToken, hashPasswordResetToken } from "@/lib/password-reset-token";
import { getRequestIp } from "@/lib/request-ip";
import { rateLimitAllow } from "@/lib/rate-limit-memory";

const BodySchema = z.object({
  email: z.email().max(320),
});

const SUCCESS = {
  ok: true,
  message: "If an account exists for that email, you will receive reset instructions shortly.",
};

export async function POST(req: Request) {
  try {
    const ip = getRequestIp(req);
    if (!rateLimitAllow(`forgot-password:${ip}`, 5, 15 * 60 * 1000)) {
      return NextResponse.json(SUCCESS, { status: 200 });
    }

    const json = await req.json().catch(() => null);
    const parsed = BodySchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", issues: parsed.error.issues },
        { status: 400 },
      );
    }

    const email = parsed.data.email.toLowerCase();

    if (!rateLimitAllow(`forgot-password:${ip}:${email}`, 3, 60 * 60 * 1000)) {
      return NextResponse.json(SUCCESS, { status: 200 });
    }

    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true, status: true },
    });

    if (!user || user.status !== "ACTIVE") {
      return NextResponse.json(SUCCESS, { status: 200 });
    }

    const raw = generatePasswordResetRawToken();
    const tokenHash = hashPasswordResetToken(raw);
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    await prisma.passwordResetToken.deleteMany({ where: { userId: user.id } });

    const row = await prisma.passwordResetToken.create({
      data: {
        token: tokenHash,
        userId: user.id,
        expiresAt,
      },
      select: { id: true },
    });

    const sent = await sendPasswordResetEmail(req, user.email, raw);
    if (!sent) {
      await prisma.passwordResetToken.delete({ where: { id: row.id } }).catch(() => null);
    }

    return NextResponse.json(SUCCESS, { status: 200 });
  } catch (e) {
    const mapped = prismaKnownRequestResponse(e);
    if (mapped) {
      return NextResponse.json(mapped.body, { status: mapped.status });
    }
    console.error("[auth/forgot-password]", e);
    return NextResponse.json(SUCCESS, { status: 200 });
  }
}
