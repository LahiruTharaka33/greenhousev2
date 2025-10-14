-- CreateTable
CREATE TABLE "public"."ScheduleV2" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "tunnelId" TEXT NOT NULL,
    "scheduledDate" TIMESTAMP(3) NOT NULL,
    "fertilizerTypeId" TEXT NOT NULL,
    "quantity" DECIMAL(10,2) NOT NULL,
    "water" DECIMAL(10,2) NOT NULL,
    "notes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ScheduleV2_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."ScheduleV2" ADD CONSTRAINT "ScheduleV2_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "public"."Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ScheduleV2" ADD CONSTRAINT "ScheduleV2_tunnelId_fkey" FOREIGN KEY ("tunnelId") REFERENCES "public"."Tunnel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ScheduleV2" ADD CONSTRAINT "ScheduleV2_fertilizerTypeId_fkey" FOREIGN KEY ("fertilizerTypeId") REFERENCES "public"."Item"("id") ON DELETE CASCADE ON UPDATE CASCADE;
