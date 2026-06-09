import { Prisma } from "@prisma/client";

/**
 * Maps Prisma known errors to HTTP-friendly payloads so API routes don’t return opaque 500s
 * when the database schema drifts (e.g. missing columns after migrations weren’t applied).
 */
export function prismaKnownRequestResponse(
  e: unknown,
): { status: number; body: Record<string, unknown> } | null {
  if (!(e instanceof Prisma.PrismaClientKnownRequestError)) return null;

  if (e.code === "P1001" || e.code === "P1017") {
    console.error("[prisma] Database unreachable:", e.code, e.message);
    return {
      status: 503,
      body: {
        error:
          "Cannot reach the database. If you use Supabase: the project may be paused, or your network may block the DB host. Prefer the transaction pooler on port 6543 with ?pgbouncer=true for DATABASE_URL (see Supabase Dashboard → Connect), and keep DIRECT_URL on port 5432 for migrations.",
        code: e.code,
      },
    };
  }

  if (e.code === "P2022") {
    console.error("[prisma] P2022 column/table mismatch — apply pending migrations:", {
      meta: e.meta,
      message: e.message,
    });
    return {
      status: 503,
      body: {
        error: "Database schema is out of sync with this deployment.",
        code: e.code,
        hint:
          "Run `npx prisma migrate deploy` (hosted/production) or `npx prisma migrate dev` (local). " +
          "Use DATABASE_URL (pooler, port 6543) at runtime and DIRECT_URL (5432) for migrations.",
        meta: e.meta ?? undefined,
      },
    };
  }

  return null;
}
