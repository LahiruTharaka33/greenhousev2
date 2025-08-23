const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function seedAdmin() {
  try {
    // Check if admin user already exists
    const existingAdmin = await prisma.user.findUnique({
      where: { email: 'donl.dl1997@gmail.com' }
    });

    if (existingAdmin) {
      console.log('Admin user already exists');
      return;
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash('LAhiru1234', 12);

    // Create admin user
    const adminUser = await prisma.user.create({
      data: {
        email: 'donl.dl1997@gmail.com',
        name: 'lahiru',
        password: hashedPassword,
        role: 'admin',
        emailVerified: new Date(),
      }
    });

    console.log('Admin user created successfully:', adminUser.email);
  } catch (error) {
    console.error('Error seeding admin user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedAdmin();