import { NextRequest, NextResponse } from 'next/server'
import { setDocument } from '@/lib/firestore-helpers'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// Add CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders })
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { email, secret } = body

    // Simple secret-based auth for setup
    const setupSecret = process.env.SETUP_SECRET || 'admin-setup-secret-2024'
    
    console.log('[Make Admin] Request received:', { email, hasSecret: !!secret, envSecret: setupSecret })
    
    if (secret !== setupSecret) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401, headers: corsHeaders }
      )
    }

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400, headers: corsHeaders }
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
    }, { headers: corsHeaders })

  } catch (error) {
    console.error('Error making user admin:', error)
    return NextResponse.json(
      { 
        error: 'Failed to make user admin', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500, headers: corsHeaders }
    )
  }
}
