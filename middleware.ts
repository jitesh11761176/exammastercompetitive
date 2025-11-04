import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token
    const path = req.nextUrl.pathname

    // Check admin routes
    if (path.startsWith('/admin')) {
      const userRole = token?.role || 'STUDENT'
      if (userRole !== 'ADMIN' && userRole !== 'CREATOR') {
        return NextResponse.redirect(new URL('/403', req.url))
      }
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
)

export const config = {
  matcher: [
    '/admin/:path*',
    '/dashboard/:path*',
    '/tests/:path*',
    '/test/:path*',
    '/my-tests/:path*',
    '/analytics/:path*',
    '/leaderboard/:path*',
    '/profile/:path*',
    '/ai-chat/:path*',
    '/settings/:path*',
  ],
}
