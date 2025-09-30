import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    // Check if admin user exists
    const adminUser = await prisma.user.findUnique({
      where: { email: 'donl.dl1997@gmail.com' },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        emailVerified: true,
        createdAt: true
      }
    });

    // Count total users
    const userCount = await prisma.user.count();

    return NextResponse.json({
      adminUserExists: !!adminUser,
      adminUser: adminUser,
      totalUsers: userCount,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error checking user:', error);
    return NextResponse.json(
      { 
        error: 'Failed to check user', 
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
