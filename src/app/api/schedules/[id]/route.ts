import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET /api/schedules/[id] - Fetch specific schedule
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const schedule = await prisma.schedule.findUnique({
      where: { id: params.id },
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
        }
      }
    });

    if (!schedule) {
      return NextResponse.json({ error: 'Schedule not found' }, { status: 404 });
    }

    return NextResponse.json(schedule);
  } catch (error) {
    console.error('Error fetching schedule:', error);
    return NextResponse.json({ error: 'Failed to fetch schedule' }, { status: 500 });
  }
}

// PUT /api/schedules/[id] - Update schedule
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { customerId, itemId, scheduledDate, scheduledTime, quantity, notes, status } = body;

    // Check if schedule exists
    const existingSchedule = await prisma.schedule.findUnique({
      where: { id: params.id }
    });

    if (!existingSchedule) {
      return NextResponse.json({ error: 'Schedule not found' }, { status: 404 });
    }

    // Update schedule
    const updatedSchedule = await prisma.schedule.update({
      where: { id: params.id },
      data: {
        customerId: customerId || existingSchedule.customerId,
        itemId: itemId || existingSchedule.itemId,
        scheduledDate: scheduledDate ? new Date(scheduledDate) : existingSchedule.scheduledDate,
        scheduledTime: scheduledTime || existingSchedule.scheduledTime,
        quantity: quantity || existingSchedule.quantity,
        notes: notes !== undefined ? notes : existingSchedule.notes,
        status: status || existingSchedule.status,
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
        }
      }
    });

    return NextResponse.json(updatedSchedule);
  } catch (error) {
    console.error('Error updating schedule:', error);
    return NextResponse.json({ error: 'Failed to update schedule' }, { status: 500 });
  }
}

// DELETE /api/schedules/[id] - Delete schedule
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if schedule exists
    const existingSchedule = await prisma.schedule.findUnique({
      where: { id: params.id }
    });

    if (!existingSchedule) {
      return NextResponse.json({ error: 'Schedule not found' }, { status: 404 });
    }

    // Delete schedule
    await prisma.schedule.delete({
      where: { id: params.id }
    });

    return NextResponse.json({ message: 'Schedule deleted successfully' });
  } catch (error) {
    console.error('Error deleting schedule:', error);
    return NextResponse.json({ error: 'Failed to delete schedule' }, { status: 500 });
  }
}

