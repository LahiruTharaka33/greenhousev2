import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const record = await prisma.financialRecord.findUnique({
      where: { id: params.id }
    });

    if (!record) {
      return NextResponse.json({ error: 'Financial record not found' }, { status: 404 });
    }

    return NextResponse.json(record);
  } catch (error) {
    console.error('Error fetching financial record:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { 
      date, 
      rate, 
      quantity, 
      harvestingCost, 
      chemicalCost, 
      fertilizerCost, 
      rent, 
      notes 
    } = body;

    // Validation
    if (!date || !rate || !quantity) {
      return NextResponse.json({ error: 'Date, rate, and quantity are required' }, { status: 400 });
    }

    if (rate < 0 || quantity < 0) {
      return NextResponse.json({ error: 'Rate and quantity must be positive numbers' }, { status: 400 });
    }

    if ((harvestingCost && harvestingCost < 0) || (chemicalCost && chemicalCost < 0) || (fertilizerCost && fertilizerCost < 0) || (rent && rent < 0)) {
      return NextResponse.json({ error: 'All cost values must be positive numbers' }, { status: 400 });
    }

    const totalIncome = rate * quantity;

    const record = await prisma.financialRecord.update({
      where: { id: params.id },
      data: {
        date: new Date(date),
        rate: parseFloat(rate),
        quantity: parseFloat(quantity),
        totalIncome,
        harvestingCost: harvestingCost ? parseFloat(harvestingCost) : 0,
        chemicalCost: chemicalCost ? parseFloat(chemicalCost) : 0,
        fertilizerCost: fertilizerCost ? parseFloat(fertilizerCost) : 0,
        rent: rent ? parseFloat(rent) : 0,
        notes: notes || null
      }
    });

    return NextResponse.json(record);
  } catch (error) {
    console.error('Error updating financial record:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await prisma.financialRecord.delete({
      where: { id: params.id }
    });

    return NextResponse.json({ message: 'Financial record deleted successfully' });
  } catch (error) {
    console.error('Error deleting financial record:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

