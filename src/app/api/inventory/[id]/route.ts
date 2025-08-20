import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@/generated/prisma';

const prisma = new PrismaClient();

// GET - Fetch single inventory item
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const inventory = await prisma.mainInventory.findUnique({
      where: { id: params.id },
    });

    if (!inventory) {
      return NextResponse.json(
        { error: 'Inventory item not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(inventory);
  } catch (error) {
    console.error('Error fetching inventory item:', error);
    return NextResponse.json(
      { error: 'Failed to fetch inventory item' },
      { status: 500 }
    );
  }
}

// PUT - Update inventory item
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // Check if itemId already exists for other items
    const existingItem = await prisma.mainInventory.findFirst({
      where: {
        itemId,
        id: { not: params.id },
      },
    });

    if (existingItem) {
      return NextResponse.json(
        { error: 'Item ID already exists' },
        { status: 400 }
      );
    }

    const inventory = await prisma.mainInventory.update({
      where: { id: params.id },
      data: {
        itemId,
        itemType,
        itemName,
        description,
        quantity: parseInt(quantity),
      },
    });

    return NextResponse.json(inventory);
  } catch (error) {
    console.error('Error updating inventory item:', error);
    return NextResponse.json(
      { error: 'Failed to update inventory item' },
      { status: 500 }
    );
  }
}

// DELETE - Delete inventory item
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.mainInventory.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: 'Inventory item deleted successfully' });
  } catch (error) {
    console.error('Error deleting inventory item:', error);
    return NextResponse.json(
      { error: 'Failed to delete inventory item' },
      { status: 500 }
    );
  }
} 