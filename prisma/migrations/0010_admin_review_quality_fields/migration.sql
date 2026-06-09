-- Admin review: quality dimensions, review metadata, reject reason
ALTER TABLE "Prompt" ADD COLUMN IF NOT EXISTS "qualityDimensions" JSONB;
ALTER TABLE "Prompt" ADD COLUMN IF NOT EXISTS "promptTypeLabel" TEXT;
ALTER TABLE "Prompt" ADD COLUMN IF NOT EXISTS "maturityLevel" TEXT;
ALTER TABLE "Prompt" ADD COLUMN IF NOT EXISTS "rejectReason" TEXT;
ALTER TABLE "Prompt" ADD COLUMN IF NOT EXISTS "reviewedAt" TIMESTAMP(3);
ALTER TABLE "Prompt" ADD COLUMN IF NOT EXISTS "reviewedById" TEXT;
