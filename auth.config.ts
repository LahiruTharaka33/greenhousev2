import type { NextAuthConfig } from 'next-auth';
import { authOptions } from './src/lib/auth';

export const authConfig = authOptions satisfies NextAuthConfig;