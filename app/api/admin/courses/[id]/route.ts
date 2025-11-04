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
    const { title, description, thumbnail, icon, tags, price, order, isActive, isFree } = body

    // If title is changed, regenerate slug
    let slug = undefined
    if (title) {
      slug = title.toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '')
      
      // Check if new slug conflicts with another course
      const existingCourse = await prisma.course.findUnique({
        where: { slug }
      })
      
      if (existingCourse && existingCourse.id !== params.id) {
        return NextResponse.json({ 
          success: false,
          message: 'A course with this title already exists' 
        }, { status: 400 })
      }
    }

    const course = await prisma.course.update({
      where: { id: params.id },
      data: {
        ...(title && { title, slug }),
        ...(description !== undefined && { description }),
        ...(thumbnail !== undefined && { thumbnail }),
        ...(icon !== undefined && { icon }),
        ...(tags !== undefined && { tags }),
        ...(price !== undefined && { price }),
        ...(order !== undefined && { order }),
        ...(isActive !== undefined && { isActive }),
        ...(isFree !== undefined && { isFree })
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Course updated successfully',
      data: course
    })
  } catch (error: any) {
    console.error('Error updating course:', error)
    
    if (error.code === 'P2025') {
      return NextResponse.json({ 
        success: false, 
        message: 'Course not found' 
      }, { status: 404 })
    }
    
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

    // Check if course has categories or enrollments
    const courseWithRelations = await prisma.course.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: {
            categories: true,
            enrollments: true
          }
        }
      }
    })

    if (!courseWithRelations) {
      return NextResponse.json({ 
        success: false, 
        message: 'Course not found' 
      }, { status: 404 })
    }

    if (courseWithRelations._count.categories > 0) {
      return NextResponse.json({ 
        success: false, 
        message: `Cannot delete course with ${courseWithRelations._count.categories} categories. Delete categories first.` 
      }, { status: 400 })
    }

    if (courseWithRelations._count.enrollments > 0) {
      return NextResponse.json({ 
        success: false, 
        message: `Cannot delete course with ${courseWithRelations._count.enrollments} enrollments. Deactivate instead.` 
      }, { status: 400 })
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
    
    if (error.code === 'P2025') {
      return NextResponse.json({ 
        success: false, 
        message: 'Course not found' 
      }, { status: 404 })
    }
    
    return NextResponse.json({ 
      success: false, 
      message: error.message || 'Failed to delete course' 
    }, { status: 500 })
  }
}
