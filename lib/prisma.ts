import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { getEnv } from "@/lib/env";

declare global {
  var prisma: PrismaClient | undefined;
  var pgPool: Pool | undefined;
}

function createPrismaClient() {
  const { DATABASE_URL } = getEnv();

  const shouldUseTlsNoVerify = (() => {
    try {
      const u = new URL(DATABASE_URL);
      return (
        u.searchParams.get("sslmode") === "require" ||
        u.hostname.includes("supabase.com") ||
        u.hostname.includes("pooler.supabase.com")
      );
    } catch {
      return false;
    }
  })();

  const connectionStringForPg = (() => {
    // Some Node TLS environments reject the Supabase chain; pg respects `sslmode=no-verify`.
    // Keep DATABASE_URL as-is for human readability, but ensure runtime can connect reliably.
    if (!shouldUseTlsNoVerify) return DATABASE_URL;
    try {
      const u = new URL(DATABASE_URL);
      if (u.searchParams.get("sslmode") === "require") {
        u.searchParams.set("sslmode", "no-verify");
      }
      return u.toString();
    } catch {
      return DATABASE_URL;
    }
  })();

  if (process.env.NODE_ENV !== "production") {
    console.log("[prisma] creating client");
    console.log("[prisma] DATABASE_URL present:", Boolean(process.env.DATABASE_URL));
    console.log("[prisma] ssl rejectUnauthorized disabled:", shouldUseTlsNoVerify);
  }

  const pool =
    globalThis.pgPool ??
    new Pool({
      connectionString: connectionStringForPg,
      ssl: shouldUseTlsNoVerify ? { rejectUnauthorized: false } : undefined,
      // PgBouncer (transaction pooling) benefits from low concurrency here.
      // Keep simple defaults; tune later if needed.
    });

  if (process.env.NODE_ENV !== "production") globalThis.pgPool = pool;

  const adapter = new PrismaPg(pool);

  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });
}

export const prisma = globalThis.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalThis.prisma = prisma;

