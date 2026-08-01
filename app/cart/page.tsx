"use client"

import { useState } from "react"
import Link from "next/link"
import {
  Minus,
  Plus,
  Trash2,
  ShoppingBag,
  ArrowRight,
  Tag,
  Truck,
} from "lucide-react"
import { Button, buttonVariants } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Input } from "@/components/ui/input"
import { products } from "@/lib/mock-data"
import { formatPrice } from "@/components/product-card"
import { cn } from "@/lib/utils"

type CartItem = {
  product: typeof products[0]
  qty: number
}

export default function CartPage() {
  const [items, setItems] = useState<CartItem[]>([
    { product: products[0], qty: 1 },
    { product: products[4], qty: 2 },
  ])
  const [coupon, setCoupon] = useState("")
  const [appliedDiscount, setAppliedDiscount] = useState(0)

  const subtotal = items.reduce(
    (sum, item) => sum + item.product.price * item.qty,
    0
  )
  const shipping = subtotal > 50000 ? 0 : 5000
  const total = subtotal - appliedDiscount + shipping

  const updateQty = (id: string, delta: number) => {
    setItems(
      items.map((item) =>
        item.product.id === id
          ? { ...item, qty: Math.max(1, item.qty + delta) }
          : item
      )
    )
  }

  const removeItem = (id: string) => {
    setItems(items.filter((item) => item.product.id !== id))
  }

  const applyCoupon = () => {
    if (coupon.toLowerCase() === "xerin10") {
      setAppliedDiscount(Math.round(subtotal * 0.1))
    }
  }

  if (items.length === 0) {
    return (
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-center gap-6 px-4 py-20 text-center">
        <div className="flex size-20 items-center justify-center rounded-full bg-muted">
          <ShoppingBag className="size-10 text-muted-foreground" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Your cart is empty</h1>
          <p className="mt-2 text-muted-foreground">
            Browse our products and find something you love
          </p>
        </div>
        <Link href="/products" className={buttonVariants({ size: "lg" })}>
          Start Shopping
          <ArrowRight className="size-4" />
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <h1 className="mb-6 text-2xl font-bold tracking-tight">Shopping Cart</h1>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Items */}
        <div className="flex flex-col gap-3 lg:col-span-2">
          {items.map((item) => (
            <Card key={item.product.id} className="p-3">
              <div className="flex gap-3">
                {/* Image */}
                <Link
                  href={`/products/${item.product.id}`}
                  className="relative size-24 shrink-0 overflow-hidden rounded-lg border bg-muted"
                >
                  <img
                    src={item.product.image}
                    alt={item.product.name}
                    className="h-full w-full object-cover"
                  />
                </Link>

                {/* Info */}
                <div className="flex flex-1 flex-col gap-1">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <Link
                        href={`/products/${item.product.id}`}
                        className="line-clamp-2 text-sm font-medium hover:text-primary"
                      >
                        {item.product.name}
                      </Link>
                      <p className="text-xs text-muted-foreground">
                        {item.product.brand} · {item.product.seller}
                      </p>
                    </div>
                    <button
                      onClick={() => removeItem(item.product.id)}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>

                  <div className="mt-auto flex items-center justify-between">
                    {/* Qty */}
                    <div className="flex items-center gap-1">
                      <Button
                        variant="outline"
                        size="icon-sm"
                        onClick={() => updateQty(item.product.id, -1)}
                      >
                        <Minus className="size-3.5" />
                      </Button>
                      <span className="w-8 text-center text-sm font-medium">
                        {item.qty}
                      </span>
                      <Button
                        variant="outline"
                        size="icon-sm"
                        onClick={() => updateQty(item.product.id, 1)}
                      >
                        <Plus className="size-3.5" />
                      </Button>
                    </div>

                    {/* Price */}
                    <div className="flex flex-col items-end">
                      <span className="text-sm font-bold text-primary">
                        {formatPrice(item.product.price * item.qty)}
                      </span>
                      {item.product.originalPrice && (
                        <span className="text-xs text-muted-foreground line-through">
                          {formatPrice(item.product.originalPrice * item.qty)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          ))}

          <Link
            href="/products"
            className="flex items-center gap-1 text-sm font-medium text-primary hover:underline"
          >
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
              {/* Coupon */}
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
                <Button variant="outline" onClick={applyCoupon}>
                  Apply
                </Button>
              </div>
              {appliedDiscount > 0 && (
                <p className="text-xs text-green-600">
                  Coupon applied: 10% discount (try &quot;xerin10&quot;)
                </p>
              )}

              <Separator />

              {/* Breakdown */}
              <div className="flex flex-col gap-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-medium">{formatPrice(subtotal)}</span>
                </div>
                {appliedDiscount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount</span>
                    <span>-{formatPrice(appliedDiscount)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Shipping</span>
                  <span className="font-medium">
                    {shipping === 0 ? "Free" : formatPrice(shipping)}
                  </span>
                </div>
              </div>

              {shipping > 0 && (
                <div className="flex items-center gap-2 rounded-lg bg-primary/5 p-2.5 text-xs text-primary">
                  <Truck className="size-4 shrink-0" />
                  Add {formatPrice(50000 - subtotal)} more for free shipping
                </div>
              )}

              <Separator />

              {/* Total */}
              <div className="flex justify-between text-base font-bold">
                <span>Total</span>
                <span className="text-primary">{formatPrice(total)}</span>
              </div>

              <Button size="lg" className="w-full gap-2">
                Proceed to Checkout
                <ArrowRight className="size-4" />
              </Button>

              <p className="text-center text-xs text-muted-foreground">
                Secure payment powered by XerinPay
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
