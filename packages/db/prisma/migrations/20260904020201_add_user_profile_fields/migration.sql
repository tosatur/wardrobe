-- AlterTable
ALTER TABLE "user" ADD COLUMN     "avatarKey" TEXT,
ADD COLUMN     "avatarMime" TEXT,
ADD COLUMN     "locationLat" DOUBLE PRECISION,
ADD COLUMN     "locationLon" DOUBLE PRECISION,
ADD COLUMN     "locationName" TEXT;
