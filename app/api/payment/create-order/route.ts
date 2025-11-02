import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
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
      item = await prisma.testSeries.findUnique({
        where: { id: itemId },
      })
    } else if (itemType === 'course') {
      item = await prisma.course.findUnique({
        where: { id: itemId },
      })
    }

    if (!item) {
      return NextResponse.json(
        { error: 'Item not found' },
        { status: 404 }
      )
    }

    // Verify amount matches
    const expectedAmount = item.discountPrice || item.price
    if (amount !== expectedAmount) {
      return NextResponse.json(
        { error: 'Amount mismatch' },
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
