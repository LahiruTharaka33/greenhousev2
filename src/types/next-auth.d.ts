import NextAuth from "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      email: string
      name?: string
      role: string
      customerId?: string | null
    }
  }

  interface User {
    id: string
    email: string
    name?: string
    role: string
    customerId?: string | null
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role: string
    customerId?: string | null
  }
}