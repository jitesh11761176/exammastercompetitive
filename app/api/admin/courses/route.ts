import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || (session.user as any).role !== 'ADMIN') {
      return NextResponse.json({ 
        success: false,
        message: 'Unauthorized - Admin access required' 
      }, { status: 401 })
    }

    const courses = await prisma.course.findMany({
      include: {
        categories: {
          include: {
            _count: {
              select: {
                tests: true,
                subjects: true
              }
            }
          }
        },
        _count: {
          select: {
            enrollments: true,
            categories: true
          }
        }
      },
      orderBy: {
        order: 'asc'
      }
    })

    return NextResponse.json(courses)
  } catch (error: any) {
    console.error('Error fetching courses:', error)
    return NextResponse.json({ 
      success: false, 
      message: 'Failed to fetch courses' 
    }, { status: 500 })
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
