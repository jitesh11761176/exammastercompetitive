import Stripe from 'stripe'

const STRIPE_KEY = process.env.STRIPE_SECRET_KEY

if (!STRIPE_KEY) {
  // Avoid failing builds when env is missing; runtime calls should ensure envs are set
  console.warn('STRIPE_SECRET_KEY is not defined. Initializing Stripe with a dummy key for build-time only.')
}

export const stripe = new Stripe(STRIPE_KEY || 'sk_test_dummy_key', {
  apiVersion: '2025-10-29.clover',
  typescript: true,
})

// Subscription plan configuration
export const SUBSCRIPTION_PLANS = {
  FREE: {
    name: 'Free',
    price: 0,
    stripePriceId: null,
    features: [
      '10 practice tests per month',
      '100 questions per month',
      'Basic analytics',
      'Community support',
    ],
    limits: {
      testsPerMonth: 10,
      questionsPerMonth: 100,
    },
  },
  BASIC: {
    name: 'Basic',
    monthlyPrice: 9.99,
    yearlyPrice: 99.99,
    stripePriceId: {
      monthly: process.env.STRIPE_PRICE_ID_BASIC_MONTHLY,
      yearly: process.env.STRIPE_PRICE_ID_BASIC_YEARLY,
    },
    features: [
      'Unlimited practice tests',
      '1000 questions per month',
      'Advanced analytics',
      'Email support',
      'Download test reports',
    ],
    limits: {
      testsPerMonth: -1, // unlimited
      questionsPerMonth: 1000,
    },
  },
  PREMIUM: {
    name: 'Premium',
    monthlyPrice: 19.99,
    yearlyPrice: 199.99,
    stripePriceId: {
      monthly: process.env.STRIPE_PRICE_ID_PREMIUM_MONTHLY,
      yearly: process.env.STRIPE_PRICE_ID_PREMIUM_YEARLY,
    },
    features: [
      'Everything in Basic',
      'Unlimited questions',
      'AI-powered insights',
      'Priority email support',
      'Study planner with reminders',
      'Access to daily challenges',
      'Downloadable solutions',
    ],
    limits: {
      testsPerMonth: -1,
      questionsPerMonth: -1,
    },
  },
  ULTIMATE: {
    name: 'Ultimate',
    monthlyPrice: 49.99,
    yearlyPrice: 499.99,
    stripePriceId: {
      monthly: process.env.STRIPE_PRICE_ID_ULTIMATE_MONTHLY,
      yearly: process.env.STRIPE_PRICE_ID_ULTIMATE_YEARLY,
    },
    features: [
      'Everything in Premium',
      '1-on-1 doubt clearing sessions',
      'Personalized study plans',
      'Early access to new features',
      'Dedicated support manager',
      'Custom test creation',
      'Bulk question downloads',
    ],
    limits: {
      testsPerMonth: -1,
      questionsPerMonth: -1,
    },
  },
} as const

export type SubscriptionPlanKey = keyof typeof SUBSCRIPTION_PLANS
