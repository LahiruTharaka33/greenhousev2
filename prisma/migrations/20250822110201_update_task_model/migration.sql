/*
  Warnings:

  - Added the required column `customerId` to the `Task` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "public"."Task" DROP CONSTRAINT "Task_tunnelId_fkey";

-- AlterTable
ALTER TABLE "public"."Task" ADD COLUMN     "assignedTo" TEXT,
ADD COLUMN     "customerId" TEXT NOT NULL,
ALTER COLUMN "status" SET DEFAULT 'todo',
ALTER COLUMN "tunnelId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "public"."Task" ADD CONSTRAINT "Task_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "public"."Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Task" ADD CONSTRAINT "Task_tunnelId_fkey" FOREIGN KEY ("tunnelId") REFERENCES "public"."Tunnel"("id") ON DELETE SET NULL ON UPDATE CASCADE;
