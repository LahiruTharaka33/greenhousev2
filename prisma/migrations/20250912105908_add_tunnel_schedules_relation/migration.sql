-- AlterTable
ALTER TABLE "public"."Schedule" ADD COLUMN     "tunnelId" TEXT;

-- AddForeignKey
ALTER TABLE "public"."Schedule" ADD CONSTRAINT "Schedule_tunnelId_fkey" FOREIGN KEY ("tunnelId") REFERENCES "public"."Tunnel"("id") ON DELETE CASCADE ON UPDATE CASCADE;
