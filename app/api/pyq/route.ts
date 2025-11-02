import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// GET /api/pyq - List all PYQ collections
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const examCategory = searchParams.get('category')
    const examSlug = searchParams.get('exam')
    const year = searchParams.get('year')

    const where: any = {
      isActive: true,
    }

    // Filter by exam category
    if (examCategory) {
      where.exam = {
        category: {
          slug: examCategory,
        },
      }
    }

    // Filter by specific exam
    if (examSlug) {
      where.exam = {
        ...where.exam,
        slug: examSlug,
      }
    }

    // Filter by year
    if (year) {
      const yearNum = parseInt(year)
      where.startYear = { lte: yearNum }
      where.endYear = { gte: yearNum }
    }

    const pyqCollections = await prisma.pYQCollection.findMany({
      where,
      include: {
        exam: {
          include: {
            category: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
          },
        },
        _count: {
          select: {
            tests: true,
          },
        },
      },
      orderBy: [
        { order: 'asc' },
        { endYear: 'desc' },
      ],
    })

    return NextResponse.json(pyqCollections)
  } catch (error) {
    console.error('Error fetching PYQ collections:', error)
    return NextResponse.json(
      { error: 'Failed to fetch PYQ collections' },
      { status: 500 }
    )
  }
}

// POST /api/pyq - Create new PYQ collection (Admin only)
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || (session.user as any).role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const data = await req.json()

    const pyqCollection = await prisma.pYQCollection.create({
      data: {
        examId: data.examId,
        title: data.title,
        slug: data.slug,
        description: data.description,
        thumbnail: data.thumbnail,
        startYear: data.startYear,
        endYear: data.endYear,
        price: data.price || 0,
        isPremium: data.isPremium || false,
        isFree: data.isFree || data.price === 0,
        totalPapers: data.totalPapers || 0,
        totalQuestions: data.totalQuestions || 0,
        order: data.order || 0,
      },
      include: {
        exam: {
          include: {
            category: true,
          },
        },
      },
    })

    return NextResponse.json(pyqCollection, { status: 201 })
  } catch (error) {
    console.error('Error creating PYQ collection:', error)
    return NextResponse.json(
      { error: 'Failed to create PYQ collection' },
      { status: 500 }
    )
  }
}
