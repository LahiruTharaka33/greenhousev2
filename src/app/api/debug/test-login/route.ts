import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
        password: true,
        role: true,
        emailVerified: true,
        createdAt: true
      }
    });

    if (!user) {
      return NextResponse.json({
        success: false,
        message: 'User not found',
        email: email
      });
    }

    if (!user.password) {
      return NextResponse.json({
        success: false,
        message: 'User has no password set',
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role
        }
      });
    }

    // Check password
    const passwordsMatch = await bcrypt.compare(password, user.password);

    return NextResponse.json({
      success: passwordsMatch,
      message: passwordsMatch ? 'Credentials are valid' : 'Invalid password',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        emailVerified: user.emailVerified,
        createdAt: user.createdAt
      },
      passwordMatch: passwordsMatch
    });

  } catch (error) {
    console.error('Error testing login:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to test login', 
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
