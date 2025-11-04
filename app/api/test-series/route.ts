import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// GET /api/test-series - List all test series
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const examCategory = searchParams.get('category')
    const examSlug = searchParams.get('exam')
    const priceFilter = searchParams.get('price') // 'free', 'paid', 'all'
    const search = searchParams.get('search')
    const session = await getServerSession(authOptions)

    const where: any = {
      isActive: true,
      publishedAt: { not: null },
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

    // Filter by price
    if (priceFilter === 'free') {
      where.isFree = true
    } else if (priceFilter === 'paid') {
      where.isFree = false
    }

    // Search
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ]
    }

    const testSeries = await prisma.testSeries.findMany({
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
            enrollments: true,
          },
        },
        ...(session?.user?.id && {
          enrollments: {
            where: {
              userId: session.user.id,
              status: 'ACTIVE',
            },
            take: 1,
          },
        }),
      },
      orderBy: [
        { order: 'asc' },
        { createdAt: 'desc' },
      ],
    })

    // Transform data to include enrollment status
    const transformedSeries = testSeries.map((series: any) => ({
      ...series,
      isEnrolled: session?.user?.id ? series.enrollments?.length > 0 : false,
      enrollmentDetails: series.enrollments?.[0] || null,
    }))

    return NextResponse.json(transformedSeries)
  } catch (error) {
    console.error('Error fetching test series:', error)
    return NextResponse.json(
      { error: 'Failed to fetch test series' },
      { status: 500 }
    )
  }
}

// POST /api/test-series - Create new test series (Admin only)
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    // @ts-ignore - role exists
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const data = await req.json()

    const testSeries = await prisma.testSeries.create({
      data: {
        examId: data.examId,
        title: data.title,
        slug: data.slug,
        description: data.description,
        thumbnail: data.thumbnail,
        price: data.price || 0,
        discountPrice: data.discountPrice,
        isPremium: data.isPremium || false,
        isFree: data.isFree || data.price === 0,
        validityDays: data.validityDays || 365,
        totalTests: data.totalTests || 0,
        totalQuestions: data.totalQuestions || 0,
        features: data.features || [],
        order: data.order || 0,
        publishedAt: data.publishNow ? new Date() : null,
      },
      include: {
        exam: {
          include: {
            category: true,
          },
        },
      },
    })

    return NextResponse.json(testSeries, { status: 201 })
  } catch (error) {
    console.error('Error creating test series:', error)
    return NextResponse.json(
      { error: 'Failed to create test series' },
      { status: 500 }
    )
  }
}
