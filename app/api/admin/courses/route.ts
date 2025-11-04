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
        _count: {
          select: {
            enrollments: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
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
    const { title, description, thumbnail, price, isActive } = body

    if (!title) {
      return NextResponse.json({ 
        success: false,
        message: 'Title is required' 
      }, { status: 400 })
    }

    const slug = title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')

    const course = await prisma.course.create({
      data: {
        title,
        slug,
        description: description || null,
        thumbnail: thumbnail || null,
        price: price || 0,
        isActive: isActive !== undefined ? isActive : true
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
