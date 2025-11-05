import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || (session.user as any).role !== 'ADMIN') {
      return NextResponse.json({ 
        error: 'Unauthorized' 
      }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const categoryId = searchParams.get('categoryId')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const skip = (page - 1) * limit

    // Build where clause
    const where: any = {}
    if (categoryId) {
      // Find topics in this category through subjects
      const subjects = await prisma.subject.findMany({
        where: { categoryId },
        select: { id: true }
      })
      
      const subjectIds = subjects.map(s => s.id)
      
      const topics = await prisma.topic.findMany({
        where: { subjectId: { in: subjectIds } },
        select: { id: true }
      })
      
      where.topicId = { in: topics.map(t => t.id) }
    }

    // Get questions with relations
    const [questions, total] = await Promise.all([
      prisma.question.findMany({
        where,
        include: {
          topic: {
            include: {
              subject: {
                include: {
                  category: true
                }
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.question.count({ where })
    ])

    return NextResponse.json({
      success: true,
      data: {
        questions,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit)
        }
      }
    })

  } catch (error: any) {
    console.error('Error fetching questions:', error)
    return NextResponse.json({ 
      error: error.message 
    }, { status: 500 })
  }
}
