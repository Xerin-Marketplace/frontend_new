"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  ArrowLeft,
  ArrowRight,
  CreditCard,
  Smartphone,
  Truck,
  MapPin,
  ShoppingBag,
  Lock,
  CheckCircle2,
  Info,
  Loader2,
  type LucideIcon,
} from "lucide-react"
import { Button, buttonVariants } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import { api, type ApiError } from "@/lib/api"
import { toast } from "@/components/ui/toast"
import { formatPrice, type ApiProduct } from "@/lib/store-types"
import { useAuth } from "@/lib/auth-context"

function getApiError(err: unknown): string {
  const e = err as ApiError
  return e?.detail || "Something went wrong. Please try again."
}

type CartItem = {
  id: string
  product_id: string
  quantity: number
  product: ApiProduct
  unit_price: number
  total_price: number
}

type CartResponse = {
  id: string
  items: CartItem[]
  subtotal: number
  discount: number
  shipping_cost: number
  total: number
  coupon_code: string | null
}

type Address = {
  id: string
  country: string
  region: string
  city: string
  street: string
  postal_code: string | null
  is_default: boolean
}

type OrderResponse = {
  id: string
  order_number: string
  status: string
  total: number
  currency: string
}

type PaymentResponse = {
  id: string
  order_id: string
  status: string
  method: string
  provider: string | null
  amount: number
  currency: string
  provider_response?: {
    checkout_url?: string
    [key: string]: unknown
  }
}

const MNO_PROVIDERS = [
  { value: "mpesa", label: "M-Pesa", color: "text-green-600", dot: "bg-green-500" },
  { value: "airtel", label: "Airtel Money", color: "text-red-600", dot: "bg-red-500" },
  { value: "tigo", label: "Tigo Pesa", color: "text-blue-600", dot: "bg-blue-500" },
  { value: "halopesa", label: "Halo Pesa", color: "text-emerald-600", dot: "bg-emerald-500" },
  { value: "azampesa", label: "Azam Pesa", color: "text-orange-600", dot: "bg-orange-500" },
]

const PAYMENT_TYPES: {
  value: string
  label: string
  icon: LucideIcon
  color: string
  bg: string
  border: string
}[] = [
  { value: "mobile_money", label: "Mobile Money", icon: Smartphone, color: "text-green-600", bg: "bg-green-50 dark:bg-green-950/30", border: "border-green-500" },
  { value: "card", label: "Card", icon: CreditCard, color: "text-amber-600", bg: "bg-amber-50 dark:bg-amber-950/30", border: "border-amber-500" },
  { value: "cash_on_delivery", label: "Cash on Delivery", icon: Truck, color: "text-blue-600", bg: "bg-blue-50 dark:bg-blue-950/30", border: "border-blue-500" },
]

export default function CheckoutPage() {
  const router = useRouter()
  const { isAuthenticated } = useAuth()
  const [cart, setCart] = useState<CartResponse | null>(null)
  const [addresses, setAddresses] = useState<Address[]>([])
  const [loading, setLoading] = useState(true)
  const [placing, setPlacing] = useState(false)

  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null)
  const [paymentMethod, setPaymentMethod] = useState("mobile_money")
  const [mnoProvider, setMnoProvider] = useState("mpesa")
  const [phoneNumber, setPhoneNumber] = useState("")
  const [notes, setNotes] = useState("")

  const fetchInitialData = useCallback(async () => {
    setLoading(true)
    try {
      const [cartRes, addrRes] = await Promise.all([
        api.get<CartResponse>("/cart"),
        api.get<Address[]>("/addresses").catch(() => [] as Address[]),
      ])
      setCart(cartRes)
      setAddresses(addrRes)
      const defaultAddr = addrRes.find((a) => a.is_default) ?? addrRes[0]
      if (defaultAddr) setSelectedAddressId(defaultAddr.id)
    } catch (err) {
      toast.add({ title: "Failed to load checkout data", description: getApiError(err), type: "error" })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (isAuthenticated) {
      fetchInitialData()
    } else {
      setLoading(false)
    }
  }, [isAuthenticated, fetchInitialData])

  const handlePlaceOrder = async () => {
    if (!selectedAddressId) {
      toast.add({ title: "Please select a delivery address", type: "warning" })
      return
    }
    if (paymentMethod === "mobile_money" && !phoneNumber.trim()) {
      toast.add({ title: "Please enter your phone number", type: "warning" })
      return
    }

    setPlacing(true)
    try {
      // Step 1: Create the order
      const order = await api.post<OrderResponse>("/orders", {
        shipping_address_id: selectedAddressId,
        notes: notes.trim() || undefined,
      })

      // Step 2: Handle payment
      if (paymentMethod === "cash_on_delivery") {
        toast.add({ title: "Order placed successfully!", description: "Pay with cash when your order arrives.", type: "success" })
        router.push(`/checkout/success?order_id=${order.id}`)
        return
      }

      // Initiate payment via backend
      const payment = await api.post<PaymentResponse>("/payments/initiate", {
        order_id: order.id,
        method: paymentMethod,
        provider: paymentMethod === "mobile_money" ? mnoProvider : undefined,
        phone_number: paymentMethod === "mobile_money" ? phoneNumber.trim() : undefined,
      })

      toast.add({ title: "Payment initiated", description: "Completing your payment...", type: "info" })

      const checkoutUrl = payment.provider_response?.checkout_url

      if (payment.status === "completed") {
        toast.add({ title: "Payment successful!", type: "success" })
        router.push(`/checkout/success?order_id=${order.id}&payment_id=${payment.id}`)
      } else if (checkoutUrl) {
        // Card payment - redirect to AzamPay hosted checkout
        window.location.href = checkoutUrl
      } else {
        // Mobile money - redirect to processing page
        router.push(`/checkout/processing?payment_id=${payment.id}&order_id=${order.id}`)
      }
    } catch (err) {
      toast.add({ title: "Failed to place order", description: getApiError(err), type: "error" })
    } finally {
      setPlacing(false)
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-center gap-6 px-4 py-20 text-center">
        <div className="flex size-20 items-center justify-center rounded-full bg-muted">
          <ShoppingBag className="size-10 text-muted-foreground" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Please sign in</h1>
          <p className="mt-2 text-muted-foreground">Sign in to checkout your items</p>
        </div>
        <Link href="/auth?tab=login" className={buttonVariants({ size: "lg" })}>Sign In</Link>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-6">
        <Skeleton className="mb-6 h-8 w-40" />
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="flex flex-col gap-3 lg:col-span-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-24 w-full rounded-lg" />
            ))}
          </div>
          <Skeleton className="h-80 w-full rounded-lg" />
        </div>
      </div>
    )
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-center gap-6 px-4 py-20 text-center">
        <div className="flex size-20 items-center justify-center rounded-full bg-muted">
          <ShoppingBag className="size-10 text-muted-foreground" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Your cart is empty</h1>
          <p className="mt-2 text-muted-foreground">Add items to your cart before checkout</p>
        </div>
        <Link href="/products" className={buttonVariants({ size: "lg" })}>
          Browse Products <ArrowRight className="size-4" />
        </Link>
      </div>
    )
  }

  const subtotal = Number(cart.subtotal)
  const discount = Number(cart.discount ?? 0)
  const shipping = Number(cart.shipping_cost ?? 0)
  const total = Number(cart.total)

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <Link href="/cart" className={cn(buttonVariants({ variant: "ghost", size: "icon" }))}>
          <ArrowLeft className="size-5" />
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">Checkout</h1>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left: Items + Address + Payment */}
        <div className="flex flex-col gap-6 lg:col-span-2">
          {/* Order Items */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <ShoppingBag className="size-4 text-primary" />
                Order Items ({cart.items.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              {cart.items.map((item) => {
                const product = item.product
                const image = product?.images?.find((img) => img.is_primary)?.image_url ?? product?.images?.[0]?.image_url
                return (
                  <div key={item.id} className="flex gap-3 rounded-lg border p-3">
                    <div className="relative size-14 shrink-0 overflow-hidden rounded-lg border bg-muted">
                      {image ? (
                        <img src={image} alt={product?.name ?? "Product"} className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                          <ShoppingBag className="size-5" />
                        </div>
                      )}
                    </div>
                    <div className="flex flex-1 flex-col justify-between">
                      <Link href={`/products/${item.product_id}`} className="line-clamp-1 text-sm font-medium hover:text-primary">
                        {product?.name ?? `Product ${item.product_id.slice(0, 8)}`}
                      </Link>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">Qty: {item.quantity}</span>
                        <span className="text-sm font-bold text-primary">{formatPrice(Number(item.total_price))}</span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </CardContent>
          </Card>

          {/* Delivery Address */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <MapPin className="size-4 text-primary" />
                Delivery Address
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              {addresses.length === 0 ? (
                <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed py-8 text-center">
                  <MapPin className="size-8 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">No addresses found</p>
                    <p className="text-xs text-muted-foreground">Add an address to proceed with checkout</p>
                  </div>
                  <Link href="/dashboard/user/addresses" className={buttonVariants({ variant: "outline", size: "sm" })}>
                    Add Address
                  </Link>
                </div>
              ) : (
                addresses.map((addr) => {
                  const isSelected = selectedAddressId === addr.id
                  return (
                    <button
                      key={addr.id}
                      onClick={() => setSelectedAddressId(addr.id)}
                      className={cn(
                        "flex items-start gap-3 rounded-lg border p-4 text-left transition-all",
                        isSelected
                          ? "border-primary bg-primary/5 ring-1 ring-primary"
                          : "border-border hover:border-primary/40"
                      )}
                    >
                      <div className={cn(
                        "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
                        isSelected ? "border-primary bg-primary" : "border-muted-foreground/30"
                      )}>
                        {isSelected && <CheckCircle2 className="size-3 text-primary-foreground" />}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">{addr.street}</span>
                          {addr.is_default && (
                            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">Default</span>
                          )}
                        </div>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {addr.city}, {addr.region}, {addr.country}
                          {addr.postal_code ? ` • ${addr.postal_code}` : ""}
                        </p>
                      </div>
                    </button>
                  )
                })
              )}
            </CardContent>
          </Card>

          {/* Payment Method */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <CreditCard className="size-4 text-primary" />
                Payment Method
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              {/* Payment type selector */}
              <div className="grid grid-cols-3 gap-3">
                {PAYMENT_TYPES.map((type) => {
                  const isSelected = paymentMethod === type.value
                  const Icon = type.icon
                  return (
                    <button
                      key={type.value}
                      onClick={() => setPaymentMethod(type.value)}
                      className={cn(
                        "flex flex-col items-center gap-2 rounded-xl border p-4 transition-all",
                        isSelected
                          ? cn(type.border, type.bg, "ring-1 ring-offset-0")
                          : "border-border hover:border-primary/30"
                      )}
                    >
                      <div className={cn(
                        "flex size-10 items-center justify-center rounded-lg",
                        isSelected ? type.color : "text-muted-foreground",
                        isSelected ? type.bg : "bg-muted"
                      )}>
                        <Icon className="size-5" />
                      </div>
                      <span className={cn(
                        "text-xs font-semibold",
                        isSelected ? type.color : "text-muted-foreground"
                      )}>
                        {type.label}
                      </span>
                    </button>
                  )
                })}
              </div>

              {/* MNO provider selector */}
              {paymentMethod === "mobile_money" && (
                <div className="flex flex-col gap-3">
                  <div>
                    <label className="mb-2 block text-sm font-medium">Select Provider</label>
                    <div className="flex flex-wrap gap-2">
                      {MNO_PROVIDERS.map((provider) => {
                        const isSelected = mnoProvider === provider.value
                        return (
                          <button
                            key={provider.value}
                            onClick={() => setMnoProvider(provider.value)}
                            className={cn(
                              "flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-all",
                              isSelected
                                ? "border-primary bg-primary/5"
                                : "border-border hover:border-primary/30"
                            )}
                          >
                            <span className={cn("size-2.5 rounded-full", provider.dot)} />
                            <span className={isSelected ? "text-primary" : "text-muted-foreground"}>
                              {provider.label}
                            </span>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium">Phone Number</label>
                    <Input
                      type="tel"
                      placeholder="e.g. 0712345678"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      className="max-w-xs"
                    />
                  </div>
                </div>
              )}

              {/* Card info banner */}
              {paymentMethod === "card" && (
                <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-900 dark:bg-amber-950/30">
                  <Info className="mt-0.5 size-4 shrink-0 text-amber-600" />
                  <p className="text-sm text-amber-700 dark:text-amber-400">
                    You will be redirected to AzamPay&apos;s secure checkout page to enter your card details.
                  </p>
                </div>
              )}

              {/* COD info banner */}
              {paymentMethod === "cash_on_delivery" && (
                <div className="flex items-start gap-3 rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-900 dark:bg-blue-950/30">
                  <Truck className="mt-0.5 size-4 shrink-0 text-blue-600" />
                  <p className="text-sm text-blue-700 dark:text-blue-400">
                    Pay with cash when your order is delivered. Please have the exact amount ready.
                  </p>
                </div>
              )}

              {/* Order notes */}
              <div>
                <label className="mb-2 block text-sm font-medium">Order Notes (Optional)</label>
                <Input
                  placeholder="Any special instructions?"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right: Summary */}
        <div className="lg:col-span-1">
          <Card className="sticky top-32">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Lock className="size-4 text-primary" />
                Order Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
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
                  <span className="font-medium">{shipping === 0 ? "Free" : formatPrice(shipping)}</span>
                </div>
              </div>

              <Separator />

              <div className="flex justify-between text-base font-bold">
                <span>Total</span>
                <span className="text-primary">{formatPrice(total)}</span>
              </div>

              <Button
                size="lg"
                className="w-full gap-2"
                loading={placing}
                disabled={placing || !selectedAddressId}
                onClick={handlePlaceOrder}
              >
                {placing ? (
                  "Processing..."
                ) : (
                  <>
                    <Lock className="size-4" />
                    Pay {formatPrice(total)}
                  </>
                )}
              </Button>

              <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                <Lock className="size-3" />
                Secure payment powered by AzamPay
              </div>

              {placing && (
                <div className="flex items-center justify-center gap-2 rounded-lg bg-primary/5 p-3 text-sm text-primary">
                  <Loader2 className="size-4 animate-spin" />
                  Processing your payment securely...
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
