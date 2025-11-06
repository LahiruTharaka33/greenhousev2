import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import scheduleV2Publisher from '@/lib/scheduleV2Publisher';

/**
 * Cron Job Handler for Publishing Schedules
 * Called daily at 12:00 PM UTC to publish schedules for the current date
 * 
 * This endpoint is triggered by GitHub Actions and sends schedule data to ESP32 devices via MQTT
 */
export async function GET(request: NextRequest) {
  try {
    // Verify this is a legitimate cron request from Vercel
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    
    // TEMPORARILY DISABLED FOR TESTING - RE-ENABLE AFTER TESTING!
    // In production, verify the cron secret
    // if (process.env.NODE_ENV === 'production' && cronSecret) {
    //   if (authHeader !== `Bearer ${cronSecret}`) {
    //     console.error('Unauthorized cron request - invalid secret');
    //     return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    //   }
    // }
    
    console.log('⚠️ WARNING: Auth check is disabled for testing!');

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

        // Use the new tank-mapping publisher
        const mqttResult = await scheduleV2Publisher.publishScheduleV2WithTankMapping(
          schedule.tunnelId,
          schedule.fertilizerTypeId,
          schedule.fertilizerType.itemName,
          parseFloat(schedule.quantity.toString()),
          parseFloat(schedule.water.toString()),
          schedule.releases || []
        );

        // Log warnings if any
        if (mqttResult.warnings && mqttResult.warnings.length > 0) {
          console.warn(`⚠️ Warnings for schedule ${schedule.id}:`, mqttResult.warnings);
        }

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

          const errorMsg = mqttResult.warnings && mqttResult.warnings.length > 0 
            ? mqttResult.warnings[0] 
            : 'MQTT publishing failed';

          results.failed.push({
            scheduleId: schedule.id,
            error: errorMsg
          });
          console.error(`❌ Failed to publish schedule ${schedule.id}: ${errorMsg}`);
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

