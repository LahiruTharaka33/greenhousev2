const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  try {
    // Clear existing data (optional - comment out if you want to keep existing data)
    console.log('🧹 Cleaning existing data...');
    await prisma.schedule.deleteMany();
    await prisma.customerInventory.deleteMany();
    await prisma.mainInventory.deleteMany();
    await prisma.task.deleteMany();
    await prisma.tunnel.deleteMany();
    await prisma.item.deleteMany();
    await prisma.customer.deleteMany();
    await prisma.account.deleteMany();
    await prisma.session.deleteMany();
    await prisma.user.deleteMany();

    // Create Users
    console.log('👥 Creating users...');
    const hashedPassword = await bcrypt.hash('password123', 10);
    
    const adminUser = await prisma.user.create({
      data: {
        name: 'Admin User',
        email: 'admin@greenhouse.com',
        password: hashedPassword,
        role: 'admin',
        emailVerified: new Date(),
      },
    });

    const customerUser1 = await prisma.user.create({
      data: {
        name: 'John Smith',
        email: 'john@farmtech.com',
        password: hashedPassword,
        role: 'user',
        emailVerified: new Date(),
      },
    });

    const customerUser2 = await prisma.user.create({
      data: {
        name: 'Sarah Johnson',
        email: 'sarah@greenveg.com',
        password: hashedPassword,
        role: 'user',
        emailVerified: new Date(),
      },
    });

    // Create Items (Fertilizers and other greenhouse items)
    console.log('📦 Creating items...');
    const items = await Promise.all([
      prisma.item.create({
        data: {
          itemId: 'FERT001',
          itemName: 'Nitrogen Fertilizer',
          itemCategory: 'fertilizer',
          unit: 'kg',
        },
      }),
      prisma.item.create({
        data: {
          itemId: 'FERT002',
          itemName: 'Phosphorus Fertilizer',
          itemCategory: 'fertilizer',
          unit: 'kg',
        },
      }),
      prisma.item.create({
        data: {
          itemId: 'FERT003',
          itemName: 'Potassium Fertilizer',
          itemCategory: 'fertilizer',
          unit: 'kg',
        },
      }),
      prisma.item.create({
        data: {
          itemId: 'PEST001',
          itemName: 'Organic Pesticide',
          itemCategory: 'pesticide',
          unit: 'liters',
        },
      }),
      prisma.item.create({
        data: {
          itemId: 'SEED001',
          itemName: 'Tomato Seeds',
          itemCategory: 'seeds',
          unit: 'packets',
        },
      }),
      prisma.item.create({
        data: {
          itemId: 'SEED002',
          itemName: 'Lettuce Seeds',
          itemCategory: 'seeds',
          unit: 'packets',
        },
      }),
      prisma.item.create({
        data: {
          itemId: 'TOOL001',
          itemName: 'pH Meter',
          itemCategory: 'tools',
          unit: 'pieces',
        },
      }),
    ]);

    // Create Main Inventory
    console.log('🏪 Creating main inventory...');
    await Promise.all([
      prisma.mainInventory.create({
        data: {
          itemId: 'FERT001',
          itemName: 'Nitrogen Fertilizer',
          itemType: 'fertilizer',
          quantity: 500,
          description: 'High-grade nitrogen fertilizer for vegetative growth',
        },
      }),
      prisma.mainInventory.create({
        data: {
          itemId: 'FERT002',
          itemName: 'Phosphorus Fertilizer',
          itemType: 'fertilizer',
          quantity: 300,
          description: 'Essential phosphorus for root development',
        },
      }),
      prisma.mainInventory.create({
        data: {
          itemId: 'FERT003',
          itemName: 'Potassium Fertilizer',
          itemType: 'fertilizer',
          quantity: 400,
          description: 'Potassium fertilizer for fruit development',
        },
      }),
      prisma.mainInventory.create({
        data: {
          itemId: 'PEST001',
          itemName: 'Organic Pesticide',
          itemType: 'pesticide',
          quantity: 50,
          description: 'Eco-friendly pest control solution',
        },
      }),
    ]);

    // Create Customers
    console.log('🏢 Creating customers...');
    const customer1 = await prisma.customer.create({
      data: {
        customerId: 'CUST001',
        customerName: 'FarmTech Solutions',
        email: 'contact@farmtech.com',
        phone: '+1-555-0101',
        address: '123 Farm Road, Agriculture Valley, CA 90210',
        company: 'FarmTech Solutions Inc.',
        cultivationName: 'Organic Vegetable Farm',
        cultivationType: 'Hydroponic',
        location: 'California, USA',
        noOfTunnel: 3,
        userId: customerUser1.id,
      },
    });

    const customer2 = await prisma.customer.create({
      data: {
        customerId: 'CUST002',
        customerName: 'Green Vegetables Co.',
        email: 'info@greenveg.com',
        phone: '+1-555-0202',
        address: '456 Green Street, Veggie Town, NY 10001',
        company: 'Green Vegetables Co.',
        cultivationName: 'Premium Leafy Greens',
        cultivationType: 'Soil-based',
        location: 'New York, USA',
        noOfTunnel: 5,
        userId: customerUser2.id,
      },
    });

    // Create Tunnels
    console.log('🏠 Creating tunnels...');
    const tunnels = await Promise.all([
      // Customer 1 tunnels
      prisma.tunnel.create({
        data: {
          tunnelId: 'TUN001',
          tunnelName: 'Tunnel A - Tomatoes',
          description: 'Main tomato production tunnel',
          cultivationType: 'Hydroponic Tomatoes',
          location: 'Section A',
          clientId: 'ESP32_001',
          customerId: customer1.id,
        },
      }),
      prisma.tunnel.create({
        data: {
          tunnelId: 'TUN002',
          tunnelName: 'Tunnel B - Peppers',
          description: 'Bell pepper cultivation tunnel',
          cultivationType: 'Hydroponic Peppers',
          location: 'Section B',
          clientId: 'ESP32_002',
          customerId: customer1.id,
        },
      }),
      prisma.tunnel.create({
        data: {
          tunnelId: 'TUN003',
          tunnelName: 'Tunnel C - Herbs',
          description: 'Herb cultivation tunnel',
          cultivationType: 'Hydroponic Herbs',
          location: 'Section C',
          clientId: 'ESP32_003',
          customerId: customer1.id,
        },
      }),
      // Customer 2 tunnels
      prisma.tunnel.create({
        data: {
          tunnelId: 'TUN004',
          tunnelName: 'Greenhouse 1 - Lettuce',
          description: 'Large lettuce production greenhouse',
          cultivationType: 'Soil-based Lettuce',
          location: 'North Wing',
          clientId: 'ESP32_004',
          customerId: customer2.id,
        },
      }),
      prisma.tunnel.create({
        data: {
          tunnelId: 'TUN005',
          tunnelName: 'Greenhouse 2 - Spinach',
          description: 'Spinach cultivation greenhouse',
          cultivationType: 'Soil-based Spinach',
          location: 'South Wing',
          clientId: 'ESP32_005',
          customerId: customer2.id,
        },
      }),
    ]);

    // Create Customer Inventories
    console.log('📋 Creating customer inventories...');
    await Promise.all([
      // Customer 1 inventory
      prisma.customerInventory.create({
        data: {
          itemId: 'FERT001',
          itemType: 'fertilizer',
          itemName: 'Nitrogen Fertilizer',
          quantity: 50,
          description: 'Allocated nitrogen fertilizer',
          customerId: customer1.id,
        },
      }),
      prisma.customerInventory.create({
        data: {
          itemId: 'FERT002',
          itemType: 'fertilizer',
          itemName: 'Phosphorus Fertilizer',
          quantity: 30,
          description: 'Allocated phosphorus fertilizer',
          customerId: customer1.id,
        },
      }),
      // Customer 2 inventory
      prisma.customerInventory.create({
        data: {
          itemId: 'FERT001',
          itemType: 'fertilizer',
          itemName: 'Nitrogen Fertilizer',
          quantity: 75,
          description: 'Allocated nitrogen fertilizer',
          customerId: customer2.id,
        },
      }),
      prisma.customerInventory.create({
        data: {
          itemId: 'FERT003',
          itemType: 'fertilizer',
          itemName: 'Potassium Fertilizer',
          quantity: 40,
          description: 'Allocated potassium fertilizer',
          customerId: customer2.id,
        },
      }),
    ]);

    // Create Tasks
    console.log('📝 Creating tasks...');
    await Promise.all([
      prisma.task.create({
        data: {
          title: 'Weekly pH Testing',
          description: 'Test pH levels in all hydroponic systems',
          status: 'todo',
          priority: 'high',
          dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
          assignedTo: 'John Smith',
          customerId: customer1.id,
        },
      }),
      prisma.task.create({
        data: {
          title: 'Nutrient Solution Replacement',
          description: 'Replace nutrient solution in Tunnel A',
          status: 'in_progress',
          priority: 'medium',
          dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
          assignedTo: 'John Smith',
          customerId: customer1.id,
        },
      }),
      prisma.task.create({
        data: {
          title: 'Soil Moisture Check',
          description: 'Check soil moisture levels in all greenhouses',
          status: 'todo',
          priority: 'medium',
          dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
          assignedTo: 'Sarah Johnson',
          customerId: customer2.id,
        },
      }),
    ]);

    // Create Schedules
    console.log('📅 Creating schedules...');
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dayAfter = new Date(today);
    dayAfter.setDate(dayAfter.getDate() + 2);

    await Promise.all([
      // Today's schedules
      prisma.schedule.create({
        data: {
          customerId: customer1.id,
          itemId: items[0].id, // Nitrogen Fertilizer
          tunnelId: tunnels[0].id, // Tunnel A
          scheduledDate: today,
          scheduledTime: '08:00',
          quantity: 5,
          notes: 'Morning fertilizer application for tomatoes',
          status: 'pending',
        },
      }),
      prisma.schedule.create({
        data: {
          customerId: customer1.id,
          itemId: items[1].id, // Phosphorus Fertilizer
          tunnelId: tunnels[1].id, // Tunnel B
          scheduledDate: today,
          scheduledTime: '14:00',
          quantity: 3,
          notes: 'Afternoon phosphorus boost for peppers',
          status: 'pending',
        },
      }),
      // Tomorrow's schedules
      prisma.schedule.create({
        data: {
          customerId: customer2.id,
          itemId: items[0].id, // Nitrogen Fertilizer
          tunnelId: tunnels[3].id, // Greenhouse 1
          scheduledDate: tomorrow,
          scheduledTime: '09:00',
          quantity: 8,
          notes: 'Weekly nitrogen application for lettuce',
          status: 'pending',
        },
      }),
      prisma.schedule.create({
        data: {
          customerId: customer1.id,
          itemId: items[2].id, // Potassium Fertilizer
          tunnelId: tunnels[2].id, // Tunnel C
          scheduledDate: dayAfter,
          scheduledTime: '16:00',
          quantity: 4,
          notes: 'Potassium supplement for herb growth',
          status: 'pending',
        },
      }),
    ]);

    console.log('✅ Database seeding completed successfully!');
    console.log('\n📊 Seeded data summary:');
    console.log(`👥 Users: ${await prisma.user.count()}`);
    console.log(`🏢 Customers: ${await prisma.customer.count()}`);
    console.log(`📦 Items: ${await prisma.item.count()}`);
    console.log(`🏪 Main Inventory: ${await prisma.mainInventory.count()}`);
    console.log(`🏠 Tunnels: ${await prisma.tunnel.count()}`);
    console.log(`📋 Customer Inventories: ${await prisma.customerInventory.count()}`);
    console.log(`📝 Tasks: ${await prisma.task.count()}`);
    console.log(`📅 Schedules: ${await prisma.schedule.count()}`);

  } catch (error) {
    console.error('❌ Error during seeding:', error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
