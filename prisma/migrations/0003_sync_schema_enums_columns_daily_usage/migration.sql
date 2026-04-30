-- Idempotent reconciliation for databases that diverged from migration history (missing enums/columns/table).
-- Safe if a subset of changes already exists (e.g. 0002 applied without intermediate manual DDL).

-- Enums used by Prisma schema
DO $$
BEGIN
    CREATE TYPE "UserRole" AS ENUM ('USER', 'ADMIN');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
    CREATE TYPE "ModerationStatus" AS ENUM ('APPROVED', 'PENDING', 'REJECTED');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- User.role (fixes "column role does not exist")
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "role" "UserRole" NOT NULL DEFAULT 'USER'::"UserRole";

-- Prompt moderation + analyzer fields (fixes missing moderation columns / score / flags / aiDetails)
ALTER TABLE "Prompt" ADD COLUMN IF NOT EXISTS "moderationStatus" "ModerationStatus" NOT NULL DEFAULT 'APPROVED'::"ModerationStatus";
ALTER TABLE "Prompt" ADD COLUMN IF NOT EXISTS "flagged" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Prompt" ADD COLUMN IF NOT EXISTS "reason" TEXT;
ALTER TABLE "Prompt" ADD COLUMN IF NOT EXISTS "moderationScore" DOUBLE PRECISION;
ALTER TABLE "Prompt" ADD COLUMN IF NOT EXISTS "moderationRaw" JSONB;
ALTER TABLE "Prompt" ADD COLUMN IF NOT EXISTS "score" DOUBLE PRECISION;
ALTER TABLE "Prompt" ADD COLUMN IF NOT EXISTS "flags" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "Prompt" ADD COLUMN IF NOT EXISTS "aiDetails" JSONB;

CREATE INDEX IF NOT EXISTS "Prompt_moderationStatus_createdAt_idx" ON "Prompt"("moderationStatus", "createdAt");

-- DailyUsage (missing entirely when only legacy 0001 was applied)
CREATE TABLE IF NOT EXISTS "DailyUsage" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "day" TIMESTAMP(3) NOT NULL,
    "userId" UUID,
    "ipHash" TEXT,
    "count" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DailyUsage_pkey" PRIMARY KEY ("id")
);

DO $$
BEGIN
    ALTER TABLE "DailyUsage" ADD CONSTRAINT "DailyUsage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS "DailyUsage_day_userId_key" ON "DailyUsage"("day", "userId");
CREATE UNIQUE INDEX IF NOT EXISTS "DailyUsage_day_ipHash_key" ON "DailyUsage"("day", "ipHash");
CREATE INDEX IF NOT EXISTS "DailyUsage_userId_day_idx" ON "DailyUsage"("userId", "day");
CREATE INDEX IF NOT EXISTS "DailyUsage_ipHash_day_idx" ON "DailyUsage"("ipHash", "day");
