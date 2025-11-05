import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || (session.user as any).role !== 'ADMIN') {
      return NextResponse.json({ 
        success: false,
        message: 'Unauthorized - Admin access required' 
      }, { status: 401 })
    }

    const body = await request.json()
    const { role } = body

    if (!['STUDENT', 'INSTRUCTOR', 'ADMIN'].includes(role)) {
      return NextResponse.json({ 
        success: false,
        message: 'Invalid role' 
      }, { status: 400 })
    }

    const user = await prisma.user.update({
      where: { id: params.id },
      data: { role }
    })

    return NextResponse.json({
      success: true,
      message: 'User role updated successfully',
      data: user
    })
  } catch (error: any) {
    console.error('Error updating user:', error)
    return NextResponse.json({ 
      success: false, 
      message: error.message || 'Failed to update user' 
    }, { status: 500 })
  }
}
