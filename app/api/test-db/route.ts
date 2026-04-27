import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

function toErrorMessage(e: unknown) {
  if (e instanceof Prisma.PrismaClientInitializationError) {
    return `Prisma init error: ${e.message}`;
  }
  if (e instanceof Prisma.PrismaClientKnownRequestError) {
    return `Prisma error ${e.code}: ${e.message}`;
  }
  if (e instanceof Error) return e.message;
  return "Unknown error";
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

