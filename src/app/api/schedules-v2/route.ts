import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import schedulePublisher, { ScheduleData } from '@/lib/schedulePublisher';

// GET /api/schedules-v2 - Fetch all schedules
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const schedules = await prisma.scheduleV2.findMany({
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
    
    return NextResponse.json(schedules);
  } catch (error) {
    console.error('Error fetching schedules v2:', error);
    return NextResponse.json(
      { error: 'Failed to fetch schedules' },
      { status: 500 }
    );
  }
}

// POST /api/schedules-v2 - Create new schedule
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

    // Publish to MQTT (ESP32) after successful creation
    let mqttPublishResult = null;
    try {
      console.log('Publishing schedule to ESP32...');
      
      // Convert schedule to ScheduleData format for MQTT
      const scheduleDataForMQTT: ScheduleData[] = [{
        id: schedule.id,
        scheduledDate: schedule.scheduledDate,
        scheduledTime: '08:00', // Default time since we don't have time in new schema
        quantity: Number(schedule.quantity),
        item: {
          itemName: schedule.fertilizerType.itemName,
          itemCategory: schedule.fertilizerType.itemCategory,
        },
        customer: {
          customerName: schedule.customer.customerName,
        },
        tunnel: {
          tunnelName: schedule.tunnel.tunnelName,
        },
      }];

      // Publish to MQTT
      mqttPublishResult = await schedulePublisher.publishSchedules(scheduleDataForMQTT);
      
      console.log('MQTT publishing completed:', {
        success: mqttPublishResult.overallSuccess,
        uniqueDates: mqttPublishResult.uniqueDates,
        totalSchedules: mqttPublishResult.totalSchedules
      });
    } catch (mqttError) {
      console.error('Error publishing schedule to MQTT:', mqttError);
      // Don't fail the entire request if MQTT publishing fails
      mqttPublishResult = {
        totalSchedules: 1,
        uniqueDates: 0,
        publishResults: [],
        overallSuccess: false,
        timestamp: new Date().toISOString(),
        error: mqttError instanceof Error ? mqttError.message : 'Unknown MQTT error'
      };
    }

    // Prepare response with MQTT results
    const responseData = {
      schedule,
      mqttPublish: mqttPublishResult
    };

    return NextResponse.json(responseData, { status: 201 });
  } catch (error) {
    console.error('Error creating schedule v2:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined
    });
    return NextResponse.json(
      { 
        error: 'Failed to create schedule',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
