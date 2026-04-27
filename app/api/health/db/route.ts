import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({ ok: true });
  } catch (e) {
    const message =
      e instanceof Error ? e.message : "Unknown database error";
    return NextResponse.json(
      {
        ok: false,
        error: "Database connection failed",
        message,
        hint:
          "Check DATABASE_URL (pooled) and DIRECT_URL (migrations) in .env. For Supabase, pooled uses port 6543 + ?pgbouncer=true; direct uses db.<ref>.supabase.co:5432.",
      },
      { status: 500 },
    );
  }
}

