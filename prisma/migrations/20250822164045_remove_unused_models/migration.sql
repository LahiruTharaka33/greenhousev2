/*
  Warnings:

  - You are about to drop the column `scheduleId` on the `Task` table. All the data in the column will be lost.
  - You are about to drop the column `tunnelId` on the `Task` table. All the data in the column will be lost.
  - You are about to drop the `CustomerInventory` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Item` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Schedule` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Tunnel` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."CustomerInventory" DROP CONSTRAINT "CustomerInventory_customerId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Item" DROP CONSTRAINT "Item_customerInventoryId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Item" DROP CONSTRAINT "Item_mainInventoryId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Schedule" DROP CONSTRAINT "Schedule_tunnelId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Task" DROP CONSTRAINT "Task_scheduleId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Task" DROP CONSTRAINT "Task_tunnelId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Tunnel" DROP CONSTRAINT "Tunnel_customerId_fkey";

-- AlterTable
ALTER TABLE "public"."Task" DROP COLUMN "scheduleId",
DROP COLUMN "tunnelId";

-- DropTable
DROP TABLE "public"."CustomerInventory";

-- DropTable
DROP TABLE "public"."Item";

-- DropTable
DROP TABLE "public"."Schedule";

-- DropTable
DROP TABLE "public"."Tunnel";
