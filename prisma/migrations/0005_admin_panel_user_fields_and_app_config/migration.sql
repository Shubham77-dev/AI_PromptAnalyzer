-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "UserPlan" AS ENUM ('FREE', 'PRO', 'ENTERPRISE');

-- AlterTable
ALTER TABLE "User"
ADD COLUMN     "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
ADD COLUMN     "plan" "UserPlan" NOT NULL DEFAULT 'FREE';

-- CreateTable
CREATE TABLE "app_config" (
    "id" INTEGER NOT NULL,
    "minPublishScore" INTEGER NOT NULL DEFAULT 60,
    "freeTierDailyLimit" INTEGER NOT NULL DEFAULT 10,
    "requireEmailVerification" BOOLEAN NOT NULL DEFAULT false,
    "allowPublicRegistration" BOOLEAN NOT NULL DEFAULT true,
    "maintenanceMode" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "app_config_pkey" PRIMARY KEY ("id")
);

