-- Existing "item" rows are disposable dev/session-test data; categoryId is
-- becoming NOT NULL with no sensible default, so clear them before altering.
-- Cascades to "item_tag" automatically via its existing FK.
DELETE FROM "item";

-- DropIndex
DROP INDEX "item_category_idx";

-- DropIndex
DROP INDEX "item_ownerId_status_idx";

-- AlterTable
ALTER TABLE "item" DROP COLUMN "brand",
DROP COLUMN "category",
DROP COLUMN "colors",
DROP COLUMN "material",
DROP COLUMN "status",
DROP COLUMN "subcategory",
ADD COLUMN     "brandId" TEXT,
ADD COLUMN     "categoryId" TEXT NOT NULL;

-- DropEnum
DROP TYPE "ItemStatus";

-- CreateTable
CREATE TABLE "color" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "hex" TEXT NOT NULL,

    CONSTRAINT "color_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "item_color" (
    "itemId" TEXT NOT NULL,
    "colorId" TEXT NOT NULL,

    CONSTRAINT "item_color_pkey" PRIMARY KEY ("itemId","colorId")
);

-- CreateTable
CREATE TABLE "material" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "material_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "item_material" (
    "itemId" TEXT NOT NULL,
    "materialId" TEXT NOT NULL,

    CONSTRAINT "item_material_pkey" PRIMARY KEY ("itemId","materialId")
);

-- CreateTable
CREATE TABLE "brand" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "brand_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "category" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "parentId" TEXT,

    CONSTRAINT "category_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "color_name_key" ON "color"("name");

-- CreateIndex
CREATE INDEX "item_color_colorId_idx" ON "item_color"("colorId");

-- CreateIndex
CREATE UNIQUE INDEX "material_name_key" ON "material"("name");

-- CreateIndex
CREATE INDEX "item_material_materialId_idx" ON "item_material"("materialId");

-- CreateIndex
CREATE UNIQUE INDEX "brand_name_key" ON "brand"("name");

-- CreateIndex
CREATE INDEX "category_parentId_idx" ON "category"("parentId");

-- CreateIndex
CREATE UNIQUE INDEX "category_parentId_name_key" ON "category"("parentId", "name");

-- CreateIndex
CREATE INDEX "item_categoryId_idx" ON "item"("categoryId");

-- CreateIndex
CREATE INDEX "item_brandId_idx" ON "item"("brandId");

-- AddForeignKey
ALTER TABLE "item" ADD CONSTRAINT "item_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "item" ADD CONSTRAINT "item_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "brand"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "item_color" ADD CONSTRAINT "item_color_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "item"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "item_color" ADD CONSTRAINT "item_color_colorId_fkey" FOREIGN KEY ("colorId") REFERENCES "color"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "item_material" ADD CONSTRAINT "item_material_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "item"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "item_material" ADD CONSTRAINT "item_material_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "material"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "category" ADD CONSTRAINT "category_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "category"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Manual: Postgres treats every NULL as distinct in a unique index, so
-- @@unique([parentId, name]) alone does not stop two top-level categories
-- (parentId IS NULL) from sharing a name. Close that gap explicitly.
CREATE UNIQUE INDEX "category_top_level_name_uidx" ON "category" ("name") WHERE "parentId" IS NULL;
