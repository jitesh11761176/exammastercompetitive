import NextAuth, { DefaultSession } from 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      role: 'STUDENT' | 'INSTRUCTOR' | 'ADMIN'
    } & DefaultSession['user']
  }

  interface User {
    role: 'STUDENT' | 'INSTRUCTOR' | 'ADMIN'
  }
}
