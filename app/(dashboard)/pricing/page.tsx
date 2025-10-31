'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Check, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

const plans = [
  {
    name: 'Free',
    plan: 'FREE',
    price: { monthly: 0, yearly: 0 },
    description: 'Perfect for getting started',
    features: [
      '10 practice tests per month',
      '100 questions per month',
      'Basic analytics',
      'Community support',
    ],
    cta: 'Current Plan',
    disabled: true,
  },
  {
    name: 'Basic',
    plan: 'BASIC',
    price: { monthly: 9.99, yearly: 99.99 },
    description: 'For serious learners',
    features: [
      'Unlimited practice tests',
      '1000 questions per month',
      'Advanced analytics',
      'Email support',
      'Download test reports',
    ],
    cta: 'Get Started',
    popular: false,
  },
  {
    name: 'Premium',
    plan: 'PREMIUM',
    price: { monthly: 19.99, yearly: 199.99 },
    description: 'Most popular choice',
    features: [
      'Everything in Basic',
      'Unlimited questions',
      'AI-powered insights',
      'Priority email support',
      'Study planner with reminders',
      'Access to daily challenges',
      'Downloadable solutions',
    ],
    cta: 'Get Premium',
    popular: true,
  },
  {
    name: 'Ultimate',
    plan: 'ULTIMATE',
    price: { monthly: 49.99, yearly: 499.99 },
    description: 'For the dedicated',
    features: [
      'Everything in Premium',
      '1-on-1 doubt clearing sessions',
      'Personalized study plans',
      'Early access to new features',
      'Dedicated support manager',
      'Custom test creation',
      'Bulk question downloads',
    ],
    cta: 'Go Ultimate',
    popular: false,
  },
]

export default function PricingPage() {
  const router = useRouter()
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly')
  const [loading, setLoading] = useState<string | null>(null)

  const handleSubscribe = async (plan: string) => {
    if (plan === 'FREE') return

    setLoading(plan)
    try {
      const res = await fetch('/api/payments/stripe/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan, billingCycle }),
      })

      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        alert('Failed to create checkout session')
      }
    } catch (error) {
      alert('Something went wrong')
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">Choose Your Plan</h1>
        <p className="text-xl text-muted-foreground mb-8">
          Unlock your full potential with our premium features
        </p>

        {/* Billing Toggle */}
        <div className="inline-flex items-center rounded-lg border p-1 bg-muted/50">
          <button
            onClick={() => setBillingCycle('monthly')}
            className={`px-6 py-2 rounded-md text-sm font-medium transition-colors ${
              billingCycle === 'monthly'
                ? 'bg-background shadow-sm'
                : 'text-muted-foreground'
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setBillingCycle('yearly')}
            className={`px-6 py-2 rounded-md text-sm font-medium transition-colors ${
              billingCycle === 'yearly'
                ? 'bg-background shadow-sm'
                : 'text-muted-foreground'
            }`}
          >
            Yearly
            <span className="ml-2 text-xs text-green-600 font-semibold">
              Save 17%
            </span>
          </button>
        </div>
      </div>

      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4 max-w-7xl mx-auto">
        {plans.map((planItem) => (
          <Card
            key={planItem.plan}
            className={`relative flex flex-col ${
              planItem.popular
                ? 'border-primary shadow-lg scale-105'
                : ''
            }`}
          >
            {planItem.popular && (
              <Badge className="absolute -top-3 left-1/2 -translate-x-1/2">
                Most Popular
              </Badge>
            )}

            <CardHeader>
              <CardTitle className="text-2xl">{planItem.name}</CardTitle>
              <CardDescription>{planItem.description}</CardDescription>
              <div className="mt-4">
                <span className="text-4xl font-bold">
                  ${planItem.price[billingCycle]}
                </span>
                {planItem.plan !== 'FREE' && (
                  <span className="text-muted-foreground">
                    /{billingCycle === 'monthly' ? 'mo' : 'yr'}
                  </span>
                )}
              </div>
            </CardHeader>

            <CardContent className="flex-grow">
              <ul className="space-y-3">
                {planItem.features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>

            <CardFooter>
              <Button
                onClick={() => handleSubscribe(planItem.plan)}
                disabled={planItem.disabled || loading === planItem.plan}
                className="w-full"
                variant={planItem.popular ? 'default' : 'outline'}
              >
                {loading === planItem.plan ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  planItem.cta
                )}
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      <div className="mt-16 text-center text-sm text-muted-foreground">
        <p>All plans include a 7-day free trial. No credit card required.</p>
        <p className="mt-2">Cancel anytime. No questions asked.</p>
      </div>
    </div>
  )
}
