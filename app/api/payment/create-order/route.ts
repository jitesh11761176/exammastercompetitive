import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
// PRISMA MIGRATION: import { prisma } from "@/lib/prisma"
import { createRazorpayOrder, convertToPaise } from '@/lib/razorpay'

// POST /api/payment/create-order - Create a Razorpay order
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized. Please log in.' },
        { status: 401 }
      )
    }

    const body = await req.json()
    const { itemType, itemId, amount, itemTitle } = body

    // Validate required fields
    if (!itemType || !itemId || !amount) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Validate item exists and get details
    let item: any = null
    if (itemType === 'test_series') {
      // TestSeries is deprecated - no longer supported for purchase
      return NextResponse.json(
        { error: 'Test series purchases are no longer available. Please purchase individual courses instead.' },
        { status: 400 }
      )
    } else if (itemType === 'course') {
      item = await prisma.course.findUnique({
        where: { id: itemId },
      })
    } else {
      return NextResponse.json(
        { error: 'Invalid item type. Only "course" is supported.' },
        { status: 400 }
      )
    }

    if (!item) {
      return NextResponse.json(
        { error: 'Course not found' },
        { status: 404 }
      )
    }

    // Note: Course model doesn't have price/discountPrice fields in the new schema
    // It only has isFree boolean. You may need to add a price field to the Course model
    // or implement a pricing system separately.
    // For now, we'll use the amount provided in the request
    // Verify amount is valid (greater than 0)
    if (amount <= 0) {
      return NextResponse.json(
        { error: 'Invalid amount' },
        { status: 400 }
      )
    }

    // Create purchase record
    const purchase = await prisma.purchase.create({
      data: {
        userId: session.user.id,
        itemType: itemType.toUpperCase() as any,
        itemId,
        itemTitle: itemTitle || item.title,
        amount,
        currency: 'INR',
        status: 'PENDING',
      },
    })

    // Create Razorpay order
    const razorpayOrder = await createRazorpayOrder({
      amount: convertToPaise(amount),
      currency: 'INR',
      receipt: purchase.id,
      notes: {
        purchaseId: purchase.id,
        userId: session.user.id,
        itemType,
        itemId,
      },
    })

    // Update purchase with order ID
    await prisma.purchase.update({
      where: { id: purchase.id },
      data: {
        razorpayOrderId: razorpayOrder.id,
        status: 'PROCESSING',
      },
    })

    return NextResponse.json({
      success: true,
      orderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      purchaseId: purchase.id,
      key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
    })
  } catch (error) {
    console.error('Error creating payment order:', error)
    return NextResponse.json(
      { error: 'Failed to create payment order' },
      { status: 500 }
    )
  }
}

