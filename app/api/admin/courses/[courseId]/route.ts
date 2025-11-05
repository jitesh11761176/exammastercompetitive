import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/admin/courses/[courseId]
export async function GET(
  _request: NextRequest,
  { params }: { params: { courseId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || (session.user as any).role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const course = await prisma.course.findUnique({
      where: { id: params.courseId },
      include: {
        categories: {
          include: {
            _count: {
              select: {
                tests: true,
                subjects: true
              }
            }
          },
          orderBy: { order: 'asc' }
        },
        _count: {
          select: {
            enrollments: true,
            categories: true
          }
        }
      }
    })

    if (!course) {
      return NextResponse.json(
        { success: false, message: 'Course not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: course
    })
  } catch (error) {
    console.error('Error fetching course:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to fetch course' },
      { status: 500 }
    )
  }
}

// PUT /api/admin/courses/[courseId] - Update course
export async function PUT(
  request: NextRequest,
  { params }: { params: { courseId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || (session.user as any).role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { title, description, icon, tags, order, isActive, isFree } = body

    const existingCourse = await prisma.course.findUnique({
      where: { id: params.courseId }
    })

    if (!existingCourse) {
      return NextResponse.json(
        { success: false, message: 'Course not found' },
        { status: 404 }
      )
    }

    // Generate new slug if title changed
    let slug = existingCourse.slug
    if (title && title !== existingCourse.title) {
      slug = title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')

      // Check if new slug already exists
      const slugExists = await prisma.course.findFirst({
        where: {
          slug,
          id: { not: params.courseId }
        }
      })

      if (slugExists) {
        return NextResponse.json(
          { success: false, message: 'A course with this title already exists' },
          { status: 400 }
        )
      }
    }

    const course = await prisma.course.update({
      where: { id: params.courseId },
      data: {
        title: title || existingCourse.title,
        slug,
        description: description !== undefined ? description : existingCourse.description,
        icon: icon !== undefined ? icon : existingCourse.icon,
        tags: tags !== undefined ? tags : existingCourse.tags,
        order: order !== undefined ? order : existingCourse.order,
        isActive: isActive !== undefined ? isActive : existingCourse.isActive,
        isFree: isFree !== undefined ? isFree : existingCourse.isFree
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Course updated successfully',
      data: course
    })
  } catch (error) {
    console.error('Error updating course:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to update course' },
      { status: 500 }
    )
  }
}

// DELETE /api/admin/courses/[courseId]
export async function DELETE(
  _request: NextRequest,
  { params }: { params: { courseId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || (session.user as any).role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const course = await prisma.course.findUnique({
      where: { id: params.courseId },
      include: {
        _count: {
          select: {
            categories: true,
            enrollments: true
          }
        }
      }
    })

    if (!course) {
      return NextResponse.json(
        { success: false, message: 'Course not found' },
        { status: 404 }
      )
    }

    // Delete course (will cascade delete categories and tests due to schema)
    await prisma.course.delete({
      where: { id: params.courseId }
    })

    return NextResponse.json({
      success: true,
      message: 'Course deleted successfully',
      deletedCategories: course._count.categories,
      deletedEnrollments: course._count.enrollments
    })
  } catch (error) {
    console.error('Error deleting course:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to delete course' },
      { status: 500 }
    )
  }
}
