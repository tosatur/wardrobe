-- CreateTable
CREATE TABLE "outfit" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "coverPhotoUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "outfit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "outfit_item" (
    "outfitId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "x" DOUBLE PRECISION NOT NULL,
    "y" DOUBLE PRECISION NOT NULL,
    "zIndex" INTEGER NOT NULL,

    CONSTRAINT "outfit_item_pkey" PRIMARY KEY ("outfitId","itemId")
);

-- CreateIndex
CREATE INDEX "outfit_ownerId_idx" ON "outfit"("ownerId");

-- CreateIndex
CREATE INDEX "outfit_item_itemId_idx" ON "outfit_item"("itemId");

-- AddForeignKey
ALTER TABLE "outfit" ADD CONSTRAINT "outfit_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "outfit_item" ADD CONSTRAINT "outfit_item_outfitId_fkey" FOREIGN KEY ("outfitId") REFERENCES "outfit"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "outfit_item" ADD CONSTRAINT "outfit_item_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "item"("id") ON DELETE CASCADE ON UPDATE CASCADE;
