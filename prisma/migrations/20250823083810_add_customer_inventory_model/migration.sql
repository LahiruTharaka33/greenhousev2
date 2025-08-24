-- CreateTable
CREATE TABLE "public"."CustomerInventory" (
    "id" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "itemType" TEXT NOT NULL,
    "itemName" TEXT NOT NULL,
    "description" TEXT,
    "quantity" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "customerId" TEXT NOT NULL,

    CONSTRAINT "CustomerInventory_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."CustomerInventory" ADD CONSTRAINT "CustomerInventory_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "public"."Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CustomerInventory" ADD CONSTRAINT "CustomerInventory_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "public"."Item"("itemId") ON DELETE CASCADE ON UPDATE CASCADE;
