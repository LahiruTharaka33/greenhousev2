import type { NextAuthConfig } from 'next-auth';

export const authConfig = {
  pages: {
    signIn: '/login',
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isOnDashboard = nextUrl.pathname.startsWith('/dashboard');
      const isOnAdminRoutes = nextUrl.pathname.startsWith('/customers') || 
                             nextUrl.pathname.startsWith('/inventory') ||
                             nextUrl.pathname.startsWith('/items') ||
                             nextUrl.pathname === '/';
      const isOnUserRoutes = nextUrl.pathname.startsWith('/user');
      const isOnLogin = nextUrl.pathname.startsWith('/login');

      // If user is trying to access login page and is already logged in
      if (isOnLogin && isLoggedIn) {
        const userRole = auth.user.role;
        if (userRole === 'admin') {
          return Response.redirect(new URL('/', nextUrl));
        } else {
          return Response.redirect(new URL('/user/dashboard', nextUrl));
        }
      }

      // If user is not logged in and trying to access protected routes
      if (!isLoggedIn && (isOnDashboard || isOnAdminRoutes || isOnUserRoutes)) {
        return false; // Redirect to login page
      }

      // If user is logged in, check role-based access
      if (isLoggedIn) {
        const userRole = auth.user.role;
        
        // Admin can access admin routes
        if (isOnAdminRoutes && userRole !== 'admin') {
          return Response.redirect(new URL('/user/dashboard', nextUrl));
        }
        
        // Users can only access user routes
        if (isOnUserRoutes && userRole !== 'user') {
          return Response.redirect(new URL('/', nextUrl));
        }
      }

      return true;
    },
  },
  providers: [], // Add providers with an empty array for now
} satisfies NextAuthConfig;