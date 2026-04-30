import { Prisma } from "@prisma/client";

/**
 * Maps Prisma known errors to HTTP-friendly payloads so API routes don’t return opaque 500s
 * when the database schema drifts (e.g. missing columns after migrations weren’t applied).
 */
export function prismaKnownRequestResponse(
  e: unknown,
): { status: number; body: Record<string, unknown> } | null {
  if (!(e instanceof Prisma.PrismaClientKnownRequestError)) return null;

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
