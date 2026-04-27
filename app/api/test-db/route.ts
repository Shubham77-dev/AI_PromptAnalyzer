import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

function toErrorMessage(e: unknown) {
  if (e instanceof Error) return e.message;
  if (!isObject(e)) return "Unknown error";

  const name = typeof e.name === "string" ? e.name : "";
  const code = typeof e.code === "string" ? e.code : "";
  const message = typeof e.message === "string" ? e.message : "Unknown error";

  if (name === "PrismaClientInitializationError") return `Prisma init error: ${message}`;
  if (name === "PrismaClientKnownRequestError") return `Prisma error ${code}: ${message}`;
  return message;
}

export async function GET() {
  try {
    console.log("[test-db] starting db check");
    console.log("[test-db] DATABASE_URL present:", Boolean(process.env.DATABASE_URL));

    await prisma.$connect();
    const users = await prisma.user.findMany({
      take: 3,
      orderBy: { createdAt: "desc" },
      select: { id: true, email: true, createdAt: true },
    });

    return NextResponse.json({ ok: true, users });
  } catch (e) {
    console.error("[test-db] db check failed");
    console.error(e);

    return NextResponse.json(
      {
        ok: false,
        error: "Database not reachable",
        message: toErrorMessage(e),
        hint: "Confirm DATABASE_URL uses postgresql://, port 6543, includes ?pgbouncer=true, and restart `npm run dev` after editing .env.",
      },
      { status: 500 },
    );
  }
}

