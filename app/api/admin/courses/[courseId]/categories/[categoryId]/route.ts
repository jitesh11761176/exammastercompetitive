import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/admin/courses/[courseId]/categories/[categoryId]
export async function GET(
  _request: NextRequest,
  { params }: { params: { courseId: string; categoryId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const category = await prisma.category.findUnique({
      where: { id: params.categoryId },
      include: {
        _count: {
          select: {
            tests: true,
            subjects: true
          }
        }
      }
    })

    if (!category || category.courseId !== params.courseId) {
      return NextResponse.json(
        { success: false, message: 'Category not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: category
    })
  } catch (error) {
    console.error('Error fetching category:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to fetch category' },
      { status: 500 }
    )
  }
}

// PUT /api/admin/courses/[courseId]/categories/[categoryId] - Update category
export async function PUT(
  request: NextRequest,
  { params }: { params: { courseId: string; categoryId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { name, description, icon, order, isActive } = body

    // Check if category exists and belongs to this course
    const existingCategory = await prisma.category.findUnique({
      where: { id: params.categoryId }
    })

    if (!existingCategory || existingCategory.courseId !== params.courseId) {
      return NextResponse.json(
        { success: false, message: 'Category not found' },
        { status: 404 }
      )
    }

    // Generate new slug if name changed
    let slug = existingCategory.slug
    if (name && name !== existingCategory.name) {
      slug = name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')

      // Check if new slug already exists for this course
      const slugExists = await prisma.category.findFirst({
        where: {
          courseId: params.courseId,
          slug,
          id: { not: params.categoryId }
        }
      })

      if (slugExists) {
        return NextResponse.json(
          { success: false, message: 'A category with this name already exists in this course' },
          { status: 400 }
        )
      }
    }

    const category = await prisma.category.update({
      where: { id: params.categoryId },
      data: {
        name: name || existingCategory.name,
        slug,
        description: description !== undefined ? description : existingCategory.description,
        icon: icon !== undefined ? icon : existingCategory.icon,
        order: order !== undefined ? order : existingCategory.order,
        isActive: isActive !== undefined ? isActive : existingCategory.isActive
      },
      include: {
        _count: {
          select: {
            tests: true,
            subjects: true
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Category updated successfully',
      data: category
    })
  } catch (error) {
    console.error('Error updating category:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to update category' },
      { status: 500 }
    )
  }
}

// DELETE /api/admin/courses/[courseId]/categories/[categoryId]
export async function DELETE(
  _request: NextRequest,
  { params }: { params: { courseId: string; categoryId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check if category exists and belongs to this course
    const category = await prisma.category.findUnique({
      where: { id: params.categoryId },
      include: {
        _count: {
          select: { tests: true }
        }
      }
    })

    if (!category || category.courseId !== params.courseId) {
      return NextResponse.json(
        { success: false, message: 'Category not found' },
        { status: 404 }
      )
    }

    // Delete category (will cascade delete tests due to schema)
    await prisma.category.delete({
      where: { id: params.categoryId }
    })

    return NextResponse.json({
      success: true,
      message: 'Category deleted successfully',
      deletedTests: category._count.tests
    })
  } catch (error) {
    console.error('Error deleting category:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to delete category' },
      { status: 500 }
    )
  }
}
