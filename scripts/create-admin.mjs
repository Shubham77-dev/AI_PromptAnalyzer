import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import fs from "node:fs";
import path from "node:path";

function loadDotEnvFile(relPath, override) {
  const p = path.join(process.cwd(), relPath);
  if (!fs.existsSync(p)) return;
  const text = fs.readFileSync(p, "utf8");
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const idx = trimmed.indexOf("=");
    if (idx <= 0) continue;
    const key = trimmed.slice(0, idx).trim();
    let val = trimmed.slice(idx + 1).trim();
    if ((val.startsWith("\"") && val.endsWith("\"")) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (override || !process.env[key]) process.env[key] = val;
  }
}

loadDotEnvFile(".env", false);
loadDotEnvFile(".env.local", true);

function requireEnv(name) {
  const v = process.env[name];
  if (!v || !v.trim()) throw new Error(`Missing env var: ${name}`);
  return v.trim();
}

function createPrismaClient() {
  const DATABASE_URL = requireEnv("DATABASE_URL");
  const shouldUseTlsNoVerify = (() => {
    try {
      const u = new URL(DATABASE_URL);
      return (
        u.searchParams.get("sslmode") === "require" ||
        u.hostname.includes("supabase.com") ||
        u.hostname.endsWith(".supabase.co") ||
        u.hostname.includes("pooler.supabase.com")
      );
    } catch {
      return false;
    }
  })();

  const connectionStringForPg = (() => {
    if (!shouldUseTlsNoVerify) return DATABASE_URL;
    try {
      const u = new URL(DATABASE_URL);
      if (u.searchParams.get("sslmode") === "require") u.searchParams.set("sslmode", "no-verify");
      return u.toString();
    } catch {
      return DATABASE_URL;
    }
  })();

  const pool = new Pool({
    connectionString: connectionStringForPg,
    ssl: shouldUseTlsNoVerify ? { rejectUnauthorized: false } : undefined,
  });
  const adapter = new PrismaPg(pool);
  return new PrismaClient({ adapter });
}

const prisma = createPrismaClient();

async function main() {
  const email = "superadmin@promptanalyzer.local".toLowerCase();

  const user = await prisma.user.upsert({
    where: { email },
    update: { role: "ADMIN", status: "ACTIVE", plan: "ENTERPRISE" },
    create: { email, role: "ADMIN", status: "ACTIVE", plan: "ENTERPRISE" },
    select: { id: true, email: true, role: true, status: true, plan: true, createdAt: true },
  });

  console.log("[admin] ensured super admin user:", user);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error("[admin] failed:", e);
    await prisma.$disconnect();
    process.exit(1);
  });

