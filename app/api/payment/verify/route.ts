import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
// PRISMA MIGRATION: This endpoint requires Firebase migration and is currently disabled
import { verifyRazorpaySignature } from '@/lib/razorpay'

// Define PaymentStatus enum locally (was from Prisma)
enum PaymentStatus {
  PENDING = 'PENDING',
  SUCCEEDED = 'SUCCEEDED',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED',
}

// POST /api/payment/verify - Verify Razorpay payment
export async function POST(req: NextRequest) {
  return NextResponse.json(
    { error: 'This endpoint requires Firebase migration and is currently disabled' },
    { status: 503 }
  )
}

// DISABLED - REQUIRES FIREBASE MIGRATION
/*
export async function POST_DISABLED(req: NextRequest) {
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
          status: PaymentStatus.FAILED,
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
        status: PaymentStatus.SUCCEEDED,
        razorpayPaymentId: razorpay_payment_id,
        razorpaySignature: razorpay_signature,
        paidAt: new Date(),
      },
    })

    // Grant access based on item type
    if (purchase.itemType === 'TEST_SERIES') {
      // TEST_SERIES is deprecated - should not happen since create-order blocks it
      // If somehow a TEST_SERIES purchase exists, log error and skip enrollment
      console.error('Attempted to verify payment for deprecated TEST_SERIES item:', purchase.itemId)
      
      return NextResponse.json({
        success: false,
        error: 'Test series purchases are no longer supported',
      }, { status: 400 })
      
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
        // Note: CourseEnrollment doesn't have paymentId or amountPaid fields
        // Payment info is stored in Purchase model
        await prisma.courseEnrollment.create({
          data: {
            userId: session.user.id,
            courseId: purchase.itemId,
            enrolledAt: new Date(),
            status: 'ACTIVE',
          },
        })

        // Note: Course model doesn't have enrolledCount field in the new schema
        // If you need enrollment tracking, add it to the Course model
        // await prisma.course.update({
        //   where: { id: purchase.itemId },
        //   data: { enrolledCount: { increment: 1 } },
        // })
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

