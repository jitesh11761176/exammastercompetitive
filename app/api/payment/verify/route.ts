import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { verifyRazorpaySignature } from '@/lib/razorpay'

// POST /api/payment/verify - Verify Razorpay payment
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await req.json()
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      purchaseId,
    } = body

    // Validate required fields
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !purchaseId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Get purchase record
    const purchase = await prisma.purchase.findUnique({
      where: { id: purchaseId },
    })

    if (!purchase) {
      return NextResponse.json(
        { error: 'Purchase not found' },
        { status: 404 }
      )
    }

    // Verify user owns this purchase
    if (purchase.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      )
    }

    // Verify signature
    const isValid = verifyRazorpaySignature(
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    )

    if (!isValid) {
      // Update purchase as failed
      await prisma.purchase.update({
        where: { id: purchaseId },
        data: {
          status: 'FAILED',
          failureReason: 'Invalid signature',
        },
      })

      return NextResponse.json(
        { error: 'Payment verification failed' },
        { status: 400 }
      )
    }

    // Update purchase as successful
    await prisma.purchase.update({
      where: { id: purchaseId },
      data: {
        status: 'SUCCESS',
        razorpayPaymentId: razorpay_payment_id,
        razorpaySignature: razorpay_signature,
        paidAt: new Date(),
      },
    })

    // Grant access based on item type
    if (purchase.itemType === 'TEST_SERIES') {
      // Check if already enrolled
      const existingEnrollment = await prisma.enrollment.findUnique({
        where: {
          userId_seriesId: {
            userId: session.user.id,
            seriesId: purchase.itemId,
          },
        },
      })

      if (!existingEnrollment) {
        // Get series details for validity
        const series = await prisma.testSeries.findUnique({
          where: { id: purchase.itemId },
        })

        if (series) {
          const expiresAt = new Date()
          expiresAt.setDate(expiresAt.getDate() + series.validityDays)

          // Create enrollment
          await prisma.enrollment.create({
            data: {
              userId: session.user.id,
              seriesId: purchase.itemId,
              status: 'ACTIVE',
              enrolledAt: new Date(),
              expiresAt,
              paymentId: purchaseId,
              amountPaid: purchase.amount,
            },
          })

          // Update enrolled count
          await prisma.testSeries.update({
            where: { id: purchase.itemId },
            data: { enrolledCount: { increment: 1 } },
          })
        }
      }
    } else if (purchase.itemType === 'COURSE') {
      // Check if already enrolled
      const existingEnrollment = await prisma.courseEnrollment.findUnique({
        where: {
          userId_courseId: {
            userId: session.user.id,
            courseId: purchase.itemId,
          },
        },
      })

      if (!existingEnrollment) {
        // Create course enrollment
        await prisma.courseEnrollment.create({
          data: {
            userId: session.user.id,
            courseId: purchase.itemId,
            status: 'ACTIVE',
            enrolledAt: new Date(),
            paymentId: purchaseId,
            amountPaid: purchase.amount,
          },
        })

        // Update enrolled count
        await prisma.course.update({
          where: { id: purchase.itemId },
          data: { enrolledCount: { increment: 1 } },
        })
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Payment verified successfully',
      purchaseId: purchase.id,
    })
  } catch (error) {
    console.error('Error verifying payment:', error)
    return NextResponse.json(
      { error: 'Failed to verify payment' },
      { status: 500 }
    )
  }
}
