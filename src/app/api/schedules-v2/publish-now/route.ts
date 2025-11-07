import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import scheduleV2Publisher from '@/lib/scheduleV2Publisher';

// POST /api/schedules-v2/publish-now - Create new schedule and publish immediately to ESP32
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || (session.user.role !== 'admin' && session.user.role !== 'user')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { customerId, tunnelId, scheduledDate, fertilizerTypeId, quantity, water, notes, releases } = body;

    // Validate required fields
    if (!customerId || !tunnelId || !scheduledDate || !fertilizerTypeId || !quantity || !water) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate releases if provided
    if (releases && Array.isArray(releases)) {
      const totalReleaseQuantity = releases.reduce((sum, release) => {
        return sum + (parseFloat(release.releaseQuantity) || 0);
      }, 0);
      
      if (totalReleaseQuantity > parseFloat(water)) {
        return NextResponse.json(
          { error: `Total release quantity (${totalReleaseQuantity}L) cannot exceed water amount (${water}L)` },
          { status: 400 }
        );
      }
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

    // Verify that the tunnel exists and belongs to the customer
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

    // Verify that the fertilizer type exists
    const fertilizerExists = await prisma.item.findUnique({
      where: { id: fertilizerTypeId },
    });

    if (!fertilizerExists) {
      return NextResponse.json(
        { error: 'Selected fertilizer type does not exist' },
        { status: 400 }
      );
    }

    // CRITICAL VALIDATION: Check if this fertilizer is configured in a tank for this tunnel
    const tankWithFertilizer = await prisma.tankConfiguration.findFirst({
      where: {
        tunnelId,
        itemType: 'fertilizer',
        itemId: fertilizerTypeId
      },
      select: {
        tankName: true
      }
    });

    if (!tankWithFertilizer) {
      return NextResponse.json(
        { 
          error: `Fertilizer "${fertilizerExists.itemName}" is not configured in any tank for this tunnel. Please configure it in the Configuration page first.`,
          fertilizerName: fertilizerExists.itemName
        },
        { status: 400 }
      );
    }

    // Create the schedule with status 'pending' initially
    const schedule = await prisma.scheduleV2.create({
      data: {
        customerId,
        tunnelId,
        scheduledDate: new Date(scheduledDate),
        fertilizerTypeId,
        quantity: parseFloat(quantity),
        water: parseFloat(water),
        notes: notes || '',
        status: 'pending',
        releases: releases && Array.isArray(releases) ? {
          create: releases.map((release: any) => ({
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
        },
      },
    });

    console.log('Schedule created successfully. Publishing immediately to ESP32...');

    // Use the new tank-mapping publisher
    const mqttResult = await scheduleV2Publisher.publishScheduleV2WithTankMapping(
      schedule.tunnelId,
      schedule.fertilizerTypeId,
      schedule.fertilizerType.itemName,
      parseFloat(schedule.quantity.toString()),
      parseFloat(schedule.water.toString()),
      schedule.releases || []
    );

    if (mqttResult.overallSuccess) {
      // Update schedule status to sent
      const updatedSchedule = await prisma.scheduleV2.update({
        where: { id: schedule.id },
        data: { status: 'sent' },
        include: {
          customer: {
            select: {
              id: true,
              customerId: true,
              customerName: true,
              company: true,
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
          },
        },
      });

      console.log(`✅ Successfully published schedule ${schedule.id} to ESP32`);

      return NextResponse.json({ 
        schedule: updatedSchedule,
        publishResult: {
          success: true,
          warnings: mqttResult.warnings || [],
          mqttSummary: mqttResult
        }
      }, { status: 201 });
    } else {
      // Update schedule status to failed
      const updatedSchedule = await prisma.scheduleV2.update({
        where: { id: schedule.id },
        data: { status: 'failed' },
        include: {
          customer: {
            select: {
              id: true,
              customerId: true,
              customerName: true,
              company: true,
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
          },
        },
      });

      console.error(`❌ Failed to publish schedule ${schedule.id} to ESP32`);

      return NextResponse.json(
        { 
          error: 'Schedule created but failed to publish to ESP32',
          schedule: updatedSchedule,
          publishResult: {
            success: false,
            warnings: mqttResult.warnings || [],
            mqttSummary: mqttResult
          }
        },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Error creating and publishing schedule:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined
    });
    return NextResponse.json(
      { 
        error: 'Failed to create and publish schedule',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

