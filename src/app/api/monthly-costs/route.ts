import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET - Fetch monthly costs for a specific month
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const month = searchParams.get('month');

    if (!month) {
      return NextResponse.json({ error: 'Month parameter is required' }, { status: 400 });
    }

    // Validate month format (YYYY-MM)
    const monthRegex = /^\d{4}-\d{2}$/;
    if (!monthRegex.test(month)) {
      return NextResponse.json({ error: 'Invalid month format. Use YYYY-MM' }, { status: 400 });
    }

    const monthlyCosts = await prisma.monthlyCosts.findUnique({
      where: { month }
    });

    if (!monthlyCosts) {
      // Return default values if no record exists for this month
      return NextResponse.json({
        month,
        salary: 0,
        manPower: 0,
        other: 0
      });
    }

    return NextResponse.json(monthlyCosts);
  } catch (error) {
    console.error('Error fetching monthly costs:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Create or update monthly costs for a specific month
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { month, salary, manPower, other } = body;

    // Validation
    if (!month) {
      return NextResponse.json({ error: 'Month is required' }, { status: 400 });
    }

    // Validate month format (YYYY-MM)
    const monthRegex = /^\d{4}-\d{2}$/;
    if (!monthRegex.test(month)) {
      return NextResponse.json({ error: 'Invalid month format. Use YYYY-MM' }, { status: 400 });
    }

    if (salary < 0 || manPower < 0 || other < 0) {
      return NextResponse.json({ error: 'All cost values must be non-negative' }, { status: 400 });
    }

    // Use upsert to create or update the record
    const monthlyCosts = await prisma.monthlyCosts.upsert({
      where: { month },
      update: {
        salary: parseFloat(salary) || 0,
        manPower: parseFloat(manPower) || 0,
        other: parseFloat(other) || 0,
      },
      create: {
        month,
        salary: parseFloat(salary) || 0,
        manPower: parseFloat(manPower) || 0,
        other: parseFloat(other) || 0,
      }
    });

    return NextResponse.json(monthlyCosts);
  } catch (error) {
    console.error('Error saving monthly costs:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
