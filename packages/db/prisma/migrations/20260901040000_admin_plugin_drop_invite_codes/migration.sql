-- DropForeignKey
ALTER TABLE "invite_code" DROP CONSTRAINT "invite_code_createdById_fkey";

-- DropForeignKey
ALTER TABLE "invite_code" DROP CONSTRAINT "invite_code_usedById_fkey";

-- AlterTable
ALTER TABLE "session" ADD COLUMN     "impersonatedBy" TEXT;

-- AlterTable
ALTER TABLE "user" ADD COLUMN     "banExpires" TIMESTAMP(3),
ADD COLUMN     "banReason" TEXT,
ADD COLUMN     "banned" BOOLEAN DEFAULT false;

-- DropTable
DROP TABLE "invite_code";
