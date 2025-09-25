import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// PUT - Update item
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { itemId, itemName, itemCategory, unit } = body;

    // Validate required fields
    if (!itemId || !itemName || !itemCategory || !unit) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if itemId already exists for a different item
    const existingItem = await prisma.item.findFirst({
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

    const item = await prisma.item.update({
      where: { id: params.id },
      data: {
        itemId,
        itemName,
        itemCategory,
        unit,
      },
    });

    return NextResponse.json(item);
  } catch (error) {
    console.error('Error updating item:', error);
    return NextResponse.json(
      { error: 'Failed to update item' },
      { status: 500 }
    );
  }
}

// DELETE - Delete item
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.item.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: 'Item deleted successfully' });
  } catch (error) {
    console.error('Error deleting item:', error);
    return NextResponse.json(
      { error: 'Failed to delete item' },
      { status: 500 }
    );
  }
}
