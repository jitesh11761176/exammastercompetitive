import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getDocumentById } from '@/lib/firestore-helpers'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({
        authenticated: false,
        message: 'Not logged in'
      })
    }

    // Fetch from Firestore
    const userDoc = await getDocumentById('users', session.user.email)
    
    return NextResponse.json({
      authenticated: true,
      sessionRole: (session.user as any)?.role,
      firestoreRole: userDoc?.role,
      email: session.user.email,
      userDoc: userDoc,
      message: userDoc?.role === 'ADMIN' ? 'You are an admin in Firestore!' : 'Not admin in Firestore'
    })
  } catch (error) {
    return NextResponse.json({
      error: 'Failed to check role',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
