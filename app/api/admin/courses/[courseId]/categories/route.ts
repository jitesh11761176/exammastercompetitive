import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

// GET /api/admin/courses/[courseId]/categories - List categories for a course
export async function GET(
  request: NextRequest,
  { params }: { params: { courseId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const categories = await prisma.category.findMany({
      where: { courseId: params.courseId },
      include: {
        _count: {
          select: {
            tests: true,
            subjects: true
          }
        }
      },
      orderBy: { order: 'asc' }
    })

    return NextResponse.json(categories)
  } catch (error) {
    console.error('Error fetching categories:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to fetch categories' },
      { status: 500 }
    )
  }
}

// POST /api/admin/courses/[courseId]/categories - Create new category
export async function POST(
  request: NextRequest,
  { params }: { params: { courseId: string } }
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

    if (!name) {
      return NextResponse.json(
        { success: false, message: 'Category name is required' },
        { status: 400 }
      )
    }

    // Generate slug from name
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')

    // Check if slug already exists for this course
    const existingCategory = await prisma.category.findFirst({
      where: {
        courseId: params.courseId,
        slug
      }
    })

    if (existingCategory) {
      return NextResponse.json(
        { success: false, message: 'A category with this name already exists in this course' },
        { status: 400 }
      )
    }

    const category = await prisma.category.create({
      data: {
        name,
        slug,
        description: description || null,
        icon: icon || null,
        order: order || 0,
        isActive: isActive !== undefined ? isActive : true,
        courseId: params.courseId
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
      message: 'Category created successfully',
      data: category
    })
  } catch (error) {
    console.error('Error creating category:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to create category' },
      { status: 500 }
    )
  }
}
