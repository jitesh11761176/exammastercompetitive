import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// GET: Fetch all categories (deprecated endpoint - use /api/admin/categories instead)
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Return categories in old exam format for backward compatibility
    const categories = await prisma.category.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        courseId: true,
        course: {
          select: {
            id: true,
            title: true,
          },
        },
      },
      orderBy: [
        { name: 'asc' },
      ],
    })

    // Map to old exam format for compatibility
    const exams = categories.map((category: any) => ({
      id: category.id,
      name: category.name,
      slug: category.slug,
      description: category.description,
      categoryId: category.courseId, // Map courseId to categoryId for old API
      category: {
        id: category.course.id,
        name: category.course.title,
      },
    }))

    return NextResponse.json({ exams })
  } catch (error) {
    console.error('Error fetching categories:', error)
    return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 })
  }
}

// POST: Create a new category (deprecated endpoint - use /api/admin/categories instead)
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // @ts-ignore
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await req.json()
    const { name, description, categoryId } = body

    // In the old API, categoryId meant the parent ExamCategory
    // In the new API, this should be courseId (the parent Course)
    const courseId = categoryId

    if (!name || !courseId) {
      return NextResponse.json(
        { error: 'Name and course are required' },
        { status: 400 }
      )
    }

    // Generate slug from name
    const slug = name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')

    // Check if category with this slug already exists in the course
    const existing = await prisma.category.findFirst({
      where: {
        courseId,
        slug,
      },
    })

    if (existing) {
      return NextResponse.json(
        { error: 'A category with this name already exists in this course' },
        { status: 409 }
      )
    }

    // Create the category
    const category = await prisma.category.create({
      data: {
        name,
        slug,
        description: description || null,
        courseId,
        isActive: true,
      },
      include: {
        course: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    })

    // Return in old exam format for compatibility
    const exam = {
      id: category.id,
      name: category.name,
      slug: category.slug,
      description: category.description,
      categoryId: category.courseId,
      category: {
        id: category.course.id,
        name: category.course.title,
      },
    }

    return NextResponse.json({ exam }, { status: 201 })
  } catch (error) {
    console.error('Error creating category:', error)
    return NextResponse.json({ error: 'Failed to create category' }, { status: 500 })
  }
}
