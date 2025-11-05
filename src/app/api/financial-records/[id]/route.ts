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
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const record = await prisma.financialRecord.findUnique({
      where: { id: params.id }
    });

    if (!record || record.userId !== session.user.id) {
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
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify ownership before updating
    const existingRecord = await prisma.financialRecord.findUnique({
      where: { id: params.id }
    });

    if (!existingRecord || existingRecord.userId !== session.user.id) {
      return NextResponse.json({ error: 'Financial record not found' }, { status: 404 });
    }

    const body = await request.json();
    const { 
      date, 
      totalIncome,
      quantity, 
      harvestingCost, 
      chemicalCost, 
      fertilizerCost, 
      rent, 
      deliveryCost,
      commission,
      other,
      notes 
    } = body;

    // Validation
    if (!date || !totalIncome || !quantity) {
      return NextResponse.json({ error: 'Date, total income, and quantity are required' }, { status: 400 });
    }

    if (totalIncome < 0 || quantity < 0) {
      return NextResponse.json({ error: 'Total income and quantity must be positive numbers' }, { status: 400 });
    }

    if ((harvestingCost && harvestingCost < 0) || (chemicalCost && chemicalCost < 0) || (fertilizerCost && fertilizerCost < 0) || (rent && rent < 0) || (deliveryCost && deliveryCost < 0) || (commission && commission < 0) || (other && other < 0)) {
      return NextResponse.json({ error: 'All cost values must be positive numbers' }, { status: 400 });
    }

    // Calculate total costs
    const totalCosts = (harvestingCost || 0) + (deliveryCost || 0) + (commission || 0) + (other || 0);
    
    // Calculate rate as (totalIncome - totalCosts) / quantity
    const netIncome = parseFloat(totalIncome) - totalCosts;
    const rate = parseFloat(quantity) > 0 ? netIncome / parseFloat(quantity) : 0;

    const record = await prisma.financialRecord.update({
      where: { id: params.id },
      data: {
        date: new Date(date),
        rate: rate,
        quantity: parseFloat(quantity),
        totalIncome: parseFloat(totalIncome),
        harvestingCost: harvestingCost ? parseFloat(harvestingCost) : 0,
        chemicalCost: chemicalCost ? parseFloat(chemicalCost) : 0,
        fertilizerCost: fertilizerCost ? parseFloat(fertilizerCost) : 0,
        rent: rent ? parseFloat(rent) : 0,
        deliveryCost: deliveryCost ? parseFloat(deliveryCost) : 0,
        commission: commission ? parseFloat(commission) : 0,
        other: other ? parseFloat(other) : 0,
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
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify ownership before deleting
    const existingRecord = await prisma.financialRecord.findUnique({
      where: { id: params.id }
    });

    if (!existingRecord || existingRecord.userId !== session.user.id) {
      return NextResponse.json({ error: 'Financial record not found' }, { status: 404 });
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

