"use client"

import * as React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  Minus,
  Plus,
  Trash2,
  ShoppingBag,
  ArrowRight,
  Tag,
  Truck,
  ShieldCheck,
  Store,
} from "lucide-react"
import { Button, buttonVariants } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import { toast } from "@/components/ui/toast"
import { formatPrice } from "@/lib/store-types"
import { useCart } from "@/lib/cart-context"
import { type ApiError } from "@/lib/api"

function getApiError(err: unknown): string {
  const e = err as ApiError
  return e?.detail || "Something went wrong. Please try again."
}

export default function CartPage() {
  const router = useRouter()
  const {
    items,
    count,
    subtotal,
    discount,
    shippingCost,
    total,
    couponCode,
    loading,
    isGuest,
    updateQuantity,
    removeItem,
    applyCoupon,
    removeCoupon,
  } = useCart()
  const [coupon, setCoupon] = useState("")
  const [updating, setUpdating] = useState<string | null>(null)

  const handleUpdateQty = async (itemId: string, delta: number) => {
    const item = items.find((i) => i.id === itemId)
    if (!item) return
    const newQty = Math.max(1, item.quantity + delta)
    setUpdating(itemId)
    try {
      await updateQuantity(itemId, newQty)
    } catch (err) {
      toast.add({ title: "Failed to update", description: getApiError(err), type: "error" })
    } finally {
      setUpdating(null)
    }
  }

  const handleRemove = async (itemId: string) => {
    setUpdating(itemId)
    try {
      await removeItem(itemId)
      toast.add({ title: "Item removed", type: "success" })
    } catch (err) {
      toast.add({ title: "Failed to remove", description: getApiError(err), type: "error" })
    } finally {
      setUpdating(null)
    }
  }

  const handleApplyCoupon = async () => {
    if (!coupon.trim()) return
    try {
      await applyCoupon(coupon.trim())
      toast.add({ title: "Coupon applied!", type: "success" })
      setCoupon("")
    } catch (err) {
      toast.add({ title: "Failed to apply coupon", description: getApiError(err), type: "error" })
    }
  }

  const handleRemoveCoupon = async () => {
    try {
      await removeCoupon()
      toast.add({ title: "Coupon removed", type: "success" })
    } catch (err) {
      toast.add({ title: "Failed to remove coupon", description: getApiError(err), type: "error" })
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-6">
        <Skeleton className="mb-6 h-8 w-48" />
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="flex flex-col gap-3 lg:col-span-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-28 w-full rounded-lg" />
            ))}
          </div>
          <Skeleton className="h-72 w-full rounded-lg" />
        </div>
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-center gap-6 px-4 py-20 text-center">
        <div className="flex size-20 items-center justify-center rounded-full bg-muted">
          <ShoppingBag className="size-10 text-muted-foreground" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Your cart is empty</h1>
          <p className="mt-2 text-muted-foreground">Browse our products and find something you love</p>
        </div>
        <Link href="/products" className={buttonVariants({ size: "lg" })}>
          Start Shopping <ArrowRight className="size-4" />
        </Link>
      </div>
    )
  }

  // Group items by seller
  const sellerGroups = React.useMemo(() => {
    const groups = new Map<string, typeof items>()
    for (const item of items) {
      const sellerId = item.product?.seller_id ?? "unknown"
      if (!groups.has(sellerId)) groups.set(sellerId, [])
      groups.get(sellerId)!.push(item)
    }
    return Array.from(groups.entries()).map(([sellerId, sellerItems]) => ({
      sellerId,
      sellerItems,
      sellerSubtotal: sellerItems.reduce((s, i) => s + Number(i.unit_price) * i.quantity, 0),
    }))
  }, [items])

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <div className="mb-6 flex items-center gap-3">
        <h1 className="text-2xl font-bold tracking-tight">Shopping Cart</h1>
        <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
          {count} {count === 1 ? "item" : "items"}
        </span>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Items grouped by seller */}
        <div className="flex flex-col gap-4 lg:col-span-2">
          {sellerGroups.map(({ sellerId, sellerItems, sellerSubtotal }) => (
            <div key={sellerId} className="flex flex-col gap-2">
              {/* Seller header */}
              <div className="flex items-center justify-between rounded-lg border bg-muted/40 px-3 py-2">
                <div className="flex items-center gap-2">
                  <Store className="size-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Seller {sellerId.slice(0, 8)}</span>
                  <span className="text-xs text-muted-foreground">· {sellerItems.length} {sellerItems.length === 1 ? "item" : "items"}</span>
                </div>
                <span className="text-sm font-semibold text-muted-foreground">{formatPrice(sellerSubtotal)}</span>
              </div>
              {/* Seller items */}
              <div className="flex flex-col gap-2">
                {sellerItems.map((item) => {
                  const product = item.product
                  const image = product?.images?.find((img) => img.is_primary)?.image_url ?? product?.images?.[0]?.image_url
                  return (
                    <Card key={item.id} className="p-3">
                      <div className="flex gap-3">
                        <Link
                          href={`/products/${item.product_id}`}
                          className="relative size-24 shrink-0 overflow-hidden rounded-lg border bg-muted"
                        >
                          {image ? (
                            <img src={image} alt={product?.name ?? "Product"} className="h-full w-full object-cover" />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                              <ShoppingBag className="size-6" />
                            </div>
                          )}
                        </Link>

                        <div className="flex flex-1 flex-col gap-1">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <Link href={`/products/${item.product_id}`} className="line-clamp-2 text-sm font-medium hover:text-primary">
                                {product?.name ?? `Product ${item.product_id.slice(0, 8)}`}
                              </Link>
                              <p className="text-xs text-muted-foreground">{product?.currency ?? "TSh"}</p>
                            </div>
                            <button
                              onClick={() => handleRemove(item.id)}
                              disabled={updating === item.id}
                              className="text-muted-foreground hover:text-destructive disabled:opacity-50"
                            >
                              <Trash2 className="size-4" />
                            </button>
                          </div>

                          <div className="mt-auto flex items-center justify-between">
                            <div className="flex items-center gap-1">
                              <Button variant="outline" size="icon-sm" onClick={() => handleUpdateQty(item.id, -1)} disabled={updating === item.id}>
                                <Minus className="size-3.5" />
                              </Button>
                              <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                              <Button variant="outline" size="icon-sm" onClick={() => handleUpdateQty(item.id, 1)} disabled={updating === item.id}>
                                <Plus className="size-3.5" />
                              </Button>
                            </div>

                            <div className="flex flex-col items-end">
                              <span className="text-sm font-bold text-primary">{formatPrice(Number(item.unit_price) * item.quantity)}</span>
                              <span className="text-xs text-muted-foreground">{formatPrice(Number(item.unit_price))} each</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </Card>
                  )
                })}
              </div>
            </div>
          ))}

          <Link href="/products" className="flex items-center gap-1 text-sm font-medium text-primary hover:underline">
            <ArrowRight className="size-4 rotate-180" />
            Continue Shopping
          </Link>
        </div>

        {/* Summary */}
        <div className="lg:col-span-1">
          <Card className="sticky top-32">
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              {/* Coupon - only for authenticated users */}
              {!isGuest && (
                <>
                  {couponCode ? (
                    <div className="flex items-center justify-between rounded-lg border p-2">
                      <span className="text-sm font-medium text-green-600">Coupon: {couponCode}</span>
                      <button onClick={handleRemoveCoupon} className="text-xs text-destructive hover:underline">Remove</button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Tag className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          placeholder="Coupon code"
                          value={coupon}
                          onChange={(e) => setCoupon(e.target.value)}
                          className="pl-9"
                        />
                      </div>
                      <Button variant="outline" onClick={handleApplyCoupon}>Apply</Button>
                    </div>
                  )}
                </>
              )}

              {isGuest && (
                <div className="flex items-center gap-2 rounded-lg border border-dashed p-3 text-xs text-muted-foreground">
                  <Tag className="size-4 shrink-0" />
                  Sign in at checkout to apply coupons
                </div>
              )}

              <Separator />

              {/* Breakdown */}
              <div className="flex flex-col gap-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-medium">{formatPrice(subtotal)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount</span>
                    <span>-{formatPrice(discount)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Shipping</span>
                  <span className="font-medium">{shippingCost === 0 ? "Calculated at checkout" : formatPrice(shippingCost)}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 rounded-lg bg-primary/5 p-2.5 text-xs text-primary">
                <Truck className="size-4 shrink-0" />
                Delivery prices and any free-shipping threshold are calculated from your address at checkout.
              </div>

              <Separator />

              <div className="flex justify-between text-base font-bold">
                <span>Total</span>
                <span className="text-primary">{formatPrice(total)}</span>
              </div>

              <Button size="lg" className="w-full gap-2" onClick={() => router.push("/checkout")}>
                Proceed to Checkout <ArrowRight className="size-4" />
              </Button>

              <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                <ShieldCheck className="size-3" />
                Secure payment powered by AzamPay
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
