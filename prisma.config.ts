import "dotenv/config";
import { defineConfig, env } from "prisma/config";

// CLI (`migrate`, `db push`, etc.) must use a session-capable Postgres URL — Supabase `DIRECT_URL` on port 5432.
// The Next.js app at runtime uses `DATABASE_URL` (PgBouncer pooler, port 6543) via `lib/prisma.ts`.
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: env("DIRECT_URL"),
  },
});

