-- AlterTable
ALTER TABLE "outfit" ADD COLUMN     "rating" DOUBLE PRECISION;

-- CreateTable
CREATE TABLE "outfit_tag" (
    "outfitId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,

    CONSTRAINT "outfit_tag_pkey" PRIMARY KEY ("outfitId","tagId")
);

-- CreateTable
CREATE TABLE "outfit_wear" (
    "id" TEXT NOT NULL,
    "outfitId" TEXT NOT NULL,
    "wornDate" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "outfit_wear_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "outfit_tag_tagId_idx" ON "outfit_tag"("tagId");

-- CreateIndex
CREATE INDEX "outfit_wear_outfitId_idx" ON "outfit_wear"("outfitId");

-- AddForeignKey
ALTER TABLE "outfit_tag" ADD CONSTRAINT "outfit_tag_outfitId_fkey" FOREIGN KEY ("outfitId") REFERENCES "outfit"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "outfit_tag" ADD CONSTRAINT "outfit_tag_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "tag"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "outfit_wear" ADD CONSTRAINT "outfit_wear_outfitId_fkey" FOREIGN KEY ("outfitId") REFERENCES "outfit"("id") ON DELETE CASCADE ON UPDATE CASCADE;
