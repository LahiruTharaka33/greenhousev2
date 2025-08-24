import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET - Fetch all customer inventory items
export async function GET() {
  try {
    const customerInventory = await prisma.customerInventory.findMany({
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        customer: true,
        item: true,
      },
    });
    
    return NextResponse.json(customerInventory);
  } catch (error) {
    console.error('Error fetching customer inventory:', error);
    return NextResponse.json(
      { error: 'Failed to fetch customer inventory' },
      { status: 500 }
    );
  }
}

// POST - Create new customer inventory item
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { itemId, itemType, itemName, customerId, description, quantity } = body;

    // Validate required fields
    if (!itemId || !itemType || !itemName || !customerId || quantity === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Verify that the item exists
    const itemExists = await prisma.item.findUnique({
      where: { itemId },
    });

    if (!itemExists) {
      return NextResponse.json(
        { error: 'Selected item does not exist' },
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

    // Check if this item already exists for this customer
    const existingInventory = await prisma.customerInventory.findFirst({
      where: {
        itemId,
        customerId,
      },
    });

    if (existingInventory) {
      return NextResponse.json(
        { error: 'This item already exists for this customer' },
        { status: 400 }
      );
    }

    const customerInventory = await prisma.customerInventory.create({
      data: {
        itemId,
        itemType,
        itemName,
        customerId,
        description,
        quantity: parseInt(quantity),
      },
      include: {
        customer: true,
        item: true,
      },
    });

    return NextResponse.json(customerInventory, { status: 201 });
  } catch (error) {
    console.error('Error creating customer inventory item:', error);
    return NextResponse.json(
      { error: 'Failed to create customer inventory item' },
      { status: 500 }
    );
  }
}
