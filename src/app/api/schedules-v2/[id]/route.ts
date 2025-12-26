import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import scheduleV2Resubscriber from '@/lib/scheduleV2Resubscriber';

// GET /api/schedules-v2/[id] - Fetch specific schedule
export async function GET(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params;
  try {
    const session = await getServerSession(authOptions);

    if (!session || (session.user.role !== 'admin' && session.user.role !== 'user')) {
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
            cancelled: true,
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
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params;
  try {
    const session = await getServerSession(authOptions);

    if (!session || (session.user.role !== 'admin' && session.user.role !== 'user')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { customerId, tunnelId, scheduledDate, fertilizerTypeId, quantity, water, notes, status, releases } = body;

    // Check if schedule exists
    const existingSchedule = await prisma.scheduleV2.findUnique({
      where: { id: params.id },
      include: {
        releases: {
          select: {
            id: true,
            time: true,
            releaseQuantity: true,
            cancelled: true,
          }
        }
      }
    });

    if (!existingSchedule) {
      return NextResponse.json({ error: 'Schedule not found' }, { status: 404 });
    }

    // Validate edit permissions based on status
    // Sent and cancelled schedules can only have their releases edited
    if (existingSchedule.status === 'sent' || existingSchedule.status === 'cancelled') {
      // Check if any non-release fields are being modified
      const isModifyingRestrictedFields =
        (customerId && customerId !== existingSchedule.customerId) ||
        (tunnelId && tunnelId !== existingSchedule.tunnelId) ||
        (scheduledDate && new Date(scheduledDate).getTime() !== existingSchedule.scheduledDate.getTime()) ||
        (fertilizerTypeId && fertilizerTypeId !== existingSchedule.fertilizerTypeId) ||
        (quantity !== undefined && parseFloat(quantity) !== parseFloat(existingSchedule.quantity.toString())) ||
        (water !== undefined && parseFloat(water) !== parseFloat(existingSchedule.water.toString())) ||
        (notes !== undefined && notes !== existingSchedule.notes) ||
        (status && status !== existingSchedule.status);

      if (isModifyingRestrictedFields) {
        return NextResponse.json(
          {
            error: 'Cannot modify schedule details for sent/cancelled schedules. Only release schedules can be edited.',
            allowedFields: ['releases'],
            currentStatus: existingSchedule.status
          },
          { status: 403 }
        );
      }
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
        // Handle releases update using update/create/delete strategy
        releases: releases && Array.isArray(releases) ? {
          // 1. Delete releases that are not in the new list (if they have IDs)
          deleteMany: {
            id: {
              notIn: releases
                .filter((r: any) => r.id)
                .map((r: any) => r.id)
            }
          },
          // 2. Update existing releases
          update: releases
            .filter((r: any) => r.id && r.time && r.releaseQuantity > 0)
            .map((r: any) => ({
              where: { id: r.id },
              data: {
                time: r.time,
                releaseQuantity: parseFloat(r.releaseQuantity),
                cancelled: r.cancelled
              }
            })),
          // 3. Create new releases (no ID)
          create: releases
            .filter((r: any) => !r.id && r.time && r.releaseQuantity > 0)
            .map((r: any) => ({
              time: r.time,
              releaseQuantity: parseFloat(r.releaseQuantity),
              cancelled: r.cancelled || false
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
            cancelled: true,
          },
        }
      }
    })

    // MQTT Resubscription Logic for Sent Schedules
    // If this is a sent schedule and releases were modified, resubscribe to the relevant topics
    let resubscribeResult = null;
    if (existingSchedule.status === 'sent' && releases && Array.isArray(releases)) {
      try {
        console.log('📡 Sent schedule releases were modified, initiating MQTT resubscription...');

        // Get the tunnel's waterClientId
        const tunnelInfo = await prisma.tunnel.findUnique({
          where: { id: updatedSchedule.tunnelId },
          select: { clientId: true }
        });

        if (tunnelInfo?.clientId) {
          const waterClientId = tunnelInfo.clientId;

          // Detect which release slots were modified
          const releaseChanges = scheduleV2Resubscriber.detectReleaseChanges(
            existingSchedule.releases || [],
            releases
          );

          if (releaseChanges.length > 0) {
            console.log(`📡 Detected ${releaseChanges.length} release slot(s) modified:`, releaseChanges);

            // Resubscribe to the modified release topics
            resubscribeResult = await scheduleV2Resubscriber.resubscribeToModifiedReleases(
              waterClientId,
              releaseChanges
            );

            if (resubscribeResult.success) {
              console.log(`✅ Successfully resubscribed to ${resubscribeResult.subscribedTopics.length} topic(s)`);
            } else {
              console.warn(`⚠️ Resubscription completed with errors:`, resubscribeResult.errors);
            }
          } else {
            console.log('📡 No release changes detected, skipping resubscription');
          }
        } else {
          console.warn('⚠️ Could not find waterClientId for tunnel, skipping resubscription');
        }
      } catch (error) {
        console.error('❌ Error during MQTT resubscription:', error);
        // Don't fail the entire request if resubscription fails
      }
    }

    return NextResponse.json(updatedSchedule);
  } catch (error) {
    console.error('Error updating schedule v2:', error);
    return NextResponse.json({ error: 'Failed to update schedule' }, { status: 500 });
  }
}

// DELETE /api/schedules-v2/[id] - Delete schedule
export async function DELETE(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params;
  try {
    const session = await getServerSession(authOptions);

    if (!session || (session.user.role !== 'admin' && session.user.role !== 'user')) {
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
