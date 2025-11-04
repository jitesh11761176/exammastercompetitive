"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { Loader2, CreditCard, Lock } from "lucide-react"

interface PaymentButtonProps {
  itemType: "TEST_SERIES" | "COURSE"
  itemId: string
  itemTitle: string
  amount: number // in rupees
  buttonText?: string
  variant?: "default" | "outline" | "ghost"
  size?: "default" | "sm" | "lg"
  fullWidth?: boolean
  onSuccess?: () => void
}

// Declare Razorpay types
declare global {
  interface Window {
    Razorpay: any
  }
}

export function PaymentButton({
  itemType,
  itemId,
  itemTitle,
  amount,
  buttonText = "Enroll Now",
  variant = "default",
  size = "default",
  fullWidth = false,
  onSuccess
}: PaymentButtonProps) {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handlePayment = async () => {
    try {
      setIsLoading(true)

      // Step 1: Create Razorpay order
      const orderResponse = await fetch("/api/payment/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          itemType,
          itemId,
          amount
        })
      })

      if (!orderResponse.ok) {
        const error = await orderResponse.json()
        throw new Error(error.error || "Failed to create order")
      }

      const { order, purchase } = await orderResponse.json()

      // Step 2: Load Razorpay script if not loaded
      if (!window.Razorpay) {
        const script = document.createElement("script")
        script.src = "https://checkout.razorpay.com/v1/checkout.js"
        script.async = true
        document.body.appendChild(script)
        
        await new Promise((resolve, reject) => {
          script.onload = resolve
          script.onerror = reject
        })
      }

      // Step 3: Initialize Razorpay checkout
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
        amount: order.amount,
        currency: order.currency,
        name: "ExamMaster Competitive",
        description: itemTitle,
        order_id: order.id,
        handler: async function (response: any) {
          try {
            // Step 4: Verify payment on backend
            const verifyResponse = await fetch("/api/payment/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                purchaseId: purchase.id
              })
            })

            if (!verifyResponse.ok) {
              throw new Error("Payment verification failed")
            }

            const result = await verifyResponse.json()

            toast.success("🎉 Payment Successful!", {
              description: `You're now enrolled in ${itemTitle}`
            })

            // Call success callback if provided
            if (onSuccess) {
              onSuccess()
            }

            // Redirect based on item type
            if (itemType === "COURSE") {
              router.push(`/courses/${result.enrollment.courseId}`)
            } else {
              router.push(`/test-series/${result.enrollment.testSeriesId}`)
            }
            
            router.refresh()
          } catch (error) {
            console.error("Payment verification error:", error)
            toast.error("Payment verification failed", {
              description: "Please contact support if amount was deducted"
            })
          } finally {
            setIsLoading(false)
          }
        },
        prefill: {
          email: "", // Will be auto-filled from session on backend
          contact: ""
        },
        theme: {
          color: "#3b82f6" // blue-500
        },
        modal: {
          ondismiss: function () {
            setIsLoading(false)
            toast.info("Payment cancelled")
          }
        }
      }

      const rzp = new window.Razorpay(options)
      rzp.open()

    } catch (error) {
      console.error("Payment initiation error:", error)
      toast.error("Failed to initiate payment", {
        description: error instanceof Error ? error.message : "Please try again"
      })
      setIsLoading(false)
    }
  }

  return (
    <Button
      onClick={handlePayment}
      disabled={isLoading}
      variant={variant}
      size={size}
      className={fullWidth ? "w-full" : ""}
    >
      {isLoading ? (
        <>
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          Processing...
        </>
      ) : (
        <>
          {variant === "outline" ? (
            <Lock className="h-4 w-4 mr-2" />
          ) : (
            <CreditCard className="h-4 w-4 mr-2" />
          )}
          {buttonText} - ₹{amount.toLocaleString("en-IN")}
        </>
      )}
    </Button>
  )
}
