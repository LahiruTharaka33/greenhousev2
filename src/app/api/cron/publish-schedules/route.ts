import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import scheduleV2Publisher from '@/lib/scheduleV2Publisher';

/**
 * Cron Job Handler for Publishing Schedules
 * Called daily at 10:55 AM UTC to publish schedules for the current date
 * 
 * This endpoint is triggered by Vercel Cron and sends schedule data to ESP32 devices via MQTT
 */
export async function GET(request: NextRequest) {
  try {
    // Verify this is a legitimate cron request from Vercel
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    
    // In production, verify the cron secret
    if (process.env.NODE_ENV === 'production' && cronSecret) {
      if (authHeader !== `Bearer ${cronSecret}`) {
        console.error('Unauthorized cron request - invalid secret');
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    console.log('🕐 Cron job started: Publishing schedules for today...');
    
    // Get current date (start and end of day in UTC)
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    console.log('Querying schedules for date range:', {
      start: startOfDay.toISOString(),
      end: endOfDay.toISOString()
    });

    // Query all pending schedules for today
    const schedulesToPublish = await prisma.scheduleV2.findMany({
      where: {
        scheduledDate: {
          gte: startOfDay,
          lte: endOfDay
        },
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

    console.log(`Found ${schedulesToPublish.length} schedules to publish for today`);

    if (schedulesToPublish.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No schedules to publish for today',
        publishedCount: 0,
        failedCount: 0,
        timestamp: new Date().toISOString()
      });
    }

    // Track results
    const results = {
      published: [] as string[],
      failed: [] as { scheduleId: string; error: string }[],
    };

    // Process each schedule
    for (const schedule of schedulesToPublish) {
      try {
        console.log(`Processing schedule ${schedule.id} for ${schedule.customer.customerName} - ${schedule.tunnel.tunnelName}`);

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
          await prisma.scheduleV2.update({
            where: { id: schedule.id },
            data: { status: 'sent' }
          });

          results.published.push(schedule.id);
          console.log(`✅ Successfully published schedule ${schedule.id}`);
        } else {
          // Update schedule status to failed
          await prisma.scheduleV2.update({
            where: { id: schedule.id },
            data: { status: 'failed' }
          });

          results.failed.push({
            scheduleId: schedule.id,
            error: 'MQTT publishing failed'
          });
          console.error(`❌ Failed to publish schedule ${schedule.id} - status updated to failed`);
        }

      } catch (error) {
        console.error(`Error processing schedule ${schedule.id}:`, error);
        
        // Update schedule status to failed
        try {
          await prisma.scheduleV2.update({
            where: { id: schedule.id },
            data: { status: 'failed' }
          });
        } catch (updateError) {
          console.error(`Failed to update status for schedule ${schedule.id}:`, updateError);
        }
        
        results.failed.push({
          scheduleId: schedule.id,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    // Log summary
    console.log('🎉 Cron job completed:', {
      total: schedulesToPublish.length,
      published: results.published.length,
      failed: results.failed.length
    });

    return NextResponse.json({
      success: true,
      message: `Published ${results.published.length} of ${schedulesToPublish.length} schedules`,
      publishedCount: results.published.length,
      failedCount: results.failed.length,
      publishedSchedules: results.published,
      failedSchedules: results.failed,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Fatal error in cron job:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to process cron job',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

