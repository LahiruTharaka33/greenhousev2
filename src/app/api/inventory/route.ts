import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET - Fetch all inventory items
export async function GET() {
  try {
    const inventory = await prisma.mainInventory.findMany({
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        item: true,
      },
    });
    
    return NextResponse.json(inventory);
  } catch (error) {
    console.error('Error fetching inventory:', error);
    return NextResponse.json(
      { error: 'Failed to fetch inventory' },
      { status: 500 }
    );
  }
}

// POST - Create new inventory item
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { itemId, itemType, itemName, description, quantity } = body;

    // Validate required fields
    if (!itemId || !itemType || !itemName || quantity === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if itemId already exists in inventory
    const existingInventoryItem = await prisma.mainInventory.findUnique({
      where: { itemId },
    });

    if (existingInventoryItem) {
      return NextResponse.json(
        { error: 'This item is already in inventory' },
        { status: 400 }
      );
    }

    // Verify that the item exists in the Item table
    const itemExists = await prisma.item.findUnique({
      where: { itemId },
    });

    if (!itemExists) {
      return NextResponse.json(
        { error: 'Selected item does not exist' },
        { status: 400 }
      );
    }

    const inventory = await prisma.mainInventory.create({
      data: {
        itemId,
        itemType,
        itemName,
        description,
        quantity: parseInt(quantity),
        storedDate: new Date(),
      },
      include: {
        item: true,
      },
    });

    return NextResponse.json(inventory, { status: 201 });
  } catch (error) {
    console.error('Error creating inventory item:', error);
    return NextResponse.json(
      { error: 'Failed to create inventory item' },
      { status: 500 }
    );
  }
} 