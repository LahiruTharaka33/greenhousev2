import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import scheduleV2Publisher from '@/lib/scheduleV2Publisher';

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

    // Fetch tank configuration for the selected tunnel to determine fertilizer mapping
    let mqttPublishResult = null;
    const warnings: string[] = [];
    
    try {
      console.log('Fetching tank configuration for tunnel:', tunnelId);
      
      // Get tank configurations for this tunnel
      const tankConfigs = await prisma.tankConfiguration.findMany({
        where: { tunnelId: tunnelId },
        include: { item: true }
      });

      // Find which tank contains the selected fertilizer
      let fertilizerTank: string | null = null;
      for (const config of tankConfigs) {
        if (config.itemId === fertilizerTypeId) {
          fertilizerTank = config.tankName; // "Tank A", "Tank B", or "Tank C"
          console.log(`Found fertilizer in ${fertilizerTank}`);
          break;
        }
      }

      // Warn if fertilizer is not configured in any tank
      if (!fertilizerTank) {
        const warningMsg = `Warning: Selected fertilizer "${schedule.fertilizerType.itemName}" is not configured in any tank for tunnel "${schedule.tunnel.tunnelName}". Please configure it in the Configuration page.`;
        warnings.push(warningMsg);
        console.warn(warningMsg);
      }

      // Build MQTT topic data based on tank mapping
      const topicData = {
        fertilizer_1: fertilizerTank === "Tank A" ? parseFloat(quantity) : 0,
        fertilizer_2: fertilizerTank === "Tank B" ? parseFloat(quantity) : 0,
        fertilizer_3: fertilizerTank === "Tank C" ? parseFloat(quantity) : 0,
        water_volume: parseFloat(water),
        schedule_time1: releases && releases[0] ? releases[0].time : "",
        schedule_volume1: releases && releases[0] ? parseFloat(releases[0].releaseQuantity) : 0,
        schedule_time2: releases && releases[1] ? releases[1].time : "",
        schedule_volume2: releases && releases[1] ? parseFloat(releases[1].releaseQuantity) : 0,
        schedule_time3: releases && releases[2] ? releases[2].time : "",
        schedule_volume3: releases && releases[2] ? parseFloat(releases[2].releaseQuantity) : 0,
      };

      console.log('Publishing ScheduleV2 to ESP32 with topic data:', topicData);

      // Publish to MQTT using the new ScheduleV2 publisher
      mqttPublishResult = await scheduleV2Publisher.publishScheduleV2(topicData, warnings);
      
      console.log('MQTT publishing completed:', {
        success: mqttPublishResult.overallSuccess,
        totalTopics: mqttPublishResult.totalTopics,
        warnings: mqttPublishResult.warnings?.length || 0
      });
    } catch (mqttError) {
      console.error('Error publishing schedule to MQTT:', mqttError);
      // Don't fail the entire request if MQTT publishing fails
      mqttPublishResult = {
        totalTopics: 0,
        publishResults: [],
        overallSuccess: false,
        timestamp: new Date().toISOString(),
        warnings,
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
