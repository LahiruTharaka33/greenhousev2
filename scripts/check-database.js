const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkDatabase() {
  console.log('🔍 Checking current database data...\n');

  try {
    // Check Users
    console.log('👥 USERS:');
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true
      }
    });
    console.log(`Count: ${users.length}`);
    users.forEach(user => {
      console.log(`  - ${user.name} (${user.email}) - ${user.role}`);
    });

    // Check Customers
    console.log('\n🏢 CUSTOMERS:');
    const customers = await prisma.customer.findMany({
      select: {
        id: true,
        customerId: true,
        customerName: true,
        email: true,
        noOfTunnel: true,
        cultivationType: true
      }
    });
    console.log(`Count: ${customers.length}`);
    customers.forEach(customer => {
      console.log(`  - ${customer.customerId}: ${customer.customerName} (${customer.cultivationType}) - ${customer.noOfTunnel} tunnels`);
    });

    // Check Items
    console.log('\n📦 ITEMS:');
    const items = await prisma.item.findMany({
      select: {
        id: true,
        itemId: true,
        itemName: true,
        itemCategory: true,
        unit: true
      }
    });
    console.log(`Count: ${items.length}`);
    items.forEach(item => {
      console.log(`  - ${item.itemId}: ${item.itemName} (${item.itemCategory}) - ${item.unit}`);
    });

    // Check Tunnels
    console.log('\n🏠 TUNNELS:');
    const tunnels = await prisma.tunnel.findMany({
      select: {
        id: true,
        tunnelId: true,
        tunnelName: true,
        clientId: true,
        customerId: true,
        customer: {
          select: {
            customerName: true
          }
        }
      }
    });
    console.log(`Count: ${tunnels.length}`);
    tunnels.forEach(tunnel => {
      console.log(`  - ${tunnel.tunnelId}: ${tunnel.tunnelName} (${tunnel.customer.customerName}) - ESP32: ${tunnel.clientId || 'None'}`);
    });

    // Check Main Inventory
    console.log('\n🏪 MAIN INVENTORY:');
    const mainInventory = await prisma.mainInventory.findMany({
      select: {
        itemId: true,
        itemName: true,
        quantity: true,
        itemType: true
      }
    });
    console.log(`Count: ${mainInventory.length}`);
    mainInventory.forEach(inv => {
      console.log(`  - ${inv.itemId}: ${inv.itemName} (${inv.itemType}) - Qty: ${inv.quantity}`);
    });

    // Check Customer Inventories
    console.log('\n📋 CUSTOMER INVENTORIES:');
    const customerInventories = await prisma.customerInventory.findMany({
      select: {
        itemId: true,
        itemName: true,
        quantity: true,
        customer: {
          select: {
            customerName: true
          }
        }
      }
    });
    console.log(`Count: ${customerInventories.length}`);
    customerInventories.forEach(inv => {
      console.log(`  - ${inv.itemId}: ${inv.itemName} (${inv.customer.customerName}) - Qty: ${inv.quantity}`);
    });

    // Check Tasks
    console.log('\n📝 TASKS:');
    const tasks = await prisma.task.findMany({
      select: {
        id: true,
        title: true,
        status: true,
        priority: true,
        customer: {
          select: {
            customerName: true
          }
        }
      }
    });
    console.log(`Count: ${tasks.length}`);
    tasks.forEach(task => {
      console.log(`  - ${task.title} (${task.customer.customerName}) - ${task.status} [${task.priority}]`);
    });

    // Check Schedules
    console.log('\n📅 SCHEDULES:');
    const schedules = await prisma.schedule.findMany({
      select: {
        id: true,
        scheduledDate: true,
        scheduledTime: true,
        quantity: true,
        status: true,
        item: {
          select: {
            itemName: true
          }
        },
        customer: {
          select: {
            customerName: true
          }
        },
        tunnel: {
          select: {
            tunnelName: true
          }
        }
      }
    });
    console.log(`Count: ${schedules.length}`);
    schedules.forEach(schedule => {
      const date = schedule.scheduledDate.toISOString().split('T')[0];
      console.log(`  - ${date} ${schedule.scheduledTime}: ${schedule.item.itemName} (${schedule.customer.customerName}) - ${schedule.tunnel?.tunnelName || 'No tunnel'} - Qty: ${schedule.quantity} [${schedule.status}]`);
    });

    console.log('\n✅ Database check completed!');

    // Return data for update seed creation
    return {
      users,
      customers,
      items,
      tunnels,
      mainInventory,
      customerInventories,
      tasks,
      schedules
    };

  } catch (error) {
    console.error('❌ Error checking database:', error);
    throw error;
  }
}

checkDatabase()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
