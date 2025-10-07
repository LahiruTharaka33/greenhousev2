import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import schedulePublisher, { ScheduleData } from '@/lib/schedulePublisher';

// GET /api/schedules - Fetch all schedules with optional filtering
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse query parameters for filtering
    const { searchParams } = new URL(request.url);
    const customerId = searchParams.get('customerId');
    const tunnelId = searchParams.get('tunnelId');
    const itemId = searchParams.get('itemId');
    const status = searchParams.get('status');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');

    // Build where clause based on filters
    const where: any = {};

    if (customerId) {
      where.customerId = customerId;
    }

    if (tunnelId) {
      where.tunnelId = tunnelId;
    }

    if (itemId) {
      where.itemId = itemId;
    }

    if (status) {
      where.status = status;
    }

    if (dateFrom || dateTo) {
      where.scheduledDate = {};
      if (dateFrom) {
        where.scheduledDate.gte = new Date(dateFrom);
      }
      if (dateTo) {
        where.scheduledDate.lte = new Date(dateTo);
      }
    }

    const schedules = await prisma.schedule.findMany({
      where,
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
        item: {
          select: {
            id: true,
            itemId: true,
            itemName: true,
            itemCategory: true,
            unit: true,
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
      },
    });
    
    return NextResponse.json(schedules);
  } catch (error) {
    console.error('Error fetching schedules:', error);
    return NextResponse.json(
      { error: 'Failed to fetch schedules' },
      { status: 500 }
    );
  }
}

// POST /api/schedules - Create new schedule(s)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    
    // Handle both single schedule and batch schedule creation
    const isBatchRequest = Array.isArray(body);
    const scheduleItems = isBatchRequest ? body : [body];

    const createdSchedules = [];
    const errors = [];

    for (const scheduleData of scheduleItems) {
      const { customerId, itemId, tunnelId, scheduledDate, scheduledTime, quantity, notes } = scheduleData;

      // Validate required fields
      if (!customerId || !itemId || !scheduledDate || !scheduledTime) {
        errors.push({
          data: scheduleData,
          error: 'Missing required fields'
        });
        continue;
      }

      try {
        // Verify that the customer exists
        const customerExists = await prisma.customer.findUnique({
          where: { id: customerId },
        });

        if (!customerExists) {
          errors.push({
            data: scheduleData,
            error: 'Selected customer does not exist'
          });
          continue;
        }

        // Verify that the item exists
        const itemExists = await prisma.item.findUnique({
          where: { id: itemId },
        });

        if (!itemExists) {
          errors.push({
            data: scheduleData,
            error: 'Selected item does not exist'
          });
          continue;
        }

        // If tunnelId is provided, verify it exists and belongs to the customer
        if (tunnelId) {
          const tunnelExists = await prisma.tunnel.findFirst({
            where: { 
              id: tunnelId,
              customerId: customerId,
            },
          });

          if (!tunnelExists) {
            errors.push({
              data: scheduleData,
              error: 'Selected tunnel does not exist or does not belong to the customer'
            });
            continue;
          }
        }

        const schedule = await prisma.schedule.create({
          data: {
            customerId,
            itemId,
            tunnelId: tunnelId || null,
            scheduledDate: new Date(scheduledDate),
            scheduledTime,
            quantity: quantity || 1,
            notes: notes || '',
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
            item: {
              select: {
                id: true,
                itemId: true,
                itemName: true,
                itemCategory: true,
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
          },
        });

        createdSchedules.push(schedule);
      } catch (error) {
        console.error('Error creating individual schedule:', error);
        errors.push({
          data: scheduleData,
          error: 'Failed to create schedule'
        });
      }
    }

    // Return early if no schedules were created
    if (errors.length > 0 && createdSchedules.length === 0) {
      return NextResponse.json(
        { error: 'Failed to create any schedules', details: errors },
        { status: 400 }
      );
    }

    // Publish schedules to MQTT (ESP32) if any were created successfully
    let mqttPublishResult = null;
    if (createdSchedules.length > 0) {
      try {
        console.log(`Publishing ${createdSchedules.length} schedules to ESP32...`);
        
        // Convert created schedules to ScheduleData format
        const scheduleDataForMQTT: ScheduleData[] = createdSchedules.map(schedule => ({
          id: schedule.id,
          scheduledDate: schedule.scheduledDate,
          scheduledTime: schedule.scheduledTime,
          quantity: schedule.quantity,
          item: {
            itemName: schedule.item.itemName,
            itemCategory: schedule.item.itemCategory,
          },
          customer: {
            customerName: schedule.customer.customerName,
          },
          tunnel: schedule.tunnel ? {
            tunnelName: schedule.tunnel.tunnelName,
          } : undefined,
        }));

        // Publish to MQTT
        mqttPublishResult = await schedulePublisher.publishSchedules(scheduleDataForMQTT);
        
        console.log('MQTT publishing completed:', {
          success: mqttPublishResult.overallSuccess,
          uniqueDates: mqttPublishResult.uniqueDates,
          totalSchedules: mqttPublishResult.totalSchedules
        });
      } catch (mqttError) {
        console.error('Error publishing schedules to MQTT:', mqttError);
        // Don't fail the entire request if MQTT publishing fails
        mqttPublishResult = {
          totalSchedules: createdSchedules.length,
          uniqueDates: 0,
          publishResults: [],
          overallSuccess: false,
          timestamp: new Date().toISOString(),
          error: mqttError instanceof Error ? mqttError.message : 'Unknown MQTT error'
        };
      }
    }

    // Prepare response with MQTT results
    const responseData = {
      schedules: isBatchRequest ? createdSchedules : createdSchedules[0],
      mqttPublish: mqttPublishResult,
      ...(errors.length > 0 && {
        success: createdSchedules,
        errors: errors,
        message: `Created ${createdSchedules.length} schedules, ${errors.length} failed`
      })
    };

    // Return appropriate response based on results
    if (errors.length > 0) {
      return NextResponse.json(responseData, { status: 207 }); // Multi-status
    }

    return NextResponse.json(responseData, { status: 201 });
  } catch (error) {
    console.error('Error creating schedule:', error);
    return NextResponse.json(
      { error: 'Failed to create schedule' },
      { status: 500 }
    );
  }
}
