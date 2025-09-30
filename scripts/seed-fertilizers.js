const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function seedFertilizers() {
  try {
    console.log('🌱 Seeding fertilizer items...');

    const fertilizers = [
      {
        itemId: 'FERT-001',
        itemName: 'Nitrogen Fertilizer',
        itemCategory: 'fertilizer',
        unit: 'kg'
      },
      {
        itemId: 'FERT-002',
        itemName: 'Phosphorus Fertilizer',
        itemCategory: 'fertilizer',
        unit: 'kg'
      },
      {
        itemId: 'FERT-003',
        itemName: 'Potassium Fertilizer',
        itemCategory: 'fertilizer',
        unit: 'kg'
      },
      {
        itemId: 'FERT-004',
        itemName: 'NPK Fertilizer (10-10-10)',
        itemCategory: 'fertilizer',
        unit: 'kg'
      },
      {
        itemId: 'FERT-005',
        itemName: 'Calcium Fertilizer',
        itemCategory: 'fertilizer',
        unit: 'kg'
      },
      {
        itemId: 'FERT-006',
        itemName: 'Magnesium Fertilizer',
        itemCategory: 'fertilizer',
        unit: 'kg'
      },
      {
        itemId: 'FERT-007',
        itemName: 'Liquid Fertilizer',
        itemCategory: 'fertilizer',
        unit: 'L'
      }
    ];

    for (const fertilizer of fertilizers) {
      // Check if fertilizer already exists
      const existing = await prisma.item.findUnique({
        where: { itemId: fertilizer.itemId }
      });

      if (!existing) {
        await prisma.item.create({
          data: fertilizer
        });
        console.log(`✅ Created fertilizer: ${fertilizer.itemName}`);
      } else {
        console.log(`⏭️  Fertilizer already exists: ${fertilizer.itemName}`);
      }
    }

    // Also create corresponding main inventory entries
    console.log('📦 Creating main inventory entries...');
    
    for (const fertilizer of fertilizers) {
      const existingInventory = await prisma.mainInventory.findUnique({
        where: { itemId: fertilizer.itemId }
      });

      if (!existingInventory) {
        await prisma.mainInventory.create({
          data: {
            itemId: fertilizer.itemId,
            itemName: fertilizer.itemName,
            itemType: fertilizer.itemCategory,
            quantity: Math.floor(Math.random() * 100) + 10, // Random quantity between 10-110
            description: `Main inventory for ${fertilizer.itemName}`
          }
        });
        console.log(`📦 Created inventory entry for: ${fertilizer.itemName}`);
      }
    }

    console.log('✅ Fertilizer seeding completed!');

  } catch (error) {
    console.error('❌ Error seeding fertilizers:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedFertilizers();
