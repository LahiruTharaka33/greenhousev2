import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth';

const prisma = new PrismaClient();

export async function PATCH(
  request: NextRequest,
  { params }: { params: { tunnelId: string } }
) {
  try {
    // Check authentication and admin privileges
    const session = await getServerSession();
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
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

    // Parse request body
    const body = await request.json();
    const { clientId } = body;

    // Validate clientId (can be null or a non-empty string)
    if (clientId !== null && (typeof clientId !== 'string' || clientId.trim() === '')) {
      return NextResponse.json(
        { error: 'Client ID must be a non-empty string or null' },
        { status: 400 }
      );
    }

    // Check if tunnel exists
    const existingTunnel = await prisma.tunnel.findUnique({
      where: { id: params.tunnelId },
      select: { id: true, tunnelName: true, clientId: true }
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
          id: { not: params.tunnelId }
        },
        select: { id: true, tunnelName: true }
      });

      if (existingClientId) {
        return NextResponse.json(
          { error: `Client ID "${clientId.trim()}" is already assigned to tunnel "${existingClientId.tunnelName}"` },
          { status: 409 }
        );
      }
    }

    // Update tunnel clientId
    const updatedTunnel = await prisma.tunnel.update({
      where: { id: params.tunnelId },
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
    console.error('Error updating tunnel client ID:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
