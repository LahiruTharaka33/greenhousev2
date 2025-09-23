const { PrismaClient } = require('@prisma/client');
const fs = require('fs').promises;
const path = require('path');

const prisma = new PrismaClient();

async function createBackup() {
  try {
    console.log('🚀 Starting database backup...');
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupDir = path.join(process.cwd(), 'backups');
    const backupFile = path.join(backupDir, `backup-${timestamp}.json`);
    
    // Ensure backup directory exists
    await fs.mkdir(backupDir, { recursive: true });
    
    console.log('📊 Fetching data from all tables...');
    
    // Fetch all data from all tables
    const backupData = {
      metadata: {
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        description: 'Greenhouse Management System Database Backup'
      },
      data: {
        // User authentication data
        users: await prisma.user.findMany({
          include: {
            accounts: true,
            sessions: true,
            customer: true
          }
        }),
        accounts: await prisma.account.findMany(),
        sessions: await prisma.session.findMany(),
        verificationTokens: await prisma.verificationToken.findMany(),
        
        // Core business data
        customers: await prisma.customer.findMany({
          include: {
            user: true,
            tunnels: true,
            schedules: true,
            tasks: true,
            customerInventories: true
          }
        }),
        
        tunnels: await prisma.tunnel.findMany({
          include: {
            customer: true,
            schedules: true
          }
        }),
        
        schedules: await prisma.schedule.findMany({
          include: {
            customer: true,
            item: true,
            tunnel: true
          }
        }),
        
        // Inventory data
        items: await prisma.item.findMany({
          include: {
            mainInventory: true,
            customerInventories: true,
            schedules: true
          }
        }),
        
        mainInventory: await prisma.mainInventory.findMany({
          include: {
            item: true
          }
        }),
        
        customerInventories: await prisma.customerInventory.findMany({
          include: {
            customer: true,
            item: true
          }
        }),
        
        // Task data
        tasks: await prisma.task.findMany({
          include: {
            customer: true
          }
        })
      }
    };
    
    // Calculate statistics
    const stats = {
      users: backupData.data.users.length,
      customers: backupData.data.customers.length,
      tunnels: backupData.data.tunnels.length,
      schedules: backupData.data.schedules.length,
      items: backupData.data.items.length,
      tasks: backupData.data.tasks.length
    };
    
    backupData.metadata.statistics = stats;
    
    console.log('💾 Writing backup to file...');
    await fs.writeFile(backupFile, JSON.stringify(backupData, null, 2));
    
    console.log('✅ Backup completed successfully!');
    console.log(`📁 Backup saved to: ${backupFile}`);
    console.log('📈 Backup statistics:');
    Object.entries(stats).forEach(([key, value]) => {
      console.log(`   ${key}: ${value} records`);
    });
    
    return backupFile;
    
  } catch (error) {
    console.error('❌ Backup failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run backup if called directly
if (require.main === module) {
  createBackup()
    .then((backupFile) => {
      console.log(`\n🎉 Backup process completed successfully!`);
      console.log(`📄 Backup file: ${backupFile}`);
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Backup process failed:', error.message);
      process.exit(1);
    });
}

module.exports = { createBackup };
