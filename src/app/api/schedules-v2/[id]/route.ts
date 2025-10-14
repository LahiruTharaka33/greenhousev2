import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/schedules-v2/[id] - Fetch specific schedule
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const schedule = await prisma.scheduleV2.findUnique({
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
        tunnel: {
          select: {
            id: true,
            tunnelId: true,
            tunnelName: true,
            description: true,
          }
        },
        fertilizerType: {
          select: {
            id: true,
            itemId: true,
            itemName: true,
            itemCategory: true,
            unit: true,
          }
        },
        releases: {
          select: {
            id: true,
            time: true,
            releaseQuantity: true,
          },
        }
      }
    });

    if (!schedule) {
      return NextResponse.json({ error: 'Schedule not found' }, { status: 404 });
    }

    return NextResponse.json(schedule);
  } catch (error) {
    console.error('Error fetching schedule v2:', error);
    return NextResponse.json({ error: 'Failed to fetch schedule' }, { status: 500 });
  }
}

// PUT /api/schedules-v2/[id] - Update schedule
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
    const { customerId, tunnelId, scheduledDate, fertilizerTypeId, quantity, water, notes, status, releases } = body;

    // Check if schedule exists
    const existingSchedule = await prisma.scheduleV2.findUnique({
      where: { id: params.id }
    });

    if (!existingSchedule) {
      return NextResponse.json({ error: 'Schedule not found' }, { status: 404 });
    }

    // Validate releases if provided
    if (releases && Array.isArray(releases)) {
      const totalReleaseQuantity = releases.reduce((sum, release) => {
        return sum + (parseFloat(release.releaseQuantity) || 0);
      }, 0);
      
      const waterAmount = parseFloat(water || existingSchedule.water.toString());
      if (totalReleaseQuantity > waterAmount) {
        return NextResponse.json(
          { error: `Total release quantity (${totalReleaseQuantity}L) cannot exceed water amount (${waterAmount}L)` },
          { status: 400 }
        );
      }
    }

    // Update schedule with releases
    const updatedSchedule = await prisma.scheduleV2.update({
      where: { id: params.id },
      data: {
        customerId: customerId || existingSchedule.customerId,
        tunnelId: tunnelId || existingSchedule.tunnelId,
        scheduledDate: scheduledDate ? new Date(scheduledDate) : existingSchedule.scheduledDate,
        fertilizerTypeId: fertilizerTypeId || existingSchedule.fertilizerTypeId,
        quantity: quantity !== undefined ? parseFloat(quantity) : existingSchedule.quantity,
        water: water !== undefined ? parseFloat(water) : existingSchedule.water,
        notes: notes !== undefined ? notes : existingSchedule.notes,
        status: status || existingSchedule.status,
        // Handle releases update
        releases: releases && Array.isArray(releases) ? {
          deleteMany: {}, // Delete all existing releases
          create: releases.filter(release => release.time && release.releaseQuantity > 0).map((release: any) => ({
            time: release.time,
            releaseQuantity: parseFloat(release.releaseQuantity)
          }))
        } : undefined
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
        tunnel: {
          select: {
            id: true,
            tunnelId: true,
            tunnelName: true,
            description: true,
          }
        },
        fertilizerType: {
          select: {
            id: true,
            itemId: true,
            itemName: true,
            itemCategory: true,
            unit: true,
          }
        },
        releases: {
          select: {
            id: true,
            time: true,
            releaseQuantity: true,
          },
        }
      }
    });

    return NextResponse.json(updatedSchedule);
  } catch (error) {
    console.error('Error updating schedule v2:', error);
    return NextResponse.json({ error: 'Failed to update schedule' }, { status: 500 });
  }
}

// DELETE /api/schedules-v2/[id] - Delete schedule
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
    const existingSchedule = await prisma.scheduleV2.findUnique({
      where: { id: params.id }
    });

    if (!existingSchedule) {
      return NextResponse.json({ error: 'Schedule not found' }, { status: 404 });
    }

    // Delete schedule
    await prisma.scheduleV2.delete({
      where: { id: params.id }
    });

    return NextResponse.json({ message: 'Schedule deleted successfully' });
  } catch (error) {
    console.error('Error deleting schedule v2:', error);
    return NextResponse.json({ error: 'Failed to delete schedule' }, { status: 500 });
  }
}
