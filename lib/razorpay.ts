import Razorpay from 'razorpay'
import crypto from 'crypto'

// Initialize Razorpay instance only if keys are available
export const razorpay = process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET
  ? new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    })
  : null

// Razorpay types
export interface RazorpayOrderOptions {
  amount: number // in paise (100 paise = 1 INR)
  currency?: string
  receipt?: string
  notes?: Record<string, string>
}

export interface RazorpayOrder {
  id: string
  entity: string
  amount: number
  amount_paid: number
  amount_due: number
  currency: string
  receipt: string | null
  status: string
  attempts: number
  notes: Record<string, string>
  created_at: number
}

export interface RazorpayPaymentVerification {
  razorpay_order_id: string
  razorpay_payment_id: string
  razorpay_signature: string
}

/**
 * Create a Razorpay order
 */
export async function createRazorpayOrder(
  options: RazorpayOrderOptions
): Promise<RazorpayOrder> {
  if (!razorpay) {
    throw new Error('Razorpay is not configured. Please set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET environment variables.')
  }

  try {
    const order = await razorpay.orders.create({
      amount: options.amount,
      currency: options.currency || 'INR',
      receipt: options.receipt,
      notes: options.notes,
    })

    return order as RazorpayOrder
  } catch (error) {
    console.error('Error creating Razorpay order:', error)
    throw new Error('Failed to create payment order')
  }
}

/**
 * Verify Razorpay payment signature
 */
export function verifyRazorpaySignature(
  orderId: string,
  paymentId: string,
  signature: string
): boolean {
  try {
    const text = `${orderId}|${paymentId}`
    const secret = process.env.RAZORPAY_KEY_SECRET!

    const generatedSignature = crypto
      .createHmac('sha256', secret)
      .update(text)
      .digest('hex')

    return generatedSignature === signature
  } catch (error) {
    console.error('Error verifying Razorpay signature:', error)
    return false
  }
}

/**
 * Fetch payment details from Razorpay
 */
export async function fetchPaymentDetails(paymentId: string) {
  if (!razorpay) {
    throw new Error('Razorpay is not configured. Please set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET environment variables.')
  }

  try {
    const payment = await razorpay.payments.fetch(paymentId)
    return payment
  } catch (error) {
    console.error('Error fetching payment details:', error)
    throw new Error('Failed to fetch payment details')
  }
}

/**
 * Initiate refund
 */
export async function initiateRefund(
  paymentId: string,
  amount?: number
) {
  if (!razorpay) {
    throw new Error('Razorpay is not configured. Please set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET environment variables.')
  }

  try {
    const refund = await razorpay.payments.refund(paymentId, {
      amount: amount, // If not provided, full refund
    })
    return refund
  } catch (error) {
    console.error('Error initiating refund:', error)
    throw new Error('Failed to initiate refund')
  }
}

/**
 * Convert amount to paise
 */
export function convertToPaise(amount: number): number {
  return Math.round(amount * 100)
}

/**
 * Convert paise to amount
 */
export function convertToAmount(paise: number): number {
  return paise / 100
}
