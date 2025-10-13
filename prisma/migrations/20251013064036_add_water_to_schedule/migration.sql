-- AlterTable
ALTER TABLE "public"."Item" ADD COLUMN     "unit" TEXT NOT NULL DEFAULT 'pieces';

-- AlterTable
ALTER TABLE "public"."Schedule" ADD COLUMN     "water" TEXT;

-- AlterTable
ALTER TABLE "public"."Tunnel" ADD COLUMN     "clientId" TEXT;

-- CreateTable
CREATE TABLE "public"."TankConfiguration" (
    "id" TEXT NOT NULL,
    "tunnelId" TEXT NOT NULL,
    "tankName" TEXT NOT NULL,
    "itemType" TEXT NOT NULL,
    "itemId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TankConfiguration_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TankConfiguration_tunnelId_tankName_key" ON "public"."TankConfiguration"("tunnelId", "tankName");

-- AddForeignKey
ALTER TABLE "public"."TankConfiguration" ADD CONSTRAINT "TankConfiguration_tunnelId_fkey" FOREIGN KEY ("tunnelId") REFERENCES "public"."Tunnel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TankConfiguration" ADD CONSTRAINT "TankConfiguration_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "public"."Item"("id") ON DELETE SET NULL ON UPDATE CASCADE;
