import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import mqttService from '@/lib/mqtt';
import { prisma } from '@/lib/prisma';

// POST /api/schedules-v2/[id]/run-release - Trigger a specific release immediately
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

    // Verify schedule exists
    const schedule = await prisma.scheduleV2.findUnique({
      where: { id: scheduleId },
      include: {
        releases: {
          orderBy: { time: 'asc' }
        }
      }
    });

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

    // Map releaseIndex to MQTT topic
    const topicMap: { [key: number]: string } = {
      0: 'schedule_time1',
      1: 'schedule_time2',
      2: 'schedule_time3'
    };

    const topic = topicMap[releaseIndex];
    
    console.log(`🚀 Triggering Release ${releaseIndex + 1} immediately for schedule ${scheduleId}`);
    console.log(`   Release details:`, schedule.releases[releaseIndex]);

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

    // Publish "null" to trigger immediate execution
    const success = mqttService.publish(topic, 'null');

    if (success) {
      console.log(`✅ Published "null" to ${topic} - Release ${releaseIndex + 1} triggered immediately`);
      
      return NextResponse.json({
        success: true,
        message: `Release ${releaseIndex + 1} triggered successfully`,
        topic,
        value: 'null',
        release: {
          index: releaseIndex + 1,
          time: schedule.releases[releaseIndex].time,
          volume: schedule.releases[releaseIndex].releaseQuantity
        }
      });
    } else {
      console.error(`❌ Failed to publish to ${topic}`);
      return NextResponse.json(
        { error: 'Failed to publish to MQTT broker' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error running release:', error);
    return NextResponse.json(
      { 
        error: 'Failed to run release',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
