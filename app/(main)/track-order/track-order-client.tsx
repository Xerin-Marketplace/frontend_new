"use client"

import { useState } from "react"
import { Package, Search, Truck, CheckCircle2, Clock, MapPin, ShoppingBag, AlertCircle, XCircle, Phone, Mail, Store } from "lucide-react"
import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"
import Link from "next/link"
import { api, type ApiError } from "@/lib/api"
import { formatOrderRef } from "@/lib/store-types"

const statusSteps = [
  { key: "pending", label: "Order Confirmed", icon: ShoppingBag, description: "Your order has been received and confirmed" },
  { key: "paid", label: "Payment Verified", icon: CheckCircle2, description: "Payment has been verified and seller notified" },
  { key: "processing", label: "Seller Preparing", icon: Package, description: "The seller is preparing your order for dispatch" },
  { key: "received_at_hub", label: "Received at Xerin Hub", icon: CheckCircle2, description: "Your order has arrived at the Xerin fulfilment centre" },
  { key: "shipped", label: "Out for Delivery", icon: Truck, description: "Your order is on the way via Xerin Express" },
  { key: "delivered", label: "Delivered", icon: MapPin, description: "Order has been delivered successfully" },
]

const statusOrder = ["pending", "paid", "processing", "received_at_hub", "shipped", "delivered"]

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
  seller_id: string
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

interface ShipmentData {
  id: string
  seller_id: string
  status: string
  carrier_name: string | null
  tracking_number: string | null
  estimated_delivery_from: string | null
  estimated_delivery_to: string | null
  dispatched_at: string | null
  delivered_at: string | null
  tracking_events: { id: string; status: string; notes: string | null; created_at: string }[]
}

interface SellerOrderData {
  id: string
  seller_id: string
  status: string
  seller_subtotal: string | number
  item_count: number
}

interface OrderData {
  id: string
  order_number: string | null
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
  shipments: ShipmentData[]
  seller_orders: SellerOrderData[]
  created_at: string
  updated_at: string | null
}

export default function TrackOrderClient() {
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
      const ref = orderId.trim().toUpperCase()
      let data: typeof order
      if (/^[0-9A-F]{8}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{12}$/i.test(ref)) {
        data = await api.get<typeof order>(`/orders/${ref}`)
      } else {
        data = await api.get<typeof order>(`/orders/ref/${encodeURIComponent(ref)}`)
      }
      setOrder(data)
    } catch (err) {
      const e = err as ApiError
      if (e?.status === 404) {
        setError("Order not found. Please check your Order Reference and try again.")
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
          Enter your Order Reference below to see real-time tracking status and delivery updates.
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
            placeholder="Enter your Order Reference (e.g. XM-260811-00125)"
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
              <span className="text-xs text-muted-foreground">Order Reference</span>
              <span className="font-mono text-sm font-medium">{order.order_number ?? formatOrderRef(order.id, order.created_at)}</span>
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
                    <span className="text-xs text-muted-foreground">Delivery by</span>
                    <span className="text-sm font-medium">{order.shipping_carrier === "Xerin Express" ? "Xerin Express" : order.shipping_carrier}</span>
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

          {/* Per-Seller Tracking */}
          {order.seller_orders && order.seller_orders.length > 0 && (
            <div className="flex flex-col gap-4">
              {order.seller_orders.map((so) => {
                const sellerItems = order.items.filter((i) => i.seller_id === so.seller_id)
                const shipment = order.shipments?.find((s) => s.seller_id === so.seller_id)
                const sellerStatusLabels: Record<string, string> = {
                  new: "New Order",
                  accepted: "Accepted",
                  processing: "Preparing",
                  ready_to_ship: "Ready for Dispatch",
                  shipped: "Shipped",
                  delivered: "Delivered",
                  cancellation_requested: "Cancellation Requested",
                  cancelled: "Cancelled",
                }
                const sellerStatusColors: Record<string, string> = {
                  new: "text-amber-600",
                  accepted: "text-blue-600",
                  processing: "text-blue-600",
                  ready_to_ship: "text-purple-600",
                  shipped: "text-purple-600",
                  delivered: "text-green-600",
                  cancellation_requested: "text-red-600",
                  cancelled: "text-red-600",
                }
                return (
                  <div key={so.id} className="rounded-2xl border bg-card p-6">
                    {/* Seller header */}
                    <div className="mb-4 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Store className="size-5 text-muted-foreground" />
                        <span className="text-sm font-semibold">Seller {so.seller_id.slice(0, 8)}</span>
                        <span className="text-xs text-muted-foreground">· {so.item_count} {so.item_count === 1 ? "item" : "items"}</span>
                      </div>
                      <span className={cn("text-sm font-semibold", sellerStatusColors[so.status] ?? "text-muted-foreground")}>
                        {sellerStatusLabels[so.status] ?? so.status}
                      </span>
                    </div>

                    {/* Seller items */}
                    <div className="flex flex-col gap-3">
                      {sellerItems.map((item) => (
                        <div key={item.id} className="flex items-center gap-4 border-b pb-3 last:border-0 last:pb-0">
                          <div className="size-14 shrink-0 overflow-hidden rounded-lg bg-muted">
                            {item.image_url ? (
                              <img src={item.image_url} alt={item.product_name} className="size-full object-cover" />
                            ) : (
                              <div className="flex size-full items-center justify-center">
                                <Package className="size-5 text-muted-foreground" />
                              </div>
                            )}
                          </div>
                          <div className="flex flex-1 flex-col gap-0.5">
                            <span className="text-sm font-medium">{item.product_name}</span>
                            <span className="text-xs text-muted-foreground">Qty: {item.quantity}</span>
                          </div>
                          <span className="text-sm font-medium">{formatPrice(item.total)}</span>
                        </div>
                      ))}
                    </div>

                    {/* Shipment tracking for this seller */}
                    {shipment && (
                      <div className="mt-4 rounded-lg border bg-muted/30 p-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Truck className="size-4 text-muted-foreground" />
                            <span className="text-xs font-medium">{shipment.carrier_name ?? "Carrier"}</span>
                            {shipment.tracking_number && (
                              <span className="text-xs text-muted-foreground">· {shipment.tracking_number}</span>
                            )}
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {shipment.estimated_delivery_from && `ETA: ${formatDate(shipment.estimated_delivery_from)}`}
                          </span>
                        </div>
                        {shipment.tracking_events && shipment.tracking_events.length > 0 && (
                          <div className="mt-2 flex flex-col gap-1">
                            {shipment.tracking_events.slice(-3).reverse().map((ev) => (
                              <div key={ev.id} className="flex items-center gap-2 text-xs text-muted-foreground">
                                <Clock className="size-3 shrink-0" />
                                <span className="font-medium">{ev.status}</span>
                                {ev.notes && <span>— {ev.notes}</span>}
                                <span>· {formatDate(ev.created_at)}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}

          {/* Fallback: Order Items (when no seller_orders in response) */}
          {(!order.seller_orders || order.seller_orders.length === 0) && (
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
            </div>
          )}

          {/* Order Total */}
          <div className="rounded-2xl border bg-card p-6">
            <div className="flex items-center justify-between border-t pt-4">
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
            <h3 className="font-semibold">Enter your Order Reference to start tracking</h3>
            <p className="text-sm text-muted-foreground">
              You can find your Order Reference in your order confirmation email or in your order history.
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
