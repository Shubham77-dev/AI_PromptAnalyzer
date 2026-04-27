import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    // Prisma migrate should use DIRECT_URL (non-PgBouncer) to avoid transaction issues.
    url: env("DIRECT_URL"),
  },
});

