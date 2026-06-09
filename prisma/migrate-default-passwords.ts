// ONE-TIME MIGRATION — run once then delete (safe to re-run; idempotent)
import { config as loadEnv } from "dotenv";
import { resolve } from "node:path";
import bcrypt from "bcryptjs";

loadEnv({ path: resolve(process.cwd(), ".env") });
loadEnv({ path: resolve(process.cwd(), ".env.local"), override: true });

const DEFAULT_PASSWORD = "Analyzer@123";
const SALT_ROUNDS = 12;
const SUPERADMIN_EMAIL = "superadmin@yopmail.com";

async function main() {
  const { prisma } = await import("../lib/prisma");
  const hash = await bcrypt.hash(DEFAULT_PASSWORD, SALT_ROUNDS);

  const withoutPassword = await prisma.user.count({ where: { password: null } });
  if (withoutPassword > 0) {
    const updated = await prisma.user.updateMany({
      where: { password: null },
      data: { password: hash },
    });
    console.log(`Set default password for ${updated.count} user(s) without a password.`);
  } else {
    console.log("No users without password — skipping bulk password update.");
  }

  await prisma.user.upsert({
    where: { email: SUPERADMIN_EMAIL },
    create: {
      email: SUPERADMIN_EMAIL,
      password: hash,
      role: "ADMIN",
      name: "Super Admin",
    },
    update: {
      role: "ADMIN",
      password: hash,
    },
  });
  console.log(`Ensured ${SUPERADMIN_EMAIL} exists with ADMIN role and default password.`);

  console.log("Migration complete — default password set for existing users.");
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
