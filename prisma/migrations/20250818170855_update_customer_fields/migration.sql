/*
  Warnings:

  - You are about to drop the column `name` on the `Customer` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[customerId]` on the table `Customer` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `customerId` to the `Customer` table without a default value. This is not possible if the table is not empty.
  - Added the required column `customerName` to the `Customer` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."Customer" DROP COLUMN "name",
ADD COLUMN     "company" TEXT,
ADD COLUMN     "cultivationName" TEXT,
ADD COLUMN     "cultivationType" TEXT,
ADD COLUMN     "customerId" TEXT NOT NULL,
ADD COLUMN     "customerName" TEXT NOT NULL,
ADD COLUMN     "location" TEXT,
ADD COLUMN     "noOfTunnel" INTEGER NOT NULL DEFAULT 0;

-- CreateIndex
CREATE UNIQUE INDEX "Customer_customerId_key" ON "public"."Customer"("customerId");
