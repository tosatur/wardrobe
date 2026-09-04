-- AlterTable
ALTER TABLE "item" ADD COLUMN     "currency" TEXT NOT NULL DEFAULT 'USD';

-- AlterTable
ALTER TABLE "user" ADD COLUMN     "defaultCurrency" TEXT NOT NULL DEFAULT 'USD';
