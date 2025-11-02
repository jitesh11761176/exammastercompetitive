import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// GET /api/test-series/[slug] - Get single test series details
export async function GET(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    const { slug } = params

    const testSeries = await prisma.testSeries.findUnique({
      where: { 
        slug_examId: {
          slug: slug,
          examId: req.nextUrl.searchParams.get('examId') || '',
        }
      },
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
        tests: {
          where: {
            isActive: true,
          },
          select: {
            id: true,
            title: true,
            slug: true,
            duration: true,
            totalQuestions: true,
            totalMarks: true,
            difficulty: true,
            isLocked: true,
            order: true,
          },
          orderBy: {
            order: 'asc',
          },
        },
        _count: {
          select: {
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
    })

    if (!testSeries) {
      return NextResponse.json(
        { error: 'Test series not found' },
        { status: 404 }
      )
    }

    // Check if user is enrolled
    const isEnrolled = session?.user?.id 
      ? (testSeries as any).enrollments?.length > 0 
      : false

    const enrollmentDetails = (testSeries as any).enrollments?.[0] || null

    return NextResponse.json({
      ...testSeries,
      isEnrolled,
      enrollmentDetails,
    })
  } catch (error) {
    console.error('Error fetching test series:', error)
    return NextResponse.json(
      { error: 'Failed to fetch test series' },
      { status: 500 }
    )
  }
}

// PUT /api/test-series/[slug] - Update test series (Admin only)
export async function PUT(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || (session.user as any).role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { slug } = params
    const data = await req.json()

    const testSeries = await prisma.testSeries.update({
      where: { 
        slug_examId: {
          slug: slug,
          examId: data.examId,
        }
      },
      data: {
        title: data.title,
        description: data.description,
        thumbnail: data.thumbnail,
        price: data.price,
        discountPrice: data.discountPrice,
        isPremium: data.isPremium,
        isFree: data.isFree,
        validityDays: data.validityDays,
        features: data.features,
        order: data.order,
        isActive: data.isActive,
      },
      include: {
        exam: {
          include: {
            category: true,
          },
        },
      },
    })

    return NextResponse.json(testSeries)
  } catch (error) {
    console.error('Error updating test series:', error)
    return NextResponse.json(
      { error: 'Failed to update test series' },
      { status: 500 }
    )
  }
}

// DELETE /api/test-series/[slug] - Delete test series (Admin only)
export async function DELETE(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || (session.user as any).role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { slug } = params
    const examId = req.nextUrl.searchParams.get('examId') || ''

    await prisma.testSeries.delete({
      where: { 
        slug_examId: {
          slug: slug,
          examId: examId,
        }
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting test series:', error)
    return NextResponse.json(
      { error: 'Failed to delete test series' },
      { status: 500 }
    )
  }
}
