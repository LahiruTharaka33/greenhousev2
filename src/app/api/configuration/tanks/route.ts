import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET - Fetch fertilizer items for tank configuration
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

    // Fetch all fertilizer items
    const fertilizerItems = await prisma.item.findMany({
      where: {
        itemCategory: 'Fertilizers'
      },
      select: {
        id: true,
        itemId: true,
        itemName: true,
        itemCategory: true,
        unit: true
      },
      orderBy: {
        itemName: 'asc'
      }
    });

    return NextResponse.json({
      fertilizerItems
    });

  } catch (error) {
    console.error('Error fetching fertilizer items:', error);
    return NextResponse.json(
      { error: 'Failed to fetch fertilizer items' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// POST - Create or update tank configuration
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
    const { tunnelId, tankName, itemType, itemId } = body;

    // Validate input
    if (!tunnelId || !tankName || !itemType) {
      return NextResponse.json(
        { error: 'Tunnel ID, tank name, and item type are required' },
        { status: 400 }
      );
    }

    if (!['Tank A', 'Tank B', 'Tank C'].includes(tankName)) {
      return NextResponse.json(
        { error: 'Tank name must be "Tank A", "Tank B", or "Tank C"' },
        { status: 400 }
      );
    }

    if (!['water', 'fertilizer'].includes(itemType)) {
      return NextResponse.json(
        { error: 'Item type must be "water" or "fertilizer"' },
        { status: 400 }
      );
    }

    if (itemType === 'fertilizer' && !itemId) {
      return NextResponse.json(
        { error: 'Item ID is required when item type is fertilizer' },
        { status: 400 }
      );
    }

    // Check if tunnel exists
    const tunnel = await prisma.tunnel.findUnique({
      where: { id: tunnelId },
      select: { id: true, tunnelName: true }
    });

    if (!tunnel) {
      return NextResponse.json(
        { error: 'Tunnel not found' },
        { status: 404 }
      );
    }

    // If itemType is fertilizer, verify the item exists and is a fertilizer
    let itemName = '';
    if (itemType === 'fertilizer' && itemId) {
      const item = await prisma.item.findUnique({
        where: { id: itemId },
        select: { id: true, itemName: true, itemCategory: true }
      });

      if (!item) {
        return NextResponse.json(
          { error: 'Selected item not found' },
          { status: 404 }
        );
      }

      if (item.itemCategory !== 'Fertilizers') {
        return NextResponse.json(
          { error: 'Selected item is not a fertilizer' },
          { status: 400 }
        );
      }

      itemName = item.itemName;

      // Check if this fertilizer is already assigned to another tank in the same tunnel
      const existingAssignment = await prisma.tankConfiguration.findFirst({
        where: {
          tunnelId,
          tankName: { not: tankName }, // Different tank
          itemType: 'fertilizer',
          itemId: itemId
        },
        select: {
          tankName: true
        }
      });

      if (existingAssignment) {
        return NextResponse.json(
          { error: `This fertilizer "${itemName}" is already assigned to ${existingAssignment.tankName}. Each fertilizer can only be assigned to one tank.` },
          { status: 409 }
        );
      }
    }

    // Create or update tank configuration
    const tankConfig = await prisma.tankConfiguration.upsert({
      where: {
        tunnelId_tankName: {
          tunnelId,
          tankName
        }
      },
      update: {
        itemType,
        itemId: itemType === 'fertilizer' ? itemId : null,
        updatedAt: new Date()
      },
      create: {
        tunnelId,
        tankName,
        itemType,
        itemId: itemType === 'fertilizer' ? itemId : null
      },
      include: {
        item: itemType === 'fertilizer' ? {
          select: {
            id: true,
            itemName: true,
            itemCategory: true
          }
        } : false
      }
    });

    return NextResponse.json({
      success: true,
      message: `Tank ${tankName} configured successfully`,
      tankConfig
    });

  } catch (error) {
    console.error('Error configuring tank:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
