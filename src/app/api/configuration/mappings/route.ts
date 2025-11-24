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
        sensorClientId: true,
        fertilizerClientId: true,
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
        sensorClientId: tunnel.sensorClientId,
        fertilizerClientId: tunnel.fertilizerClientId,
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
    const { tunnelId, clientId, sensorClientId, fertilizerClientId } = body;

    // Validate input
    if (!tunnelId) {
      return NextResponse.json(
        { error: 'Tunnel ID is required' },
        { status: 400 }
      );
    }

    // Validate clientId (can be null or a non-empty string)
    if (clientId !== null && clientId !== undefined && (typeof clientId !== 'string' || clientId.trim() === '')) {
      return NextResponse.json(
        { error: 'Water Control Client ID must be a non-empty string or null' },
        { status: 400 }
      );
    }

    // Validate sensorClientId (can be null or a non-empty string)
    if (sensorClientId !== null && sensorClientId !== undefined && (typeof sensorClientId !== 'string' || sensorClientId.trim() === '')) {
      return NextResponse.json(
        { error: 'Sensor Client ID must be a non-empty string or null' },
        { status: 400 }
      );
    }

    // Validate fertilizerClientId (can be null or a non-empty string)
    if (fertilizerClientId !== null && fertilizerClientId !== undefined && (typeof fertilizerClientId !== 'string' || fertilizerClientId.trim() === '')) {
      return NextResponse.json(
        { error: 'Fertilizer Client ID must be a non-empty string or null' },
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
        sensorClientId: true,
        fertilizerClientId: true,
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

    // Check if control clientId is already in use by another tunnel (if not null and being updated)
    if (clientId !== null && clientId !== undefined) {
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
            error: `Control Client ID "${clientId.trim()}" is already assigned to tunnel "${existingClientId.tunnelName}" (${existingClientId.customer.customerName})` 
          },
          { status: 409 }
        );
      }
    }

    // Check if sensor clientId is already in use by another tunnel (if not null and being updated)
    if (sensorClientId !== null && sensorClientId !== undefined) {
      const existingSensorClientId = await prisma.tunnel.findFirst({
        where: {
          sensorClientId: sensorClientId.trim(),
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

      if (existingSensorClientId) {
        return NextResponse.json(
          { 
            error: `Sensor Client ID "${sensorClientId.trim()}" is already assigned to tunnel "${existingSensorClientId.tunnelName}" (${existingSensorClientId.customer.customerName})` 
          },
          { status: 409 }
        );
      }
    }

    // Check if fertilizer clientId is already in use by another tunnel (if not null and being updated)
    if (fertilizerClientId !== null && fertilizerClientId !== undefined) {
      const existingFertilizerClientId = await prisma.tunnel.findFirst({
        where: {
          fertilizerClientId: fertilizerClientId.trim(),
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

      if (existingFertilizerClientId) {
        return NextResponse.json(
          { 
            error: `Fertilizer Client ID "${fertilizerClientId.trim()}" is already assigned to tunnel "${existingFertilizerClientId.tunnelName}" (${existingFertilizerClientId.customer.customerName})` 
          },
          { status: 409 }
        );
      }
    }

    // Prepare update data - only include fields that are being updated
    const updateData: any = {
      updatedAt: new Date()
    };

    if (clientId !== undefined) {
      updateData.clientId = clientId ? clientId.trim() : null;
    }

    if (sensorClientId !== undefined) {
      updateData.sensorClientId = sensorClientId ? sensorClientId.trim() : null;
    }

    if (fertilizerClientId !== undefined) {
      updateData.fertilizerClientId = fertilizerClientId ? fertilizerClientId.trim() : null;
    }

    // Update tunnel client IDs
    const updatedTunnel = await prisma.tunnel.update({
      where: { id: tunnelId },
      data: updateData,
      include: {
        customer: {
          select: {
            customerName: true,
            customerId: true
          }
        }
      }
    });

    // Generate appropriate success message
    let message = '';
    const updateCount = [clientId, sensorClientId, fertilizerClientId].filter(id => id !== undefined).length;
    
    if (updateCount > 1) {
      message = `Client IDs updated for tunnel "${updatedTunnel.tunnelName}"`;
    } else if (clientId !== undefined) {
      message = clientId 
        ? `Water Control Client ID "${clientId.trim()}" assigned to tunnel "${updatedTunnel.tunnelName}"`
        : `Water Control Client ID removed from tunnel "${updatedTunnel.tunnelName}"`;
    } else if (fertilizerClientId !== undefined) {
      message = fertilizerClientId 
        ? `Fertilizer Client ID "${fertilizerClientId.trim()}" assigned to tunnel "${updatedTunnel.tunnelName}"`
        : `Fertilizer Client ID removed from tunnel "${updatedTunnel.tunnelName}"`;
    } else if (sensorClientId !== undefined) {
      message = sensorClientId 
        ? `Sensor Client ID "${sensorClientId.trim()}" assigned to tunnel "${updatedTunnel.tunnelName}"`
        : `Sensor Client ID removed from tunnel "${updatedTunnel.tunnelName}"`;
    }

    return NextResponse.json({
      success: true,
      message: message,
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
