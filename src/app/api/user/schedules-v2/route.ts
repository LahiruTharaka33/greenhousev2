import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/user/schedules-v2 - Fetch schedules for the logged-in user
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Find the customer associated with this user
    const customer = await prisma.customer.findUnique({
      where: { userId: session.user.id },
      select: { id: true, customerId: true, customerName: true },
    });

    if (!customer) {
      return NextResponse.json(
        { error: 'No customer profile found for this user' },
        { status: 404 }
      );
    }

    // Fetch all schedules for this customer
    const schedules = await prisma.scheduleV2.findMany({
      where: {
        customerId: customer.id,
      },
      orderBy: {
        scheduledDate: 'desc',
      },
      include: {
        tunnel: {
          select: {
            id: true,
            tunnelId: true,
            tunnelName: true,
            description: true,
          },
        },
        fertilizerType: {
          select: {
            id: true,
            itemId: true,
            itemName: true,
            itemCategory: true,
            unit: true,
          },
        },
        releases: {
          select: {
            id: true,
            time: true,
            releaseQuantity: true,
          },
          orderBy: {
            time: 'asc',
          },
        },
      },
    });
    
    return NextResponse.json({
      customer: {
        id: customer.id,
        customerId: customer.customerId,
        customerName: customer.customerName,
      },
      schedules,
    });
  } catch (error) {
    console.error('Error fetching user schedules v2:', error);
    return NextResponse.json(
      { error: 'Failed to fetch schedules' },
      { status: 500 }
    );
  }
}

