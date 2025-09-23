const { PrismaClient } = require('@prisma/client');
const fs = require('fs').promises;
const path = require('path');

const prisma = new PrismaClient();

async function restoreFromBackup(backupFilePath) {
  try {
    console.log('🔄 Starting database restore...');
    console.log(`📁 Reading backup file: ${backupFilePath}`);
    
    // Check if backup file exists
    try {
      await fs.access(backupFilePath);
    } catch (error) {
      throw new Error(`Backup file not found: ${backupFilePath}`);
    }
    
    // Read and parse backup file
    const backupContent = await fs.readFile(backupFilePath, 'utf8');
    const backupData = JSON.parse(backupContent);
    
    // Validate backup structure
    if (!backupData.metadata || !backupData.data) {
      throw new Error('Invalid backup file format');
    }
    
    console.log('📊 Backup metadata:');
    console.log(`   Created: ${backupData.metadata.timestamp}`);
    console.log(`   Version: ${backupData.metadata.version}`);
    console.log(`   Description: ${backupData.metadata.description}`);
    
    if (backupData.metadata.statistics) {
      console.log('📈 Records to restore:');
      Object.entries(backupData.metadata.statistics).forEach(([key, value]) => {
        console.log(`   ${key}: ${value} records`);
      });
    }
    
    // Confirm restore operation
    console.log('\n⚠️  WARNING: This will delete all existing data and restore from backup!');
    
    // Start transaction for data restoration
    await prisma.$transaction(async (tx) => {
      console.log('🗑️  Clearing existing data...');
      
      // Delete in reverse dependency order to avoid foreign key constraints
      await tx.schedule.deleteMany();
      await tx.task.deleteMany();
      await tx.customerInventory.deleteMany();
      await tx.mainInventory.deleteMany();
      await tx.item.deleteMany();
      await tx.tunnel.deleteMany();
      await tx.customer.deleteMany();
      await tx.session.deleteMany();
      await tx.account.deleteMany();
      await tx.verificationToken.deleteMany();
      await tx.user.deleteMany();
      
      console.log('📥 Restoring data...');
      
      // Restore data in dependency order
      
      // 1. Users (base authentication)
      if (backupData.data.users?.length > 0) {
        console.log(`   Restoring ${backupData.data.users.length} users...`);
        for (const user of backupData.data.users) {
          const { accounts, sessions, customer, ...userData } = user;
          await tx.user.create({ data: userData });
        }
      }
      
      // 2. Accounts
      if (backupData.data.accounts?.length > 0) {
        console.log(`   Restoring ${backupData.data.accounts.length} accounts...`);
        for (const account of backupData.data.accounts) {
          await tx.account.create({ data: account });
        }
      }
      
      // 3. Sessions
      if (backupData.data.sessions?.length > 0) {
        console.log(`   Restoring ${backupData.data.sessions.length} sessions...`);
        for (const session of backupData.data.sessions) {
          await tx.session.create({ data: session });
        }
      }
      
      // 4. Verification Tokens
      if (backupData.data.verificationTokens?.length > 0) {
        console.log(`   Restoring ${backupData.data.verificationTokens.length} verification tokens...`);
        for (const token of backupData.data.verificationTokens) {
          await tx.verificationToken.create({ data: token });
        }
      }
      
      // 5. Items (needed before customers for inventory)
      if (backupData.data.items?.length > 0) {
        console.log(`   Restoring ${backupData.data.items.length} items...`);
        for (const item of backupData.data.items) {
          const { mainInventory, customerInventories, schedules, ...itemData } = item;
          await tx.item.create({ data: itemData });
        }
      }
      
      // 6. Customers
      if (backupData.data.customers?.length > 0) {
        console.log(`   Restoring ${backupData.data.customers.length} customers...`);
        for (const customer of backupData.data.customers) {
          const { user, tunnels, schedules, tasks, customerInventories, ...customerData } = customer;
          await tx.customer.create({ data: customerData });
        }
      }
      
      // 7. Tunnels
      if (backupData.data.tunnels?.length > 0) {
        console.log(`   Restoring ${backupData.data.tunnels.length} tunnels...`);
        for (const tunnel of backupData.data.tunnels) {
          const { customer, schedules, ...tunnelData } = tunnel;
          await tx.tunnel.create({ data: tunnelData });
        }
      }
      
      // 8. Main Inventory
      if (backupData.data.mainInventory?.length > 0) {
        console.log(`   Restoring ${backupData.data.mainInventory.length} main inventory items...`);
        for (const inventory of backupData.data.mainInventory) {
          const { item, ...inventoryData } = inventory;
          await tx.mainInventory.create({ data: inventoryData });
        }
      }
      
      // 9. Customer Inventories
      if (backupData.data.customerInventories?.length > 0) {
        console.log(`   Restoring ${backupData.data.customerInventories.length} customer inventory items...`);
        for (const inventory of backupData.data.customerInventories) {
          const { customer, item, ...inventoryData } = inventory;
          await tx.customerInventory.create({ data: inventoryData });
        }
      }
      
      // 10. Tasks
      if (backupData.data.tasks?.length > 0) {
        console.log(`   Restoring ${backupData.data.tasks.length} tasks...`);
        for (const task of backupData.data.tasks) {
          const { customer, ...taskData } = task;
          await tx.task.create({ data: taskData });
        }
      }
      
      // 11. Schedules (last due to multiple dependencies)
      if (backupData.data.schedules?.length > 0) {
        console.log(`   Restoring ${backupData.data.schedules.length} schedules...`);
        for (const schedule of backupData.data.schedules) {
          const { customer, item, tunnel, ...scheduleData } = schedule;
          await tx.schedule.create({ data: scheduleData });
        }
      }
    });
    
    console.log('✅ Database restore completed successfully!');
    
    // Verify restoration
    const verificationStats = {
      users: await prisma.user.count(),
      customers: await prisma.customer.count(),
      tunnels: await prisma.tunnel.count(),
      schedules: await prisma.schedule.count(),
      items: await prisma.item.count(),
      tasks: await prisma.task.count()
    };
    
    console.log('🔍 Verification - Records restored:');
    Object.entries(verificationStats).forEach(([key, value]) => {
      console.log(`   ${key}: ${value} records`);
    });
    
    return verificationStats;
    
  } catch (error) {
    console.error('❌ Restore failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Command line interface
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log('Usage: node restore-data.js <backup-file-path>');
    console.log('Example: node restore-data.js ./backups/backup-2024-01-01T10-00-00-000Z.json');
    process.exit(1);
  }
  
  const backupFilePath = path.resolve(args[0]);
  
  try {
    await restoreFromBackup(backupFilePath);
    console.log('\n🎉 Restore process completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('\n💥 Restore process failed:', error.message);
    process.exit(1);
  }
}

// Run restore if called directly
if (require.main === module) {
  main();
}

module.exports = { restoreFromBackup };
