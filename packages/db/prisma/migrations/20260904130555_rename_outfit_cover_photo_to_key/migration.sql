/*
  Warnings:

  - You are about to drop the column `coverPhotoUrl` on the `outfit` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "outfit" DROP COLUMN "coverPhotoUrl",
ADD COLUMN     "coverPhotoKey" TEXT;
