/*
  Warnings:

  - You are about to drop the column `photoCutoutUrl` on the `item` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "PhotoStatus" AS ENUM ('none', 'processing', 'ready', 'failed');

-- AlterTable
ALTER TABLE "item" DROP COLUMN "photoCutoutUrl",
ADD COLUMN     "photoCutoutKey" TEXT,
ADD COLUMN     "photoStatus" "PhotoStatus" NOT NULL DEFAULT 'none',
ADD COLUMN     "photoThumbnailKey" TEXT;
