import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET - Fetch tunnels for the authenticated user
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's customer ID
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { customer: true }
    });

    if (!user || !user.customer) {
      return NextResponse.json({ error: 'No customer account found' }, { status: 404 });
    }

    // Fetch tunnels assigned to this customer
    const tunnels = await prisma.tunnel.findMany({
      where: {
        customerId: user.customer.id
      },
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        customer: {
          select: {
            id: true,
            customerId: true,
            customerName: true,
            company: true,
          }
        },
      },
    });
    
    return NextResponse.json(tunnels);
  } catch (error) {
    console.error('Error fetching user tunnels:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tunnels' },
      { status: 500 }
    );
  }
}






