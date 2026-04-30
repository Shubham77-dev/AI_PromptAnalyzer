-- Add enum value for review gating.
DO $$
BEGIN
  ALTER TYPE "PromptStatus" ADD VALUE IF NOT EXISTS 'UNDER_REVIEW';
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

