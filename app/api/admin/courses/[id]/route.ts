import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

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
    const { title, description, thumbnail, price, isActive } = body

    const course = await prisma.course.update({
      where: { id: params.id },
      data: {
        title,
        description: description || null,
        thumbnail: thumbnail || null,
        price: price || 0,
        isActive: isActive !== undefined ? isActive : true
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Course updated successfully',
      data: course
    })
  } catch (error: any) {
    console.error('Error updating course:', error)
    return NextResponse.json({ 
      success: false, 
      message: error.message || 'Failed to update course' 
    }, { status: 500 })
  }
}

export async function DELETE(
  _request: NextRequest,
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

    await prisma.course.delete({
      where: { id: params.id }
    })

    return NextResponse.json({
      success: true,
      message: 'Course deleted successfully'
    })
  } catch (error: any) {
    console.error('Error deleting course:', error)
    return NextResponse.json({ 
      success: false, 
      message: error.message || 'Failed to delete course' 
    }, { status: 500 })
  }
}
