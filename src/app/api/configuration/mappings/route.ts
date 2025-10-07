import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET - Fetch all tunnel-client mappings
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { email: session.user.email! },
      select: { role: true }
    });

    if (user?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Admin privileges required' },
        { status: 403 }
      );
    }

    // Fetch all tunnels with their customer information, client IDs, and tank configurations
    const tunnels = await prisma.tunnel.findMany({
      select: {
        id: true,
        tunnelId: true,
        tunnelName: true,
        clientId: true,
        customerId: true,
        customer: {
          select: {
            id: true,
            customerId: true,
            customerName: true,
            company: true
          }
        },
        tankConfigs: {
          select: {
            id: true,
            tankName: true,
            itemType: true,
            itemId: true,
            item: {
              select: {
                id: true,
                itemName: true,
                itemCategory: true
              }
            }
          },
          orderBy: {
            tankName: 'asc'
          }
        }
      },
      orderBy: [
        { customer: { customerName: 'asc' } },
        { tunnelName: 'asc' }
      ]
    });

    // Group tunnels by customer
    const mappings = tunnels.reduce((acc: any, tunnel) => {
      const customerId = tunnel.customerId;
      if (!acc[customerId]) {
        acc[customerId] = {
          customer: tunnel.customer,
          tunnels: []
        };
      }
      acc[customerId].tunnels.push({
        id: tunnel.id,
        tunnelId: tunnel.tunnelId,
        tunnelName: tunnel.tunnelName,
        clientId: tunnel.clientId,
        tankConfigs: tunnel.tankConfigs
      });
      return acc;
    }, {});

    return NextResponse.json(mappings);
  } catch (error) {
    console.error('Error fetching configuration mappings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch mappings' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// POST - Create/update client mapping
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { email: session.user.email! },
      select: { role: true }
    });

    if (user?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Admin privileges required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { tunnelId, clientId } = body;

    // Validate input
    if (!tunnelId) {
      return NextResponse.json(
        { error: 'Tunnel ID is required' },
        { status: 400 }
      );
    }

    // Validate clientId (can be null or a non-empty string)
    if (clientId !== null && (typeof clientId !== 'string' || clientId.trim() === '')) {
      return NextResponse.json(
        { error: 'Client ID must be a non-empty string or null' },
        { status: 400 }
      );
    }

    // Check if tunnel exists
    const existingTunnel = await prisma.tunnel.findUnique({
      where: { id: tunnelId },
      select: { 
        id: true, 
        tunnelName: true, 
        clientId: true,
        customer: {
          select: {
            customerName: true
          }
        }
      }
    });

    if (!existingTunnel) {
      return NextResponse.json(
        { error: 'Tunnel not found' },
        { status: 404 }
      );
    }

    // Check if clientId is already in use by another tunnel (if not null)
    if (clientId !== null) {
      const existingClientId = await prisma.tunnel.findFirst({
        where: {
          clientId: clientId.trim(),
          id: { not: tunnelId }
        },
        select: { 
          id: true, 
          tunnelName: true,
          customer: {
            select: {
              customerName: true
            }
          }
        }
      });

      if (existingClientId) {
        return NextResponse.json(
          { 
            error: `Client ID "${clientId.trim()}" is already assigned to tunnel "${existingClientId.tunnelName}" (${existingClientId.customer.customerName})` 
          },
          { status: 409 }
        );
      }
    }

    // Update tunnel clientId
    const updatedTunnel = await prisma.tunnel.update({
      where: { id: tunnelId },
      data: { 
        clientId: clientId ? clientId.trim() : null,
        updatedAt: new Date()
      },
      include: {
        customer: {
          select: {
            customerName: true,
            customerId: true
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      message: clientId 
        ? `Client ID "${clientId.trim()}" assigned to tunnel "${updatedTunnel.tunnelName}"`
        : `Client ID removed from tunnel "${updatedTunnel.tunnelName}"`,
      tunnel: updatedTunnel
    });

  } catch (error) {
    console.error('Error updating client mapping:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
