import { NextRequest, NextResponse } from 'next/server'
import { setDocument } from '@/lib/firestore-helpers'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { email, secret } = body

    // Simple secret-based auth for setup
    const setupSecret = process.env.SETUP_SECRET || 'your-secret-key-change-this'
    
    if (secret !== setupSecret) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    // Create/Update user with admin role
    const userData = {
      email,
      role: 'ADMIN',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    await setDocument('users', email, userData)

    return NextResponse.json({
      success: true,
      message: `User ${email} is now an admin`,
      user: userData
    })

  } catch (error) {
    console.error('Error making user admin:', error)
    return NextResponse.json(
      { 
        error: 'Failed to make user admin', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    )
  }
}
