-- CreateEnum
CREATE TYPE "ItemStatus" AS ENUM ('active', 'archived', 'donated');

-- CreateEnum
CREATE TYPE "ItemVisibility" AS ENUM ('private', 'public');

-- CreateTable
CREATE TABLE "item" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "subcategory" TEXT,
    "colors" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "brand" TEXT,
    "size" TEXT,
    "material" TEXT,
    "purchaseDate" TIMESTAMP(3),
    "price" DECIMAL(10,2),
    "notes" TEXT,
    "photoOriginalKey" TEXT,
    "photoOriginalMime" TEXT,
    "photoCutoutUrl" TEXT,
    "status" "ItemStatus" NOT NULL DEFAULT 'active',
    "visibility" "ItemVisibility" NOT NULL DEFAULT 'private',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "item_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tag" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "tag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "item_tag" (
    "itemId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,

    CONSTRAINT "item_tag_pkey" PRIMARY KEY ("itemId","tagId")
);

-- CreateIndex
CREATE INDEX "item_ownerId_idx" ON "item"("ownerId");

-- CreateIndex
CREATE INDEX "item_ownerId_status_idx" ON "item"("ownerId", "status");

-- CreateIndex
CREATE INDEX "item_category_idx" ON "item"("category");

-- CreateIndex
CREATE UNIQUE INDEX "tag_name_key" ON "tag"("name");

-- CreateIndex
CREATE INDEX "item_tag_tagId_idx" ON "item_tag"("tagId");

-- AddForeignKey
ALTER TABLE "item" ADD CONSTRAINT "item_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "item_tag" ADD CONSTRAINT "item_tag_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "item"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "item_tag" ADD CONSTRAINT "item_tag_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "tag"("id") ON DELETE CASCADE ON UPDATE CASCADE;
