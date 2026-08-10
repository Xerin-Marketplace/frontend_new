"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import {
  CheckCircle2,
  XCircle,
  ShoppingBag,
  ArrowRight,
} from "lucide-react"
import { Button, buttonVariants } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"
import { api } from "@/lib/api"
import { toast } from "@/components/ui/toast"
import { 
  Item, 
  ItemContent, 
  ItemMedia, 
  ItemTitle, 
  ItemDescription 
} from "@/components/ui/item"
import { Spinner } from "@/components/ui/spinner"
import { formatPrice } from "@/lib/store-types"

type PaymentStatus = "processing" | "success" | "failed"

type PaymentResponse = {
  id: string
  order_id: string
  status: string
  method: string
  amount: number
  currency: string
}

export default function PaymentProcessingPage() {
  const searchParams = useSearchParams()
  const paymentId = searchParams.get("payment_id")
  const orderId = searchParams.get("order_id")

  const [status, setStatus] = useState<PaymentStatus>("processing")
  const [message, setMessage] = useState("Inahakiki malipo yako...")
  const [attempts, setAttempts] = useState(0)
  const [amount, setAmount] = useState<number | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const maxAttempts = 30

  const checkStatus = useCallback(async () => {
    if (!paymentId) {
      setStatus("failed")
      setMessage("Hatujaweza kupata namba ya malipo.")
      return
    }

    try {
      const payment = await api.get<PaymentResponse>(`/payments/${paymentId}`)
      setAmount(payment.amount)
      if (payment.status === "completed") {
        setStatus("success")
        setMessage("Malipo yamekamilika kikamilifu!")
        toast.add({ title: "Malipo yamepokelewa!", type: "success" })
        if (timerRef.current) clearInterval(timerRef.current)
      } else if (payment.status === "failed") {
        setStatus("failed")
        setMessage("Malipo yamekataliwa. Tafadhali jaribu tena.")
        if (timerRef.current) clearInterval(timerRef.current)
      } else if (payment.status === "cancelled") {
        setStatus("failed")
        setMessage("Muamala umeghairiwa.")
        if (timerRef.current) clearInterval(timerRef.current)
      }
    } catch {
      // Silently retry
    }
  }, [paymentId])

  useEffect(() => {
    if (!paymentId) {
      setStatus("failed")
      setMessage("Hatujaweza kupata namba ya malipo.")
      return
    }

    // Start polling
    timerRef.current = setInterval(() => {
      setAttempts((prev) => {
        if (prev >= maxAttempts) {
          setStatus("failed")
          setMessage("Muda wa uhakiki umeisha. Tafadhali kagua historia ya maagizo yako.")
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
      {status === "processing" && (
        <ProcessingView 
          message={message} 
          attempts={attempts} 
          amount={amount} 
        />
      )}
      {status === "success" && <SuccessView orderId={orderId} />}
      {status === "failed" && <FailedView message={message} />}
    </div>
  )
}

function ProcessingView({ 
  message, 
  attempts, 
  amount 
}: { 
  message: string; 
  attempts: number;
  amount: number | null;
}) {
  return (
    <Card className="w-full max-w-md">
      <CardContent className="flex flex-col items-center gap-6 py-12">
        <div className="relative">
          <div className="absolute inset-0 animate-[spin_3s_linear_infinite] rounded-full border-4 border-dashed border-primary/10" />
          <div className="relative flex size-24 items-center justify-center rounded-full bg-primary/5">
            <Spinner className="size-7 text-primary" />
          </div>
          <div className="absolute inset-0 animate-ping rounded-full bg-primary/5" />
        </div>

        <div className="w-full space-y-4">
          <div className="text-center space-y-2">
            <h2 className="text-base font-medium tracking-tight">Subiri Kidogo...</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Tafadhali usifunge ukurasa huu wakati tunahakiki muamala wako.
            </p>
          </div>

          <Item variant="muted">
            <ItemMedia>
              <Spinner className="size-5 text-primary" />
            </ItemMedia>
            <ItemContent>
              <ItemTitle className="text-sm font-medium text-foreground">
                Inachakata Malipo
              </ItemTitle>
              <ItemDescription>
                Jaribio la {attempts + 1} la uhakiki
              </ItemDescription>
            </ItemContent>
            {amount !== null && (
              <ItemContent className="flex-none justify-end">
                <span className="text-sm font-bold tabular-nums text-primary">
                  {formatPrice(amount)}
                </span>
              </ItemContent>
            )}
          </Item>
        </div>

        <div className="w-full space-y-2">
          <div className="flex justify-between text-xs font-medium text-muted-foreground">
            <span>Maendeleo</span>
            <span>{attempts}/30</span>
          </div>
          <Progress value={(attempts / 30) * 100} className="h-1" />
        </div>
      </CardContent>
    </Card>
  )
}

function SuccessView({ orderId }: { orderId: string | null }) {
  return (
    <Card className="w-full max-w-md">
      <CardContent className="flex flex-col items-center gap-6 py-12">
        {/* Success animation */}
        <div className="relative flex size-20 items-center justify-center">
          <div className="absolute inset-0 animate-ping rounded-full bg-green-500/20" />
          <div className="flex size-20 items-center justify-center rounded-full bg-green-500">
            <CheckCircle2 className="size-10 text-white" />
          </div>
        </div>

        <div className="text-center space-y-2">
          <h2 className="text-base font-medium tracking-tight">Malipo Yamekamilika!</h2>
          <p className="text-sm text-muted-foreground">
            Agizo lako limewekwa na malipo yamethibitishwa. Utapokea uthibitisho hivi karibuni.
          </p>
        </div>

        <div className="flex w-full flex-col gap-3">
          <Button size="lg" className="w-full gap-2" onClick={() => window.location.href = "/"}>
            <ShoppingBag className="size-4" />
            Endelea na Ununuzi
          </Button>
          <Link
            href={orderId ? `/dashboard/user/orders` : "/dashboard/user/orders"}
            className={cn(buttonVariants({ variant: "outline", size: "lg" }), "w-full")}
          >
            Angalia Maagizo <ArrowRight className="size-4" />
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}

function FailedView({ message }: { message: string }) {
  return (
    <Card className="w-full max-w-md">
      <CardContent className="flex flex-col items-center gap-6 py-12">
        {/* Failed animation */}
        <div className="relative flex size-20 items-center justify-center">
          <div className="absolute inset-0 animate-ping rounded-full bg-red-500/20" />
          <div className="flex size-20 items-center justify-center rounded-full bg-red-500">
            <XCircle className="size-10 text-white" />
          </div>
        </div>

        <div className="text-center space-y-2">
          <h2 className="text-base font-medium tracking-tight">Malipo Yamekataliwa</h2>
          <p className="text-sm text-muted-foreground">{message}</p>
        </div>

        <div className="flex w-full flex-col gap-3">
          <Button size="lg" className="w-full" onClick={() => window.location.href = "/cart"}>
            Jaribu Tena
          </Button>
          <Link href="/" className={cn(buttonVariants({ variant: "outline", size: "lg" }), "w-full")}>
            Rudi Nyumbani
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}
