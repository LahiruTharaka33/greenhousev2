import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET - Fetch all items
export async function GET() {
  try {
    const items = await prisma.item.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });
    
    return NextResponse.json(items);
  } catch (error) {
    console.error('Error fetching items:', error);
    return NextResponse.json(
      { error: 'Failed to fetch items' },
      { status: 500 }
    );
  }
}

// POST - Create new item
export async function POST(request: NextRequest) {
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

    // Check if itemId already exists
    const existingItem = await prisma.item.findUnique({
      where: { itemId },
    });

    if (existingItem) {
      return NextResponse.json(
        { error: 'Item ID already exists' },
        { status: 400 }
      );
    }

    const item = await prisma.item.create({
      data: {
        itemId,
        itemName,
        itemCategory,
        unit,
      },
    });

    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    console.error('Error creating item:', error);
    return NextResponse.json(
      { error: 'Failed to create item' },
      { status: 500 }
    );
  }
}
