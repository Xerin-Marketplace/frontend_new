"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import {
  CheckCircle2,
  XCircle,
  Loader2,
  ShoppingBag,
  ArrowRight,
  type LucideIcon,
} from "lucide-react"
import { Button, buttonVariants } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { api, type ApiError } from "@/lib/api"
import { toast } from "@/components/ui/toast"

type PaymentStatus = "processing" | "success" | "failed"

type PaymentResponse = {
  id: string
  order_id: string
  status: string
  method: string
  amount: number
  currency: string
}

function getApiError(err: unknown): string {
  const e = err as ApiError
  return e?.detail || "Something went wrong"
}

export default function PaymentProcessingPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const paymentId = searchParams.get("payment_id")
  const orderId = searchParams.get("order_id")

  const [status, setStatus] = useState<PaymentStatus>("processing")
  const [message, setMessage] = useState("Confirming your payment...")
  const [attempts, setAttempts] = useState(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const maxAttempts = 30

  const checkStatus = useCallback(async () => {
    if (!paymentId) {
      setStatus("failed")
      setMessage("No payment ID provided.")
      return
    }

    try {
      const payment = await api.get<PaymentResponse>(`/payments/${paymentId}`)
      if (payment.status === "completed") {
        setStatus("success")
        setMessage("Payment Successful!")
        toast.add({ title: "Payment completed!", type: "success" })
        if (timerRef.current) clearInterval(timerRef.current)
      } else if (payment.status === "failed") {
        setStatus("failed")
        setMessage("Payment was declined. Please try again.")
        if (timerRef.current) clearInterval(timerRef.current)
      } else if (payment.status === "cancelled") {
        setStatus("failed")
        setMessage("Payment was cancelled.")
        if (timerRef.current) clearInterval(timerRef.current)
      }
    } catch {
      // Silently retry
    }
  }, [paymentId])

  useEffect(() => {
    if (!paymentId) {
      setStatus("failed")
      setMessage("No payment ID provided.")
      return
    }

    // Start polling
    timerRef.current = setInterval(() => {
      setAttempts((prev) => {
        if (prev >= maxAttempts) {
          setStatus("failed")
          setMessage("Payment confirmation timed out. Check your order history for updates.")
          if (timerRef.current) clearInterval(timerRef.current)
          return prev
        }
        checkStatus()
        return prev + 1
      })
    }, 3000)

    // Also check immediately
    checkStatus()

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [paymentId, checkStatus])

  return (
    <div className="mx-auto flex max-w-2xl flex-col items-center justify-center gap-8 px-4 py-16">
      {status === "processing" && <ProcessingView message={message} attempts={attempts} />}
      {status === "success" && <SuccessView orderId={orderId} />}
      {status === "failed" && <FailedView message={message} />}
    </div>
  )
}

function ProcessingView({ message, attempts }: { message: string; attempts: number }) {
  return (
    <Card className="w-full max-w-md">
      <CardContent className="flex flex-col items-center gap-6 p-10">
        <div className="relative">
          <div className="flex size-24 items-center justify-center rounded-full bg-primary/10">
            <Loader2 className="size-10 animate-spin text-primary" />
          </div>
          {/* Pulsing ring */}
          <div className="absolute inset-0 animate-ping rounded-full bg-primary/5" />
        </div>

        <div className="text-center">
          <h2 className="text-xl font-bold tracking-tight">Processing Payment</h2>
          <p className="mt-2 text-sm text-muted-foreground">{message}</p>
        </div>

        {/* Animated dots */}
        <div className="flex gap-2">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="size-2.5 animate-bounce rounded-full bg-primary"
              style={{ animationDelay: `${i * 150}ms` }}
            />
          ))}
        </div>

        {attempts > 0 && (
          <p className="text-xs text-muted-foreground">
            Checking payment status... (attempt {attempts})
          </p>
        )}
      </CardContent>
    </Card>
  )
}

function SuccessView({ orderId }: { orderId: string | null }) {
  return (
    <Card className="w-full max-w-md">
      <CardContent className="flex flex-col items-center gap-6 p-10">
        {/* Success animation */}
        <div className="relative flex size-24 items-center justify-center">
          <div className="absolute inset-0 animate-ping rounded-full bg-green-500/20" />
          <div className="flex size-24 items-center justify-center rounded-full bg-gradient-to-br from-green-500 to-green-600 shadow-lg shadow-green-500/30">
            <CheckCircle2 className="size-12 text-white" />
          </div>
        </div>

        <div className="text-center">
          <h2 className="text-2xl font-bold tracking-tight">Payment Successful!</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Your order has been placed and payment confirmed. You will receive a confirmation shortly.
          </p>
        </div>

        <div className="flex w-full flex-col gap-3">
          <Button size="lg" className="w-full gap-2" onClick={() => window.location.href = "/"}>
            <ShoppingBag className="size-4" />
            Continue Shopping
          </Button>
          <Link
            href={orderId ? `/dashboard/user/orders` : "/dashboard/user/orders"}
            className={cn(buttonVariants({ variant: "outline", size: "lg" }), "w-full")}
          >
            View My Orders <ArrowRight className="size-4" />
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}

function FailedView({ message }: { message: string }) {
  return (
    <Card className="w-full max-w-md">
      <CardContent className="flex flex-col items-center gap-6 p-10">
        {/* Failed animation */}
        <div className="relative flex size-24 items-center justify-center">
          <div className="absolute inset-0 animate-ping rounded-full bg-red-500/20" />
          <div className="flex size-24 items-center justify-center rounded-full bg-gradient-to-br from-red-500 to-red-600 shadow-lg shadow-red-500/30">
            <XCircle className="size-12 text-white" />
          </div>
        </div>

        <div className="text-center">
          <h2 className="text-2xl font-bold tracking-tight">Payment Failed</h2>
          <p className="mt-2 text-sm text-muted-foreground">{message}</p>
        </div>

        <div className="flex w-full flex-col gap-3">
          <Button size="lg" className="w-full" onClick={() => window.location.href = "/cart"}>
            Try Again
          </Button>
          <Link href="/" className={cn(buttonVariants({ variant: "outline", size: "lg" }), "w-full")}>
            Back to Home
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}
