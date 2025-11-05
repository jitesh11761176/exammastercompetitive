import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const runtime = "nodejs";                   // 👈 critical on Vercel
export const dynamic = "force-dynamic";            // avoid stale caching in admin

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const data = await prisma.course.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        isActive: true,
        createdAt: true,
        _count: { select: { categories: true } },
      },
    })

    return NextResponse.json({ data })
  } catch (err: any) {
    console.error("GET /api/admin/courses failed:", err?.message ?? err)
    return NextResponse.json(
      { error: "Internal Server Error", detail: err?.message ?? null },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || (session.user as any).role !== 'ADMIN') {
      return NextResponse.json({ 
        success: false,
        message: 'Unauthorized - Admin access required' 
      }, { status: 401 })
    }

    const body = await request.json()
    const { title, description, thumbnail, icon, tags, order, isActive, isFree } = body

    if (!title) {
      return NextResponse.json({ 
        success: false,
        message: 'Title is required' 
      }, { status: 400 })
    }

    // Generate slug from title
    const slug = title.toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '')
    
    // Check if slug already exists
    const existingCourse = await prisma.course.findUnique({
      where: { slug }
    })
    
    if (existingCourse) {
      return NextResponse.json({ 
        success: false,
        message: 'A course with this title already exists' 
      }, { status: 400 })
    }

    const course = await prisma.course.create({
      data: {
        title,
        slug,
        description: description || null,
        thumbnail: thumbnail || null,
        icon: icon || null,
        tags: tags || [],
        order: order || 0,
        isActive: isActive !== undefined ? isActive : true,
        isFree: isFree !== undefined ? isFree : false
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Course created successfully',
      data: course
    })
  } catch (error: any) {
    console.error('Error creating course:', error)
    return NextResponse.json({ 
      success: false, 
      message: error.message || 'Failed to create course' 
    }, { status: 500 })
  }
}
