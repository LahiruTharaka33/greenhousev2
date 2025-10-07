import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const records = await prisma.financialRecord.findMany({
      orderBy: { date: 'desc' }
    });

    return NextResponse.json(records);
  } catch (error) {
    console.error('Error fetching financial records:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
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

    const record = await prisma.financialRecord.create({
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

    return NextResponse.json(record, { status: 201 });
  } catch (error) {
    console.error('Error creating financial record:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

