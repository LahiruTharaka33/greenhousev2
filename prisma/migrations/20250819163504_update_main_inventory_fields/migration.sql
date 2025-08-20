/*
  Warnings:

  - You are about to drop the column `maxQuantity` on the `MainInventory` table. All the data in the column will be lost.
  - You are about to drop the column `minQuantity` on the `MainInventory` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `MainInventory` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[itemId]` on the table `MainInventory` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `itemId` to the `MainInventory` table without a default value. This is not possible if the table is not empty.
  - Added the required column `itemName` to the `MainInventory` table without a default value. This is not possible if the table is not empty.
  - Added the required column `itemType` to the `MainInventory` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."MainInventory" DROP COLUMN "maxQuantity",
DROP COLUMN "minQuantity",
DROP COLUMN "name",
ADD COLUMN     "itemId" TEXT NOT NULL,
ADD COLUMN     "itemName" TEXT NOT NULL,
ADD COLUMN     "itemType" TEXT NOT NULL,
ADD COLUMN     "storedDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateIndex
CREATE UNIQUE INDEX "MainInventory_itemId_key" ON "public"."MainInventory"("itemId");
