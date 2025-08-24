/*
  Warnings:

  - A unique constraint covering the columns `[itemId,customerId]` on the table `CustomerInventory` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "CustomerInventory_itemId_customerId_key" ON "public"."CustomerInventory"("itemId", "customerId");
