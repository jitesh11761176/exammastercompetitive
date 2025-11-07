import { NextAuthOptions } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'

export function getAuthOptions(): NextAuthOptions {
  // Validate required environment variables
  if (!process.env.NEXTAUTH_SECRET) {
    console.error('[NextAuth] NEXTAUTH_SECRET is not set!')
  }
  
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    console.warn('[NextAuth] Google OAuth credentials are not configured. Please set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET.')
  }

  return {
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
        // Only process during actual sign-in with user object
        if (user) {
          token.id = (user as any).id || token.sub
          token.email = user.email

          // Try to fetch role from Firestore only on initial sign-in
          try {
            const { getDocumentById } = await import('./firestore-helpers')
            const userId = user.email as string
            const userDoc = await getDocumentById('users', userId)
            token.role = userDoc?.role || 'STUDENT'
          } catch (error) {
            console.warn('[Auth] Failed to fetch role from Firestore:', error)
            token.role = 'STUDENT'
          }
        }
        
        // On subsequent calls (not sign-in), don't try to fetch from Firestore
        // Just keep existing role
        return token
      },
      async session({ session, token }) {
        if (session.user && token) {
          session.user.id = (token.id as string) || (token.sub as string)
          session.user.role = (token.role as 'STUDENT' | 'INSTRUCTOR' | 'ADMIN') || 'STUDENT'
          
          // Fetch fresh role from Firestore on every session check
          try {
            const { getDocumentById } = await import('./firestore-helpers')
            const userId = session.user.email as string
            const userDoc = await getDocumentById('users', userId)
            session.user.role = userDoc?.role || 'STUDENT'
          } catch (error) {
            // Keep token role if fetch fails
            console.warn('[Auth] Failed to refresh role from Firestore:', error)
          }
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

          // Allow sign in (no DB adapter)
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
      maxAge: 60 * 5, // 5 minutes - shorter to pick up role changes faster
    },
    debug: true,
  }
}

// Export both function and static options for different use cases
// Use getAuthOptions() in API routes, authOptions elsewhere
export const authOptions = getAuthOptions()