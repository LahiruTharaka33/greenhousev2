import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET - Fetch schedules for the authenticated user
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's customer ID
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { customer: true }
    });

    if (!user || !user.customer) {
      return NextResponse.json({ error: 'No customer account found' }, { status: 404 });
    }

    // Fetch schedules assigned to this customer
    const schedules = await prisma.schedule.findMany({
      where: {
        customerId: user.customer.id
      },
      orderBy: {
        scheduledDate: 'asc',
      },
      include: {
        customer: {
          select: {
            id: true,
            customerId: true,
            customerName: true,
            company: true,
          }
        },
        item: {
          select: {
            id: true,
            itemId: true,
            itemName: true,
            itemCategory: true,
            unit: true,
          }
        },
      },
    });
    
    return NextResponse.json(schedules);
  } catch (error) {
    console.error('Error fetching user schedules:', error);
    return NextResponse.json(
      { error: 'Failed to fetch schedules' },
      { status: 500 }
    );
  }
}
