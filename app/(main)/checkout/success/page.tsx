"use client"

import { useSearchParams } from "next/navigation"
import Link from "next/link"
import {
  CheckCircle2,
  ShoppingBag,
  ArrowRight,
  Package,
} from "lucide-react"
import { Button, buttonVariants } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { formatOrderRef } from "@/lib/store-types"

export default function CheckoutSuccessPage() {
  const searchParams = useSearchParams()
  const orderId = searchParams.get("order_id")
  const orderRef = searchParams.get("ref")
  const paymentId = searchParams.get("payment_id")

  return (
    <div className="mx-auto flex max-w-2xl flex-col items-center justify-center gap-8 px-4 py-16">
      <Card className="w-full max-w-md">
        <CardContent className="flex flex-col items-center gap-6 p-10">
          {/* Success animation */}
          <div className="relative flex size-28 items-center justify-center">
            <div className="absolute inset-0 animate-ping rounded-full bg-green-500/20" />
            <div className="flex size-28 items-center justify-center rounded-full bg-gradient-to-br from-green-500 to-green-600 shadow-lg shadow-green-500/30">
              <CheckCircle2 className="size-14 text-white" />
            </div>
          </div>

          <div className="text-center">
            <h2 className="text-2xl font-bold tracking-tight">
              {paymentId ? "Payment Successful!" : "Order Placed Successfully!"}
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {paymentId
                ? "Your order has been placed and payment confirmed. You will receive a confirmation shortly."
                : "Your order has been placed successfully. Pay with cash when your order is delivered."}
            </p>
          </div>

          {orderId && (
            <div className="w-full rounded-lg border bg-muted/50 p-4">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
                  <Package className="size-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Order Reference</p>
                  <p className="text-sm font-semibold">{orderRef || (orderId ? formatOrderRef(orderId) : "")}</p>
                </div>
              </div>
            </div>
          )}

          <div className="flex w-full flex-col gap-3">
            <Button size="lg" className="w-full gap-2" onClick={() => (window.location.href = "/")}>
              <ShoppingBag className="size-4" />
              Continue Shopping
            </Button>
            <Link
              href="/dashboard/user/orders"
              className={cn(buttonVariants({ variant: "outline", size: "lg" }), "w-full gap-2")}
            >
              View My Orders <ArrowRight className="size-4" />
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
