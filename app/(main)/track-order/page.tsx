"use client"

import { useState } from "react"
import { Metadata } from "next"
import { Package, Search, Truck, CheckCircle2, Clock, MapPin, ShoppingBag, AlertCircle, XCircle, Phone, Mail } from "lucide-react"
import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"
import Link from "next/link"
import { api, type ApiError } from "@/lib/api"

export const metadata: Metadata = {
  title: "Track Order — XerinMarket",
  description: "Track your XerinMarket order in real-time. Enter your order ID to see delivery status and tracking details.",
}

const statusSteps = [
  { key: "pending", label: "Order Placed", icon: ShoppingBag, description: "Your order has been received" },
  { key: "paid", label: "Payment Confirmed", icon: CheckCircle2, description: "Payment has been verified" },
  { key: "processing", label: "Processing", icon: Package, description: "Seller is preparing your order" },
  { key: "shipped", label: "Shipped", icon: Truck, description: "Your order is on the way" },
  { key: "delivered", label: "Delivered", icon: MapPin, description: "Order has been delivered" },
]

const statusOrder = ["pending", "paid", "processing", "shipped", "delivered"]

const cancelledStatuses = ["cancelled", "refunded"]

function formatDate(date: string | null) {
  if (!date) return "—"
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function formatPrice(price: number | string) {
  const num = typeof price === "string" ? parseFloat(price) : price
  return new Intl.NumberFormat("en-TZ", { style: "decimal" }).format(num) + " TZS"
}

interface OrderItem {
  id: string
  product_id: string
  product_name: string
  quantity: number
  unit_price: string | number
  total: string | number
  image_url?: string
}

interface StatusHistory {
  id: string
  status: string
  notes: string | null
  created_at: string
}

interface OrderData {
  id: string
  status: string
  shipping_method_name: string | null
  shipping_carrier: string | null
  estimated_delivery_from: string | null
  estimated_delivery_to: string | null
  currency: string
  subtotal: string | number
  shipping_amount: string | number
  total: string | number
  items: OrderItem[]
  status_history: StatusHistory[]
  created_at: string
  updated_at: string | null
}

export default function TrackOrderPage() {
  const [orderId, setOrderId] = useState("")
  const [order, setOrder] = useState<OrderData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleTrack(e: React.FormEvent) {
    e.preventDefault()
    if (!orderId.trim()) return

    setLoading(true)
    setError(null)
    setOrder(null)

    try {
      const data = await api.get<typeof order>(`/orders/${orderId.trim()}`)
      setOrder(data)
    } catch (err) {
      const e = err as ApiError
      if (e?.status === 404) {
        setError("Order not found. Please check your Order ID and try again.")
      } else if (e?.status === 401 || e?.status === 403) {
        setError("Please log in to track your order.")
      } else if (e?.code === "NETWORK_ERROR" || e?.code === "TIMEOUT") {
        setError("Network error. Please check your connection and try again.")
      } else {
        setError(e?.detail || "Unable to fetch order details. Please try again later.")
      }
    } finally {
      setLoading(false)
    }
  }

  const currentStepIndex = order ? statusOrder.indexOf(order.status) : -1
  const isCancelled = order ? cancelledStatuses.includes(order.status) : false

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 md:py-20">
      {/* Hero */}
      <div className="flex flex-col items-center gap-4 text-center mb-12">
        <div className="flex size-16 items-center justify-center rounded-2xl bg-primary/10">
          <Truck className="size-8 text-primary" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight md:text-4xl">Track Your Order</h1>
        <p className="max-w-lg text-base text-muted-foreground">
          Enter your Order ID below to see real-time tracking status and delivery updates.
        </p>
      </div>

      {/* Search */}
      <form onSubmit={handleTrack} className="mb-8 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={orderId}
            onChange={(e) => setOrderId(e.target.value)}
            placeholder="Enter your Order ID (e.g. 550e8400-e29b-41d4-a716-446655440000)"
            className="w-full rounded-lg border bg-background py-3 pl-11 pr-4 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
          />
        </div>
        <button
          type="submit"
          disabled={loading || !orderId.trim()}
          className={cn(
            buttonVariants({ size: "lg" }),
            "gap-2",
            (loading || !orderId.trim()) && "opacity-50"
          )}
        >
          {loading ? (
            <>
              <div className="size-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
              Tracking...
            </>
          ) : (
            <>
              <Search className="size-4" />
              Track Order
            </>
          )}
        </button>
      </form>

      {/* Error */}
      {error && (
        <div className="mb-8 flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/50 dark:text-red-200">
          <AlertCircle className="size-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Order Result */}
      {order && (
        <div className="flex flex-col gap-6">
          {/* Order Header */}
          <div className="flex items-center justify-between rounded-xl border bg-card p-5">
            <div className="flex flex-col gap-1">
              <span className="text-xs text-muted-foreground">Order ID</span>
              <span className="font-mono text-sm font-medium">{order.id}</span>
            </div>
            <div className="flex flex-col items-end gap-1">
              <span className="text-xs text-muted-foreground">Order Date</span>
              <span className="text-sm font-medium">{formatDate(order.created_at)}</span>
            </div>
          </div>

          {/* Cancelled/Refunded Banner */}
          {isCancelled && (
            <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-950/50">
              <XCircle className="size-5 shrink-0 text-red-600" />
              <div className="flex flex-col">
                <span className="font-semibold text-red-800 dark:text-red-200">
                  Order {order.status === "refunded" ? "Refunded" : "Cancelled"}
                </span>
                <span className="text-sm text-red-600 dark:text-red-300">
                  This order is no longer active. Contact support for assistance.
                </span>
              </div>
            </div>
          )}

          {/* Tracking Steps */}
          {!isCancelled && (
            <div className="rounded-2xl border bg-card p-6">
              <h2 className="mb-6 text-lg font-bold">Tracking Status</h2>
              <div className="relative space-y-6">
                {statusSteps.map((step, index) => {
                  const isCompleted = index <= currentStepIndex
                  const isCurrent = index === currentStepIndex
                  const isPending = index > currentStepIndex

                  return (
                    <div key={step.key} className="relative flex items-start gap-4">
                      {/* Connector line */}
                      {index < statusSteps.length - 1 && (
                        <div
                          className={cn(
                            "absolute left-5 top-12 h-[calc(100%-1rem)] w-0.5",
                            isCompleted ? "bg-primary" : "bg-muted"
                          )}
                        />
                      )}
                      {/* Icon */}
                      <div
                        className={cn(
                          "flex size-10 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
                          isCompleted && "border-primary bg-primary text-primary-foreground",
                          isCurrent && "border-primary bg-primary/10 text-primary ring-4 ring-primary/10",
                          isPending && "border-muted bg-background text-muted-foreground"
                        )}
                      >
                        <step.icon className="size-5" />
                      </div>
                      {/* Content */}
                      <div className="flex flex-col gap-0.5 pt-1.5">
                        <span
                          className={cn(
                            "text-sm font-semibold",
                            isPending && "text-muted-foreground"
                          )}
                        >
                          {step.label}
                        </span>
                        <span className="text-xs text-muted-foreground">{step.description}</span>
                        {isCurrent && order.updated_at && (
                          <span className="mt-1 text-xs font-medium text-primary">
                            Updated: {formatDate(order.updated_at)}
                          </span>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Shipping Info */}
          {!isCancelled && (order.shipping_method_name || order.estimated_delivery_from) && (
            <div className="rounded-2xl border bg-card p-6">
              <h2 className="mb-4 text-lg font-bold">Shipping Details</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                {order.shipping_method_name && (
                  <div className="flex flex-col gap-1">
                    <span className="text-xs text-muted-foreground">Shipping Method</span>
                    <span className="text-sm font-medium">{order.shipping_method_name}</span>
                  </div>
                )}
                {order.shipping_carrier && (
                  <div className="flex flex-col gap-1">
                    <span className="text-xs text-muted-foreground">Carrier</span>
                    <span className="text-sm font-medium">{order.shipping_carrier}</span>
                  </div>
                )}
                {order.estimated_delivery_from && (
                  <div className="flex flex-col gap-1">
                    <span className="text-xs text-muted-foreground">Estimated Delivery From</span>
                    <span className="text-sm font-medium">{formatDate(order.estimated_delivery_from)}</span>
                  </div>
                )}
                {order.estimated_delivery_to && (
                  <div className="flex flex-col gap-1">
                    <span className="text-xs text-muted-foreground">Estimated Delivery To</span>
                    <span className="text-sm font-medium">{formatDate(order.estimated_delivery_to)}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Order Items */}
          <div className="rounded-2xl border bg-card p-6">
            <h2 className="mb-4 text-lg font-bold">Order Items ({order.items.length})</h2>
            <div className="flex flex-col gap-4">
              {order.items.map((item) => (
                <div key={item.id} className="flex items-center gap-4 border-b pb-4 last:border-0 last:pb-0">
                  <div className="size-16 shrink-0 overflow-hidden rounded-lg bg-muted">
                    {item.image_url ? (
                      <img src={item.image_url} alt={item.product_name} className="size-full object-cover" />
                    ) : (
                      <div className="flex size-full items-center justify-center">
                        <Package className="size-6 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <div className="flex flex-1 flex-col gap-1">
                    <span className="text-sm font-semibold">{item.product_name}</span>
                    <span className="text-xs text-muted-foreground">Qty: {item.quantity}</span>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className="text-sm font-medium">{formatPrice(item.unit_price)}</span>
                    <span className="text-xs text-muted-foreground">Total: {formatPrice(item.total)}</span>
                  </div>
                </div>
              ))}
            </div>
            {/* Order Total */}
            <div className="mt-4 flex items-center justify-between border-t pt-4">
              <span className="text-sm font-semibold">Order Total</span>
              <div className="flex flex-col items-end gap-1">
                <span className="text-lg font-bold text-primary">{formatPrice(order.total)}</span>
                <span className="text-xs text-muted-foreground">
                  Subtotal: {formatPrice(order.subtotal)} · Shipping: {formatPrice(order.shipping_amount)}
                </span>
              </div>
            </div>
          </div>

          {/* Status History */}
          {order.status_history && order.status_history.length > 0 && (
            <div className="rounded-2xl border bg-card p-6">
              <h2 className="mb-4 text-lg font-bold">Status History</h2>
              <div className="flex flex-col gap-3">
                {order.status_history
                  .slice()
                  .reverse()
                  .map((history) => (
                    <div key={history.id} className="flex items-start gap-3 border-b pb-3 last:border-0 last:pb-0">
                      <Clock className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                      <div className="flex flex-col gap-0.5">
                        <span className="text-sm font-medium capitalize">{history.status}</span>
                        {history.notes && <span className="text-xs text-muted-foreground">{history.notes}</span>}
                        <span className="text-xs text-muted-foreground">{formatDate(history.created_at)}</span>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Help */}
          <div className="flex flex-col items-center gap-4 rounded-2xl border bg-muted/30 p-6 text-center">
            <h3 className="font-semibold">Need help with your order?</h3>
            <div className="flex gap-4">
              <Link href="/contact" className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline">
                <Mail className="size-4" />
                Contact Support
              </Link>
              <Link href="/help" className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline">
                <Phone className="size-4" />
                Help Center
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!order && !error && !loading && (
        <div className="flex flex-col items-center gap-4 rounded-2xl border bg-muted/30 p-12 text-center">
          <Package className="size-12 text-muted-foreground" />
          <div className="flex flex-col gap-1">
            <h3 className="font-semibold">Enter your Order ID to start tracking</h3>
            <p className="text-sm text-muted-foreground">
              You can find your Order ID in your order confirmation email or in your order history.
            </p>
          </div>
          <Link href="/dashboard/user" className={cn(buttonVariants({ variant: "outline" }), "gap-2")}>
            <ShoppingBag className="size-4" />
            View My Orders
          </Link>
        </div>
      )}
    </div>
  )
}
