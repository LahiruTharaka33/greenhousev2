import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/customers - Get all customers
export async function GET() {
  try {
    const customers = await prisma.customer.findMany({
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json(customers);
  } catch (error) {
    console.error('Error fetching customers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch customers' },
      { status: 500 }
    );
  }
}

// POST /api/customers - Create a new customer
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      customerId,
      customerName,
      company,
      cultivationType,
      cultivationName,
      noOfTunnel,
      location,
      email,
      phone,
      address
    } = body;

    // Validate required fields
    if (!customerId || !customerName) {
      return NextResponse.json(
        { error: 'Customer ID and Customer Name are required' },
        { status: 400 }
      );
    }

    // Check if customerId already exists
    const existingCustomer = await prisma.customer.findUnique({
      where: { customerId }
    });

    if (existingCustomer) {
      return NextResponse.json(
        { error: 'Customer ID already exists' },
        { status: 400 }
      );
    }

    const customer = await prisma.customer.create({
      data: {
        customerId,
        customerName,
        company,
        cultivationType,
        cultivationName,
        noOfTunnel: noOfTunnel || 0,
        location,
        email,
        phone,
        address
      }
    });

    return NextResponse.json(customer, { status: 201 });
  } catch (error) {
    console.error('Error creating customer:', error);
    return NextResponse.json(
      { error: 'Failed to create customer' },
      { status: 500 }
    );
  }
} 