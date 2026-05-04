import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getRequestIp } from "@/lib/request-ip";
import { rateLimitAllow } from "@/lib/rate-limit-memory";

const BodySchema = z.object({
  email: z.email().max(320),
});

/**
 * After a failed credentials sign-in, the client may call this to show a clearer message
 * when the account exists but has no password (OAuth-only). Slight enumeration trade-off.
 */
export async function POST(req: Request) {
  const ip = getRequestIp(req);
  if (!rateLimitAllow(`login-hint:${ip}`, 30, 15 * 60 * 1000)) {
    return NextResponse.json({ hint: "generic" as const }, { status: 200 });
  }

  const json = await req.json().catch(() => null);
  const parsed = BodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ hint: "generic" as const }, { status: 200 });
  }

  const email = parsed.data.email.toLowerCase();
  const user = await prisma.user.findUnique({
    where: { email },
    select: { password: true, status: true },
  });

  if (user && user.status === "ACTIVE" && user.password == null) {
    return NextResponse.json({ hint: "oauth_or_reset" as const }, { status: 200 });
  }

  return NextResponse.json({ hint: "generic" as const }, { status: 200 });
}
