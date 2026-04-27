import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { createSession } from "@/lib/auth";

const BodySchema = z.object({
  email: z.email().max(320),
  // This starter uses email-only auth (no password stored). Allow password to be omitted,
  // but if provided, enforce it being a non-empty string.
  password: z.string().min(1).max(256).optional(),
});

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

function prismaishMessage(e: unknown) {
  if (e instanceof Error) return e.message;
  if (!isObject(e)) return "Unknown error";

  // Avoid importing Prisma error classes (can differ across build/runtime tooling).
  const name = typeof e.name === "string" ? e.name : "";
  const code = typeof e.code === "string" ? e.code : "";
  const message = typeof e.message === "string" ? e.message : "Unknown error";

  if (name === "PrismaClientInitializationError") return `Prisma init error: ${message}`;
  if (name === "PrismaClientKnownRequestError") return `Prisma error ${code}: ${message}`;
  return message;
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
      /Prisma init error/i.test(msg) ||
      /database|reachable|connect|ECONN|ENOTFOUND|timeout|TLS|certificate/i.test(msg);

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

