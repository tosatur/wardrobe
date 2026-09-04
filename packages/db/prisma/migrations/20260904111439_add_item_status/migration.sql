-- CreateEnum
CREATE TYPE "ItemStatus" AS ENUM ('active', 'archived');

-- AlterTable
ALTER TABLE "item" ADD COLUMN     "status" "ItemStatus" NOT NULL DEFAULT 'active';
