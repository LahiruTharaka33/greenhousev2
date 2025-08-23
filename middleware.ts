import { NextResponse } from 'next/server';
import { withAuth } from 'next-auth/middleware';

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const { pathname } = req.nextUrl;

    // Allow access to login page
    if (pathname.startsWith('/login')) {
      return NextResponse.next();
    }

    // If user is not logged in, redirect to login
    if (!token) {
      return NextResponse.redirect(new URL('/login', req.url));
    }

    const userRole = token.role as string;

    // Admin routes
    const isAdminRoute = pathname === '/' || 
                        pathname.startsWith('/customers') || 
                        pathname.startsWith('/inventory') ||
                        pathname.startsWith('/items') ||
                        pathname.startsWith('/schedules') ||
                        pathname.startsWith('/tasks') ||
                        pathname.startsWith('/tunnels');

    // User routes
    const isUserRoute = pathname.startsWith('/user');

    // Redirect admin users trying to access user routes
    if (isUserRoute && userRole === 'admin') {
      return NextResponse.redirect(new URL('/', req.url));
    }

    // Redirect regular users trying to access admin routes
    if (isAdminRoute && userRole === 'user') {
      return NextResponse.redirect(new URL('/user/dashboard', req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
    pages: {
      signIn: '/login',
    },
  }
);

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\.png$).*)'],
};