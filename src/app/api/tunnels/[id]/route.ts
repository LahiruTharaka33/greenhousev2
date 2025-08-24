import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// PUT - Update tunnel
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // Check if tunnelId already exists for a different tunnel
    const existingTunnel = await prisma.tunnel.findFirst({
      where: {
        tunnelId,
        id: { not: params.id },
      },
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

    const tunnel = await prisma.tunnel.update({
      where: { id: params.id },
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

    return NextResponse.json(tunnel);
  } catch (error) {
    console.error('Error updating tunnel:', error);
    return NextResponse.json(
      { error: 'Failed to update tunnel' },
      { status: 500 }
    );
  }
}

// DELETE - Delete tunnel
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.tunnel.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: 'Tunnel deleted successfully' });
  } catch (error) {
    console.error('Error deleting tunnel:', error);
    return NextResponse.json(
      { error: 'Failed to delete tunnel' },
      { status: 500 }
    );
  }
}
