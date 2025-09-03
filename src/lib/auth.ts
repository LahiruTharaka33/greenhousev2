import { NextAuthOptions } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { z } from 'zod';
import bcrypt from 'bcrypt';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function getUser(email: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { email },
      include: { customer: true }
    });
    return user;
  } catch (error) {
    console.error('Failed to fetch user:', error);
    throw new Error('Failed to fetch user.');
  }
}

export const authOptions: NextAuthOptions = {
  pages: {
    signIn: '/login',
  },
  providers: [
    Credentials({
      async authorize(credentials) {
        const parsedCredentials = z
          .object({ 
            email: z.string().email(), 
            password: z.string().min(6) 
          })
          .safeParse(credentials);

        if (parsedCredentials.success) {
          const { email, password } = parsedCredentials.data;
          const user = await getUser(email);
          
          if (!user || !user.password) return null;
          
          const passwordsMatch = await bcrypt.compare(password, user.password);

          if (passwordsMatch) {
            return {
              id: user.id,
              email: user.email,
              name: user.name,
              role: user.role,
              customerId: user.customer?.id || null,
            };
          }
        }

        console.log('Invalid credentials');
        return null;
      },
    }),
  ],
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isOnDashboard = nextUrl.pathname.startsWith('/dashboard');
      const isOnAdminRoutes = nextUrl.pathname.startsWith('/customers') || 
                             nextUrl.pathname.startsWith('/inventory') ||
                             nextUrl.pathname.startsWith('/items') ||
                             nextUrl.pathname.startsWith('/schedules') ||
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
    jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.customerId = user.customerId;
      }
      return token;
    },
    session({ session, token }) {
      if (token) {
        session.user.id = token.sub!;
        session.user.role = token.role as string;
        session.user.customerId = token.customerId as string | null;
      }
      return session;
    },
  },
};

