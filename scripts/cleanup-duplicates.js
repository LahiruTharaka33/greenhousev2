const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function cleanupDuplicates() {
  try {
    console.log('Starting cleanup of duplicate customer inventory records...');
    
    // Find all customer inventory records
    const allRecords = await prisma.customerInventory.findMany({
      include: {
        customer: true,
        item: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });
    
    console.log(`Found ${allRecords.length} total records`);
    
    // Group records by itemId and customerId
    const groupedRecords = {};
    const duplicates = [];
    
    allRecords.forEach(record => {
      const key = `${record.itemId}-${record.customerId}`;
      if (!groupedRecords[key]) {
        groupedRecords[key] = [];
      }
      groupedRecords[key].push(record);
      
      // If we have more than one record for the same item-customer combination
      if (groupedRecords[key].length > 1) {
        duplicates.push(groupedRecords[key]);
      }
    });
    
    console.log(`Found ${duplicates.length} groups with duplicates`);
    
    // Process each group of duplicates
    for (const duplicateGroup of duplicates) {
      console.log(`Processing duplicates for item ${duplicateGroup[0].itemId} and customer ${duplicateGroup[0].customer.customerName}`);
      
      // Keep the first record (oldest) and merge quantities from others
      const keepRecord = duplicateGroup[0];
      const deleteRecords = duplicateGroup.slice(1);
      
      // Calculate total quantity
      const totalQuantity = duplicateGroup.reduce((sum, record) => sum + record.quantity, 0);
      
      // Update the record to keep with total quantity
      await prisma.customerInventory.update({
        where: { id: keepRecord.id },
        data: {
          quantity: totalQuantity,
          description: `Merged from ${duplicateGroup.length} duplicate records on ${new Date().toLocaleDateString()}`,
        },
      });
      
      console.log(`  Updated record ${keepRecord.id} with total quantity: ${totalQuantity}`);
      
      // Delete the duplicate records
      for (const deleteRecord of deleteRecords) {
        await prisma.customerInventory.delete({
          where: { id: deleteRecord.id },
        });
        console.log(`  Deleted duplicate record ${deleteRecord.id}`);
      }
    }
    
    console.log('Cleanup completed successfully!');
    
    // Verify no duplicates remain
    const remainingRecords = await prisma.customerInventory.findMany();
    const remainingGrouped = {};
    
    remainingRecords.forEach(record => {
      const key = `${record.itemId}-${record.customerId}`;
      if (!remainingGrouped[key]) {
        remainingGrouped[key] = 0;
      }
      remainingGrouped[key]++;
    });
    
    const stillDuplicates = Object.values(remainingGrouped).some(count => count > 1);
    
    if (stillDuplicates) {
      console.log('⚠️  Warning: Some duplicates may still exist');
    } else {
      console.log('✅ No duplicates remain');
    }
    
  } catch (error) {
    console.error('Error during cleanup:', error);
  } finally {
    await prisma.$disconnect();
  }
}

cleanupDuplicates();
