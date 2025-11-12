import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

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

    const { getDocumentById, queryDocuments } = await import("@/lib/firestore-helpers");
    const { where } = await import("firebase/firestore");

    // Fetch course from Firestore
    const course = await getDocumentById('courses', params.courseId)

    if (!course) {
      return NextResponse.json(
        { success: false, message: 'Course not found' },
        { status: 404 }
      )
    }

    // Fetch categories for this course
    const categories = await queryDocuments('categories', where('courseId', '==', params.courseId))
    
    // Count enrollments and categorize data for response
    const enrichedCourse = {
      ...course,
      _count: {
        categories: categories.length,
        enrollments: 0
      },
      categories: categories.map((cat: any) => ({
        ...cat,
        _count: {
          tests: cat.tests?.length || 0,
          subjects: cat.subjects?.length || 0
        }
      }))
    }

    return NextResponse.json({
      success: true,
      data: enrichedCourse
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

    const { getDocumentById, updateDocument, queryDocuments } = await import("@/lib/firestore-helpers");
    const { where } = await import("firebase/firestore");

    // Fetch existing course
    const existingCourse = await getDocumentById('courses', params.courseId)

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
      const slugExists = await queryDocuments('courses', where('slug', '==', slug), where('id', '!=', params.courseId))

      if (slugExists.length > 0) {
        return NextResponse.json(
          { success: false, message: 'A course with this title already exists' },
          { status: 400 }
        )
      }
    }

    // Update course in Firestore
    const updatedData = {
      title: title || existingCourse.title,
      slug,
      description: description !== undefined ? description : existingCourse.description,
      icon: icon !== undefined ? icon : existingCourse.icon,
      tags: tags !== undefined ? tags : existingCourse.tags,
      order: order !== undefined ? order : existingCourse.order,
      isActive: isActive !== undefined ? isActive : existingCourse.isActive,
      isFree: isFree !== undefined ? isFree : existingCourse.isFree,
      updatedAt: new Date().toISOString()
    }

    await updateDocument('courses', params.courseId, updatedData)

    return NextResponse.json({
      success: true,
      message: 'Course updated successfully',
      data: {
        id: params.courseId,
        ...updatedData
      }
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

    const { getDocumentById, deleteDocument, queryDocuments } = await import("@/lib/firestore-helpers");
    const { where } = await import("firebase/firestore");

    // Fetch course to verify it exists and get category count
    const course = await getDocumentById('courses', params.courseId)

    if (!course) {
      return NextResponse.json(
        { success: false, message: 'Course not found' },
        { status: 404 }
      )
    }

    // Count related categories
    const categories = await queryDocuments('categories', where('courseId', '==', params.courseId))

    // Delete course from Firestore
    await deleteDocument('courses', params.courseId)

    return NextResponse.json({
      success: true,
      message: 'Course deleted successfully',
      deletedCategories: categories.length,
      deletedEnrollments: 0
    })
  } catch (error) {
    console.error('Error deleting course:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to delete course' },
      { status: 500 }
    )
  }
}
