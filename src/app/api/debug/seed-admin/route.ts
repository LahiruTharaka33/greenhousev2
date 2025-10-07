import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    // Check if admin user already exists
    const existingAdmin = await prisma.user.findUnique({
      where: { email: 'donl.dl1997@gmail.com' }
    });

    if (existingAdmin) {
      return NextResponse.json({
        message: 'Admin user already exists',
        user: {
          id: existingAdmin.id,
          email: existingAdmin.email,
          name: existingAdmin.name,
          role: existingAdmin.role
        }
      });
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

    return NextResponse.json({
      message: 'Admin user created successfully',
      user: {
        id: adminUser.id,
        email: adminUser.email,
        name: adminUser.name,
        role: adminUser.role
      }
    });

  } catch (error) {
    console.error('Error seeding admin user:', error);
    return NextResponse.json(
      { 
        error: 'Failed to create admin user', 
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
