import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || '';
    const month = searchParams.get('month') || '';

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Build where clause for filtering
    const where: any = {};
    
    if (search) {
      where.notes = {
        contains: search,
        mode: 'insensitive'
      };
    }
    
    if (month) {
      // Create start and end dates for the month
      const startDate = new Date(month + '-01');
      const endDate = new Date(startDate);
      endDate.setMonth(endDate.getMonth() + 1);
      
      // Use UTC to avoid timezone issues
      startDate.setUTCHours(0, 0, 0, 0);
      endDate.setUTCHours(0, 0, 0, 0);
      
      where.date = {
        gte: startDate,
        lt: endDate
      };
      
      console.log('Month filter applied:', { month, startDate, endDate }); // Debug log
    }

    // Get total count for pagination
    const total = await prisma.financialRecord.count({ where });

    // Get paginated records
    const records = await prisma.financialRecord.findMany({
      where,
      orderBy: { date: 'desc' },
      skip,
      take: limit
    });

    return NextResponse.json({
      records,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    });
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

    const record = await prisma.financialRecord.create({
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

    return NextResponse.json(record, { status: 201 });
  } catch (error) {
    console.error('Error creating financial record:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

