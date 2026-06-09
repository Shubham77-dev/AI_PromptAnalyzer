import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { getRequestIp } from "@/lib/request-ip";
import { rateLimitAllow } from "@/lib/rate-limit-memory";
import { validatePasswordStrength } from "@/lib/password-policy";

const BodySchema = z.object({
  email: z.email().max(320),
  password: z.string().min(1).max(256),
});

const GENERIC_ERROR = "Invalid email or password";

export async function POST(req: Request) {
  const ip = getRequestIp(req);
  if (!rateLimitAllow(`auth-login:${ip}`, 5, 15 * 60 * 1000)) {
    return NextResponse.json({ error: GENERIC_ERROR }, { status: 429 });
  }

  const json = await req.json().catch(() => null);
  const parsed = BodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: GENERIC_ERROR }, { status: 401 });
  }

  const email = parsed.data.email.toLowerCase();
  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      password: true,
      status: true,
    },
  });

  if (!user || user.status !== "ACTIVE" || !user.password) {
    return NextResponse.json({ error: GENERIC_ERROR }, { status: 401 });
  }

  const ok = await bcrypt.compare(parsed.data.password, user.password);
  if (!ok) {
    return NextResponse.json({ error: GENERIC_ERROR }, { status: 401 });
  }

  return NextResponse.json({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role.toLowerCase(),
    },
  });
}
