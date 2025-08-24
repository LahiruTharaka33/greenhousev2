import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// POST - Move inventory item to customer inventory
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { inventoryId, customerId, quantity } = body;

    // Validate required fields
    if (!inventoryId || !customerId || !quantity || quantity <= 0) {
      return NextResponse.json(
        { error: 'Missing or invalid required fields' },
        { status: 400 }
      );
    }

    // Get the inventory item
    const inventoryItem = await prisma.mainInventory.findUnique({
      where: { id: inventoryId },
      include: { item: true },
    });

    if (!inventoryItem) {
      return NextResponse.json(
        { error: 'Inventory item not found' },
        { status: 404 }
      );
    }

    // Check if quantity is available
    if (inventoryItem.quantity < quantity) {
      return NextResponse.json(
        { error: `Insufficient quantity. Available: ${inventoryItem.quantity}` },
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
    const existingCustomerInventory = await prisma.customerInventory.findFirst({
      where: {
        itemId: inventoryItem.itemId,
        customerId,
      },
    });

    // Use a transaction to ensure data consistency
    const result = await prisma.$transaction(async (tx) => {
      // Update main inventory (decrease quantity)
      const updatedInventory = await tx.mainInventory.update({
        where: { id: inventoryId },
        data: {
          quantity: inventoryItem.quantity - quantity,
        },
        include: { item: true },
      });

      if (existingCustomerInventory) {
        // Update existing customer inventory (increase quantity)
        const updatedCustomerInventory = await tx.customerInventory.update({
          where: { id: existingCustomerInventory.id },
          data: {
            quantity: existingCustomerInventory.quantity + quantity,
          },
          include: {
            customer: true,
            item: true,
          },
        });
        return { updatedInventory, updatedCustomerInventory, action: 'updated' };
      } else {
        // Create new customer inventory entry
        const newCustomerInventory = await tx.customerInventory.create({
          data: {
            itemId: inventoryItem.itemId,
            itemType: inventoryItem.itemType,
            itemName: inventoryItem.itemName,
            customerId,
            quantity,
            description: `Moved from main inventory on ${new Date().toLocaleDateString()}`,
          },
          include: {
            customer: true,
            item: true,
          },
        });
        return { updatedInventory, updatedCustomerInventory: newCustomerInventory, action: 'created' };
      }
    });

    return NextResponse.json({
      message: `Successfully moved ${quantity} items to customer inventory`,
      data: result,
    }, { status: 200 });

  } catch (error) {
    console.error('Error moving inventory to customer:', error);
    return NextResponse.json(
      { error: 'Failed to move inventory to customer' },
      { status: 500 }
    );
  }
}
