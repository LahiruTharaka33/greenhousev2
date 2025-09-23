import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    // Check authentication and admin privileges
    const session = await getServerSession();
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Check if user is admin (you may need to adjust this based on your auth setup)
    const user = await prisma.user.findUnique({
      where: { email: session.user.email! },
      select: { role: true }
    });

    if (user?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Admin privileges required' },
        { status: 403 }
      );
    }

    // Fetch all tunnels with customer information
    const tunnels = await prisma.tunnel.findMany({
      include: {
        customer: {
          select: {
            customerName: true,
            customerId: true
          }
        }
      },
      orderBy: [
        { customer: { customerName: 'asc' } },
        { tunnelName: 'asc' }
      ]
    });

    return NextResponse.json({
      success: true,
      tunnels,
      count: tunnels.length
    });

  } catch (error) {
    console.error('Error fetching tunnels:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
