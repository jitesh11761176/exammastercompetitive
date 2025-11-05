import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const runtime = "nodejs";
export const dynamic = 'force-dynamic'

// GET: Fetch all courses (deprecated endpoint - use /api/admin/courses instead)
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Return courses in old format for backward compatibility
    const courses = await prisma.course.findMany({
      where: { isActive: true },
      select: {
        id: true,
        title: true,
        slug: true,
        description: true,
      },
      orderBy: [
        { order: 'asc' },
        { title: 'asc' },
      ],
    })

    // Map to old category format for compatibility
    const categories = courses.map(course => ({
      id: course.id,
      name: course.title,
      slug: course.slug,
      description: course.description,
    }))

    return NextResponse.json({ categories })
  } catch (error) {
    console.error('Error fetching courses:', error)
    return NextResponse.json({ error: 'Failed to fetch courses' }, { status: 500 })
  }
}

// POST: Create a new course (deprecated endpoint - use /api/admin/courses instead)
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
    const { name, description } = body

    if (!name) {
      return NextResponse.json(
        { error: 'Name is required' },
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

    // Check if course with this slug already exists
    const existing = await prisma.course.findUnique({
      where: { slug },
    })

    if (existing) {
      return NextResponse.json(
        { error: 'A course with this name already exists' },
        { status: 409 }
      )
    }

    // Create the course
    const course = await prisma.course.create({
      data: {
        title: name,
        slug,
        description: description || null,
        isActive: true,
        isFree: false,
        order: 0,
      },
    })

    // Return in old category format for compatibility
    const category = {
      id: course.id,
      name: course.title,
      slug: course.slug,
      description: course.description,
    }

    return NextResponse.json({ category }, { status: 201 })
  } catch (error) {
    console.error('Error creating course:', error)
    return NextResponse.json({ error: 'Failed to create course' }, { status: 500 })
  }
}
