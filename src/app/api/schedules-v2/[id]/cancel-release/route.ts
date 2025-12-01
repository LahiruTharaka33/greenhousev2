import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import mqttService from '@/lib/mqtt';
import { prisma } from '@/lib/prisma';

// POST /api/schedules-v2/[id]/cancel-release - Cancel a specific release by sending volume 0
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || (session.user.role !== 'admin' && session.user.role !== 'user')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { releaseIndex } = await request.json();
    const { id: scheduleId } = await params;

    // Validate releaseIndex (0, 1, or 2 for Release 1, 2, 3)
    if (releaseIndex === undefined || releaseIndex < 0 || releaseIndex > 2) {
      return NextResponse.json(
        { error: 'Invalid release index. Must be 0, 1, or 2' },
        { status: 400 }
      );
    }

    // Verify schedule exists and get tunnel info
    const schedule = await prisma.scheduleV2.findUnique({
      where: { id: scheduleId },
      include: {
        releases: {
          orderBy: { time: 'asc' }
        },
        tunnel: {
          select: {
            clientId: true
          }
        }
      }
    });

    if (!schedule) {
      return NextResponse.json(
        { error: 'Schedule not found' },
        { status: 404 }
      );
    }

    // Get the water control value (clientId) from the tunnel
    const waterControlValue = schedule.tunnel?.clientId;
    if (!waterControlValue) {
      return NextResponse.json(
        { error: 'Water control value not found for this tunnel. Please configure it in the Configuration page.' },
        { status: 400 }
      );
    }

    if (!schedule) {
      return NextResponse.json(
        { error: 'Schedule not found' },
        { status: 404 }
      );
    }

    // Verify the release exists at this index
    if (!schedule.releases || !schedule.releases[releaseIndex]) {
      return NextResponse.json(
        { error: `Release ${releaseIndex + 1} does not exist in this schedule` },
        { status: 400 }
      );
    }

    // Map releaseIndex to MQTT topics (both volume and time)
    const volumeTopicMap: { [key: number]: string } = {
      0: 'schedule_volume1',
      1: 'schedule_volume2',
      2: 'schedule_volume3'
    };

    const timeTopicMap: { [key: number]: string } = {
      0: 'schedule_time1',
      1: 'schedule_time2',
      2: 'schedule_time3'
    };

    // Prepend water control value to the topic names
    const volumeTopic = `${waterControlValue}/${volumeTopicMap[releaseIndex]}`;
    const timeTopic = `${waterControlValue}/${timeTopicMap[releaseIndex]}`;
    
    console.log(`🚫 Cancelling Release ${releaseIndex + 1} for schedule ${scheduleId}`);
    console.log(`   Water Control Value: ${waterControlValue}`);
    console.log(`   Release details:`, schedule.releases[releaseIndex]);
    console.log(`   MQTT Topics - Volume: ${volumeTopic}, Time: ${timeTopic}`);

    // Ensure MQTT connection
    if (!mqttService.getConnectionStatus()) {
      console.log('MQTT not connected, attempting to connect...');
      const connected = await mqttService.connect();
      if (!connected) {
        return NextResponse.json(
          { error: 'Failed to connect to MQTT broker' },
          { status: 500 }
        );
      }
    }

    // Publish "0" to volume topic and "null" to time topic to completely cancel the release
    const volumeSuccess = mqttService.publish(volumeTopic, '0');
    
    // Add small delay between publishes
    await new Promise(resolve => setTimeout(resolve, 50));
    
    const timeSuccess = mqttService.publish(timeTopic, 'null');

    if (volumeSuccess && timeSuccess) {
      console.log(`✅ Published "0" to ${volumeTopic} and "null" to ${timeTopic} - Release ${releaseIndex + 1} cancelled`);
      
      return NextResponse.json({
        success: true,
        message: `Release ${releaseIndex + 1} cancelled successfully`,
        topics: {
          volume: volumeTopic,
          time: timeTopic
        },
        values: {
          volume: '0',
          time: 'null'
        },
        release: {
          index: releaseIndex + 1,
          time: schedule.releases[releaseIndex].time,
          volume: schedule.releases[releaseIndex].releaseQuantity
        }
      });
    } else {
      console.error(`❌ Failed to publish - Volume: ${volumeSuccess}, Time: ${timeSuccess}`);
      return NextResponse.json(
        { error: 'Failed to publish to MQTT broker' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error cancelling release:', error);
    return NextResponse.json(
      { 
        error: 'Failed to cancel release',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
