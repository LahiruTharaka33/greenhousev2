-- AddForeignKey
ALTER TABLE "public"."MainInventory" ADD CONSTRAINT "MainInventory_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "public"."Item"("itemId") ON DELETE CASCADE ON UPDATE CASCADE;
