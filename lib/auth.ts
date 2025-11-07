import { NextAuthOptions } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import { getUserRole } from './user-role'

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
        if (user?.email) {
          // On initial sign-in, fetch the role and add it to the token
          const role = await getUserRole(user.email);
          token.role = role || 'STUDENT';
          token.id = user.id;
          token.email = user.email;
        }
        return token;
      },
      async session({ session, token }) {
        if (session.user) {
          // On every session check, fetch the latest role to ensure it's fresh
          const role = token.email ? await getUserRole(token.email) : 'STUDENT';
          session.user.role = role || 'STUDENT';
          session.user.id = token.id as string;
        }
        return session;
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
      maxAge: 60 * 1, // 1 minute - very short for debugging role changes
    },
    debug: process.env.NODE_ENV !== 'production',
  }
}

// Export both function and static options for different use cases
// Use getAuthOptions() in API routes, authOptions elsewhere
export const authOptions = getAuthOptions()