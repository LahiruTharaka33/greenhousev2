import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcrypt';

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
      address,
      password
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

    // If email and password are provided, check if email already exists
    if (email && password) {
      const existingUser = await prisma.user.findUnique({
        where: { email }
      });

      if (existingUser) {
        return NextResponse.json(
          { error: 'Email already exists' },
          { status: 400 }
        );
      }
    }

    // Create customer and user account in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create customer first
      const customer = await tx.customer.create({
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

      // If email and password provided, create user account
      if (email && password) {
        const hashedPassword = await bcrypt.hash(password, 12);
        
        const user = await tx.user.create({
          data: {
            email,
            name: customerName,
            password: hashedPassword,
            role: 'user',
            emailVerified: new Date()
          }
        });

        // Link customer to user
        await tx.customer.update({
          where: { id: customer.id },
          data: { userId: user.id }
        });
      }

      return customer;
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error('Error creating customer:', error);
    return NextResponse.json(
      { error: 'Failed to create customer' },
      { status: 500 }
    );
  }
} 