'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { CheckCircle2, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface EnrollmentButtonProps {
  seriesId: string
  examId: string
  slug: string
  isEnrolled: boolean
  isFree: boolean
  price: number
  onEnrollSuccess?: () => void
}

export default function EnrollmentButton({
  seriesId: _seriesId,
  examId,
  slug,
  isEnrolled,
  isFree,
  price,
  onEnrollSuccess,
}: EnrollmentButtonProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleEnroll = async () => {
    setLoading(true)

    try {
      const response = await fetch(`/api/test-series/${slug}/enroll`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          examId,
          paymentId: null, // Will integrate payment later
        }),
      })

      const data = await response.json()

      if (response.ok) {
        toast.success(data.message || 'Successfully enrolled!')
        onEnrollSuccess?.()
        router.refresh()
      } else {
        toast.error(data.error || 'Failed to enroll')
      }
    } catch (error) {
      console.error('Enrollment error:', error)
      toast.error('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (isEnrolled) {
    return (
      <Button variant="outline" disabled className="w-full">
        <CheckCircle2 className="w-4 h-4 mr-2" />
        Already Enrolled
      </Button>
    )
  }

  if (isFree) {
    return (
      <Button onClick={handleEnroll} disabled={loading} className="w-full">
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Enrolling...
          </>
        ) : (
          'Enroll Free'
        )}
      </Button>
    )
  }

  return (
    <Button onClick={handleEnroll} disabled={loading} className="w-full">
      {loading ? (
        <>
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          Processing...
        </>
      ) : (
        `Enroll Now - ₹${price.toLocaleString()}`
      )}
    </Button>
  )
}
