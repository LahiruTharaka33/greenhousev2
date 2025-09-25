import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    return NextResponse.json({
      hasSession: !!session,
      userRole: session?.user?.role,
      userId: session?.user?.id,
      userEmail: session?.user?.email,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error checking session:', error);
    return NextResponse.json(
      { error: 'Failed to check session', details: error },
      { status: 500 }
    );
  }
}

