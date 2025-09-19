import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET - Fetch tunnels for a specific customer
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ customerId: string }> }
) {
  try {
    const { customerId } = await params;

    if (!customerId) {
      return NextResponse.json(
        { error: 'Customer ID is required' },
        { status: 400 }
      );
    }

    // Verify customer exists
    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
    });

    if (!customer) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      );
    }

    // Fetch tunnels for this customer
    const tunnels = await prisma.tunnel.findMany({
      where: {
        customerId: customerId,
      },
      orderBy: {
        tunnelName: 'asc',
      },
      select: {
        id: true,
        tunnelId: true,
        tunnelName: true,
        description: true,
        cultivationType: true,
        location: true,
      },
    });

    return NextResponse.json(tunnels);
  } catch (error) {
    console.error('Error fetching customer tunnels:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tunnels' },
      { status: 500 }
    );
  }
}
