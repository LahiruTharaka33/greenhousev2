-- CreateTable
CREATE TABLE "public"."Tunnel" (
    "id" TEXT NOT NULL,
    "tunnelId" TEXT NOT NULL,
    "tunnelName" TEXT NOT NULL,
    "description" TEXT,
    "cultivationType" TEXT,
    "location" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "customerId" TEXT NOT NULL,

    CONSTRAINT "Tunnel_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Tunnel_tunnelId_key" ON "public"."Tunnel"("tunnelId");

-- AddForeignKey
ALTER TABLE "public"."Tunnel" ADD CONSTRAINT "Tunnel_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "public"."Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;
