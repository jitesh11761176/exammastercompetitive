import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// POST /api/test-series/[slug]/enroll - Enroll in a test series
export async function POST(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'You must be logged in to enroll' },
        { status: 401 }
      )
    }

    const { slug } = params
    const body = await req.json()
    const { examId, paymentId } = body

    // Find the test series
    const testSeries = await prisma.testSeries.findFirst({
      where: {
        slug: slug,
        examId: examId,
        isActive: true,
      },
    })

    if (!testSeries) {
      return NextResponse.json(
        { error: 'Test series not found' },
        { status: 404 }
      )
    }

    // Check if already enrolled
    const existingEnrollment = await prisma.enrollment.findUnique({
      where: {
        userId_seriesId: {
          userId: session.user.id,
          seriesId: testSeries.id,
        },
      },
    })

    if (existingEnrollment) {
      if (existingEnrollment.status === 'ACTIVE') {
        return NextResponse.json(
          { error: 'You are already enrolled in this test series' },
          { status: 400 }
        )
      } else if (existingEnrollment.status === 'EXPIRED') {
        // Renew enrollment
        const renewedEnrollment = await prisma.enrollment.update({
          where: { id: existingEnrollment.id },
          data: {
            status: 'ACTIVE',
            enrolledAt: new Date(),
            expiresAt: new Date(
              Date.now() + testSeries.validityDays * 24 * 60 * 60 * 1000
            ),
            paymentId: paymentId || null,
            amountPaid: testSeries.discountPrice || testSeries.price,
          },
          include: {
            series: {
              include: {
                exam: true,
              },
            },
          },
        })

        // Update enrolled count
        await prisma.testSeries.update({
          where: { id: testSeries.id },
          data: { enrolledCount: { increment: 1 } },
        })

        return NextResponse.json({
          success: true,
          enrollment: renewedEnrollment,
          message: 'Successfully renewed enrollment',
        })
      }
    }

    // For premium series, verify payment
    if (!testSeries.isFree && !paymentId) {
      return NextResponse.json(
        { error: 'Payment required for premium test series' },
        { status: 400 }
      )
    }

    // Create new enrollment
    const enrollment = await prisma.enrollment.create({
      data: {
        userId: session.user.id,
        seriesId: testSeries.id,
        status: 'ACTIVE',
        enrolledAt: new Date(),
        expiresAt: new Date(
          Date.now() + testSeries.validityDays * 24 * 60 * 60 * 1000
        ),
        paymentId: paymentId || null,
        amountPaid: testSeries.isFree
          ? 0
          : testSeries.discountPrice || testSeries.price,
      },
      include: {
        series: {
          include: {
            exam: {
              include: {
                category: true,
              },
            },
          },
        },
      },
    })

    // Update enrolled count
    await prisma.testSeries.update({
      where: { id: testSeries.id },
      data: { enrolledCount: { increment: 1 } },
    })

    return NextResponse.json({
      success: true,
      enrollment,
      message: 'Successfully enrolled in test series',
    })
  } catch (error) {
    console.error('Error enrolling in test series:', error)
    return NextResponse.json(
      { error: 'Failed to enroll in test series' },
      { status: 500 }
    )
  }
}
