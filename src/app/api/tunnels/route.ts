import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET - Fetch all tunnels
export async function GET() {
  try {
    const tunnels = await prisma.tunnel.findMany({
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        customer: true,
      },
    });
    
    return NextResponse.json(tunnels);
  } catch (error) {
    console.error('Error fetching tunnels:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tunnels' },
      { status: 500 }
    );
  }
}

// POST - Create new tunnel
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { tunnelId, tunnelName, description, customerId, cultivationType, location } = body;

    // Validate required fields
    if (!tunnelId || !tunnelName || !customerId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if tunnelId already exists
    const existingTunnel = await prisma.tunnel.findUnique({
      where: { tunnelId },
    });

    if (existingTunnel) {
      return NextResponse.json(
        { error: 'Tunnel ID already exists' },
        { status: 400 }
      );
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

    const tunnel = await prisma.tunnel.create({
      data: {
        tunnelId,
        tunnelName,
        description,
        customerId,
        cultivationType,
        location,
      },
      include: {
        customer: true,
      },
    });

    return NextResponse.json(tunnel, { status: 201 });
  } catch (error) {
    console.error('Error creating tunnel:', error);
    return NextResponse.json(
      { error: 'Failed to create tunnel' },
      { status: 500 }
    );
  }
}
