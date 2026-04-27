import { NextResponse } from "next/server";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { createSession } from "@/lib/auth";

const BodySchema = z.object({
  email: z.email().max(320),
  // This starter uses email-only auth (no password stored). Allow password to be omitted,
  // but if provided, enforce it being a non-empty string.
  password: z.string().min(1).max(256).optional(),
});

function prismaishMessage(e: unknown) {
  if (e instanceof Prisma.PrismaClientInitializationError) {
    return `Prisma init error: ${e.message}`;
  }
  if (e instanceof Prisma.PrismaClientKnownRequestError) {
    return `Prisma error ${e.code}: ${e.message}`;
  }
  if (e instanceof Error) return e.message;
  return "Unknown error";
}

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

    const email = parsed.data.email.toLowerCase();
    const password = parsed.data.password;
    if (process.env.NODE_ENV !== "production" && password == null) {
      console.warn("[auth/login] password missing; proceeding (email-only auth)");
    }

    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true },
    });

    const ensuredUser =
      user ??
      (await prisma.user.create({
        data: { email },
        select: { id: true, email: true },
      }));

    await createSession(ensuredUser);
    return NextResponse.json({ ok: true, user: ensuredUser });
  } catch (e) {
    console.error("[auth/login] failed");
    console.error(e);

    const msg = prismaishMessage(e);
    const isDbInit =
      e instanceof Prisma.PrismaClientInitializationError ||
      (typeof msg === "string" &&
        /database|reachable|connect|ECONN|ENOTFOUND|timeout/i.test(msg));

    return NextResponse.json(
      {
        error: isDbInit ? "Database not reachable" : "Login failed",
        message: msg,
        hint: isDbInit
          ? "Verify DATABASE_URL (postgresql://, port 6543, ?pgbouncer=true, url-encoded password) and restart `npm run dev` after editing .env."
          : undefined,
      },
      { status: isDbInit ? 503 : 500 },
    );
  }
}

