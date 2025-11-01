import { NextAuthOptions } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import { PrismaAdapter } from '@auth/prisma-adapter'
import { prisma } from './prisma'

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as any,
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code"
        }
      }
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      // Initial sign in
      if (user) {
        token.id = user.id
        token.email = user.email
        token.role = (user as any).role || 'STUDENT'
      }
      return token
    },
    async session({ session, token }) {
      if (session.user && token) {
        session.user.id = token.id as string
        // @ts-ignore
        session.user.role = token.role || 'STUDENT'
      }
      return session
    },
    async signIn({ user, account }) {
      try {
        console.log('[NextAuth] SignIn callback triggered')
        console.log('[NextAuth] User:', user?.id, user?.email)
        console.log('[NextAuth] Account:', account?.provider)
        
        if (!user?.id || !user?.email) {
          console.error('[NextAuth] No user ID or email provided')
          return false
        }

        // Allow sign in - user will be created by Prisma adapter if needed
        console.log('[NextAuth] SignIn callback completed successfully')
        return true
      } catch (error) {
        console.error('[NextAuth] Error in signIn callback:', error)
        return true
      }
    },
    async redirect({ url, baseUrl }) {
      // Log redirects to debug
      console.log('[NextAuth] Redirect:', { url, baseUrl })
      
      // If url starts with baseUrl, it's a relative redirect
      if (url.startsWith(baseUrl)) return url
      
      // If it's a callback to dashboard, allow it
      if (url.startsWith('/')) return `${baseUrl}${url}`
      
      // Default to dashboard
      return `${baseUrl}/dashboard`
    },
  },
  logger: {
    error(code: unknown, ...metadata: unknown[]) {
      console.error('[NextAuth][error]', code, ...metadata)
    },
    warn(code: unknown, ...metadata: unknown[]) {
      console.warn('[NextAuth][warn]', code, ...metadata)
    },
    debug(code: unknown, ...metadata: unknown[]) {
      // Useful while debugging; keep but it's noisy
      if (process.env.NODE_ENV !== 'production') {
        console.debug('[NextAuth][debug]', code, ...metadata)
      }
    },
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  debug: true,
}
