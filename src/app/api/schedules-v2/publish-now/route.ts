import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import scheduleV2Publisher from '@/lib/scheduleV2Publisher';

// POST /api/schedules-v2/publish-now - Create new schedule and publish immediately to ESP32
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'admin') {
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

    // Fetch tank configuration for the tunnel
    const tankConfigs = await prisma.tankConfiguration.findMany({
      where: { tunnelId: schedule.tunnelId },
      include: { item: true }
    });

    // Find which tank contains the selected fertilizer
    let fertilizerTank: string | null = null;
    for (const config of tankConfigs) {
      if (config.itemId === schedule.fertilizerTypeId) {
        fertilizerTank = config.tankName; // "Tank A", "Tank B", or "Tank C"
        console.log(`Found fertilizer "${schedule.fertilizerType.itemName}" in ${fertilizerTank}`);
        break;
      }
    }

    // Build warnings
    const warnings: string[] = [];
    if (!fertilizerTank) {
      const warningMsg = `Warning: Fertilizer "${schedule.fertilizerType.itemName}" is not configured in any tank for tunnel "${schedule.tunnel.tunnelName}"`;
      warnings.push(warningMsg);
      console.warn(warningMsg);
    }

    // Build MQTT topic data based on tank mapping
    const topicData = {
      fertilizer_1: fertilizerTank === "Tank A" ? parseFloat(schedule.quantity.toString()) : 0,
      fertilizer_2: fertilizerTank === "Tank B" ? parseFloat(schedule.quantity.toString()) : 0,
      fertilizer_3: fertilizerTank === "Tank C" ? parseFloat(schedule.quantity.toString()) : 0,
      water_volume: parseFloat(schedule.water.toString()),
      schedule_time1: schedule.releases && schedule.releases[0] ? schedule.releases[0].time : "",
      schedule_volume1: schedule.releases && schedule.releases[0] ? parseFloat(schedule.releases[0].releaseQuantity.toString()) : 0,
      schedule_time2: schedule.releases && schedule.releases[1] ? schedule.releases[1].time : "",
      schedule_volume2: schedule.releases && schedule.releases[1] ? parseFloat(schedule.releases[1].releaseQuantity.toString()) : 0,
      schedule_time3: schedule.releases && schedule.releases[2] ? schedule.releases[2].time : "",
      schedule_volume3: schedule.releases && schedule.releases[2] ? parseFloat(schedule.releases[2].releaseQuantity.toString()) : 0,
    };

    console.log(`Publishing schedule ${schedule.id} to MQTT:`, topicData);

    // Publish to MQTT
    const mqttResult = await scheduleV2Publisher.publishScheduleV2(topicData, warnings);

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
          warnings,
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
            warnings,
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

