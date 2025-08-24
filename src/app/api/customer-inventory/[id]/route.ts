import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// PUT - Update customer inventory item
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // Check if this item already exists for this customer (excluding current item)
    const existingInventory = await prisma.customerInventory.findFirst({
      where: {
        itemId,
        customerId,
        id: { not: params.id },
      },
    });

    if (existingInventory) {
      return NextResponse.json(
        { error: 'This item already exists for this customer' },
        { status: 400 }
      );
    }

    const customerInventory = await prisma.customerInventory.update({
      where: { id: params.id },
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

    return NextResponse.json(customerInventory);
  } catch (error) {
    console.error('Error updating customer inventory item:', error);
    return NextResponse.json(
      { error: 'Failed to update customer inventory item' },
      { status: 500 }
    );
  }
}

// DELETE - Delete customer inventory item
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.customerInventory.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: 'Customer inventory item deleted successfully' });
  } catch (error) {
    console.error('Error deleting customer inventory item:', error);
    return NextResponse.json(
      { error: 'Failed to delete customer inventory item' },
      { status: 500 }
    );
  }
}
