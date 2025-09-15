import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/schedules - Fetch all schedules
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const schedules = await prisma.schedule.findMany({
      orderBy: {
        scheduledDate: 'desc',
      },
      include: {
        customer: {
          select: {
            id: true,
            customerId: true,
            customerName: true,
            company: true,
          },
        },
        item: {
          select: {
            id: true,
            itemId: true,
            itemName: true,
            itemCategory: true,
          },
        },
        tunnel: {
          select: {
            id: true,
            tunnelId: true,
            tunnelName: true,
            description: true,
          },
        },
      },
    });
    
    return NextResponse.json(schedules);
  } catch (error) {
    console.error('Error fetching schedules:', error);
    return NextResponse.json(
      { error: 'Failed to fetch schedules' },
      { status: 500 }
    );
  }
}

// POST /api/schedules - Create new schedule
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { customerId, itemId, tunnelId, scheduledDate, scheduledTime, quantity, notes } = body;

    // Validate required fields
    if (!customerId || !itemId || !scheduledDate || !scheduledTime) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Verify that the customer exists
    const customerExists = await prisma.customer.findUnique({
      where: { id: customerId },
    });

    if (!customerExists) {
      return NextResponse.json(
        { error: 'Selected customer does not exist' },
        { status: 400 }
      );
    }

    // Verify that the item exists
    const itemExists = await prisma.item.findUnique({
      where: { id: itemId },
    });

    if (!itemExists) {
      return NextResponse.json(
        { error: 'Selected item does not exist' },
        { status: 400 }
      );
    }

    // If tunnelId is provided, verify it exists and belongs to the customer
    if (tunnelId) {
      const tunnelExists = await prisma.tunnel.findFirst({
        where: { 
          id: tunnelId,
          customerId: customerId,
        },
      });

      if (!tunnelExists) {
        return NextResponse.json(
          { error: 'Selected tunnel does not exist or does not belong to the customer' },
          { status: 400 }
        );
      }
    }

    const schedule = await prisma.schedule.create({
      data: {
        customerId,
        itemId,
        tunnelId: tunnelId || null,
        scheduledDate: new Date(scheduledDate),
        scheduledTime,
        quantity: quantity || 1,
        notes: notes || '',
        status: 'pending'
      },
      include: {
        customer: {
          select: {
            id: true,
            customerId: true,
            customerName: true,
            company: true,
          },
        },
        item: {
          select: {
            id: true,
            itemId: true,
            itemName: true,
            itemCategory: true,
          },
        },
        tunnel: {
          select: {
            id: true,
            tunnelId: true,
            tunnelName: true,
            description: true,
          },
        },
      },
    });

    return NextResponse.json(schedule, { status: 201 });
  } catch (error) {
    console.error('Error creating schedule:', error);
    return NextResponse.json(
      { error: 'Failed to create schedule' },
      { status: 500 }
    );
  }
}
