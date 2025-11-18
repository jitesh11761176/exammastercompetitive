import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
// PRISMA MIGRATION: This endpoint requires Firebase migration and is currently disabled
import Stripe from 'stripe'

// Define PaymentStatus enum locally (was from Prisma)
enum PaymentStatus {
  PENDING = 'PENDING',
  SUCCEEDED = 'SUCCEEDED',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED',
}

// Configure route to handle raw body for Stripe webhook signature verification
export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  return NextResponse.json(
    { error: 'This endpoint requires Firebase migration and is currently disabled' },
    { status: 503 }
  )
}

// DISABLED - REQUIRES FIREBASE MIGRATION
/*
export async function POST_DISABLED(request: NextRequest) {
  const body = await request.text()
  const sig = request.headers.get('stripe-signature')!

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        
        // Create subscription record
        const userId = session.metadata?.userId
        const plan = session.metadata?.plan
        const billingCycle = session.metadata?.billingCycle

        if (userId && plan) {
          const subscriptionId = session.subscription as string
          const stripeSubscription = await stripe.subscriptions.retrieve(subscriptionId)
          const sub = stripeSubscription as unknown as Stripe.Subscription

          await prisma.subscription.create({
            data: {
              userId,
              plan: plan as any,
              status: 'ACTIVE',
              stripeCustomerId: session.customer as string,
              stripeSubscriptionId: subscriptionId,
              amount: session.amount_total! / 100,
              currency: session.currency!.toUpperCase(),
              billingCycle: billingCycle === 'yearly' ? 'YEARLY' : 'MONTHLY',
              startDate: new Date(),
              endDate: new Date((sub as any).current_period_end * 1000),
              nextBillingDate: new Date((sub as any).current_period_end * 1000),
            },
          })

          // Create payment record
          await prisma.payment.create({
            data: {
              userId,
              amount: session.amount_total! / 100,
              currency: session.currency!.toUpperCase(),
              paymentMethod: 'STRIPE',
              status: PaymentStatus.SUCCEEDED,
              stripePaymentId: session.payment_intent as string,
              description: `${plan} subscription (${billingCycle})`,
              paidAt: new Date(),
            },
          })
        }
        break
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        
        await prisma.subscription.updateMany({
          where: { stripeSubscriptionId: subscription.id },
          data: {
            status: subscription.status === 'active' ? 'ACTIVE' : 'PAST_DUE',
            endDate: new Date((subscription as any).current_period_end * 1000),
            nextBillingDate: new Date((subscription as any).current_period_end * 1000),
          },
        })
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        
        await prisma.subscription.updateMany({
          where: { stripeSubscriptionId: subscription.id },
          data: {
            status: 'CANCELED',
            canceledAt: new Date(),
          },
        })
        break
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice
        
        // Update payment record
        if ((invoice as any).subscription) {
          const subscription = await prisma.subscription.findFirst({
            where: { stripeSubscriptionId: (invoice as any).subscription as string },
          })

          if (subscription) {
            await prisma.payment.create({
              data: {
                userId: subscription.userId,
                subscriptionId: subscription.id,
                amount: invoice.amount_paid / 100,
                currency: invoice.currency.toUpperCase(),
                paymentMethod: 'STRIPE',
                status: PaymentStatus.SUCCEEDED,
                stripePaymentId: (invoice as any).payment_intent as string,
                description: 'Subscription renewal',
                receiptUrl: invoice.hosted_invoice_url,
                paidAt: new Date(),
              },
            })
          }
        }
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        
        await prisma.subscription.updateMany({
          where: { stripeSubscriptionId: (invoice as any).subscription as string },
          data: { status: 'PAST_DUE' },
        })
        break
      }
    }

    return NextResponse.json({ received: true })
  } catch (error: any) {
    console.error('Webhook handler error:', error)
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    )
  }
}

