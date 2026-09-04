-- CreateEnum
CREATE TYPE "ItemEventType" AS ENUM ('wash', 'alteration', 'damage', 'repair');

-- CreateTable
CREATE TABLE "item_event" (
    "id" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "type" "ItemEventType" NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "item_event_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "item_event_itemId_idx" ON "item_event"("itemId");

-- AddForeignKey
ALTER TABLE "item_event" ADD CONSTRAINT "item_event_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "item"("id") ON DELETE CASCADE ON UPDATE CASCADE;
