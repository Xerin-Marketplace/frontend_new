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
  User,
  Mail,
  Phone,
  Store,
  type LucideIcon,
} from "lucide-react"
import { Button, buttonVariants } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { Checkbox } from "@/components/ui/checkbox"
import { cn } from "@/lib/utils"
import { api, type ApiError } from "@/lib/api"
import { toast } from "@/components/ui/toast"
import { formatPrice } from "@/lib/store-types"
import { useAuth } from "@/lib/auth-context"
import { useCart } from "@/lib/cart-context"

function getApiError(err: unknown): string {
  const e = err as ApiError
  return e?.detail || "Something went wrong. Please try again."
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

const TZ_REGIONS = [
  "Dar es Salaam", "Arusha", "Dodoma", "Mwanza", "Zanzibar", "Tanga",
  "Morogoro", "Mbeya", "Kilimanjaro", "Mara", "Singida", "Iringa",
  "Kagera", "Geita", "Songwe", "Ruvuma", "Lindi", "Mtwara",
  "Pwani", "Manyara", "Njombe", "Katavi", "Simiyu", "Shinyanga",
  "Kigoma", "Rukwa", "Tabora", "Kusini Pemba", "Kaskazini Pemba",
  "Kusini Unguja", "Kaskazini Unguja", "Mjini Magharibi",
]

export default function CheckoutPage() {
  const router = useRouter()
  const { isAuthenticated, user, login, register } = useAuth()
  const { items, subtotal, discount, shippingCost, total, couponCode, loading: cartLoading, isGuest, mergeGuestCart } = useCart()
  const [addresses, setAddresses] = useState<Address[]>([])
  const [loading, setLoading] = useState(true)
  const [placing, setPlacing] = useState(false)

  // Auth state for guest
  const [authMode, setAuthMode] = useState<"guest" | "signin" | "signup">("guest")
  const [signInEmail, setSignInEmail] = useState("")
  const [signInPassword, setSignInPassword] = useState("")
  const [signUpFirstName, setSignUpFirstName] = useState("")
  const [signUpLastName, setSignUpLastName] = useState("")
  const [signUpEmail, setSignUpEmail] = useState("")
  const [signUpPhone, setSignUpPhone] = useState("")
  const [signUpPassword, setSignUpPassword] = useState("")
  const [authLoading, setAuthLoading] = useState(false)

  // Shipping form state (for guests)
  const [shipFirstName, setShipFirstName] = useState("")
  const [shipLastName, setShipLastName] = useState("")
  const [shipPhone, setShipPhone] = useState("")
  const [shipEmail, setShipEmail] = useState("")
  const [shipCountry, setShipCountry] = useState("Tanzania")
  const [shipRegion, setShipRegion] = useState("")
  const [shipCity, setShipCity] = useState("")
  const [shipStreet, setShipStreet] = useState("")
  const [shipPostalCode, setShipPostalCode] = useState("")
  const [shipNotes, setShipNotes] = useState("")
  const [saveInfo, setSaveInfo] = useState(true)

  // Saved address selection (for authenticated users)
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null)
  const [useNewAddress, setUseNewAddress] = useState(false)
  // New address form for authenticated users
  const [newAddrCountry, setNewAddrCountry] = useState("Tanzania")
  const [newAddrRegion, setNewAddrRegion] = useState("")
  const [newAddrCity, setNewAddrCity] = useState("")
  const [newAddrStreet, setNewAddrStreet] = useState("")
  const [newAddrPostalCode, setNewAddrPostalCode] = useState("")

  // Payment state
  const [paymentMethod, setPaymentMethod] = useState("mobile_money")
  const [mnoProvider, setMnoProvider] = useState("mpesa")
  const [phoneNumber, setPhoneNumber] = useState("")
  const [notes, setNotes] = useState("")

  const fetchAddresses = useCallback(async () => {
    try {
      const addrRes = await api.get<Address[]>("/addresses").catch(() => [] as Address[])
      setAddresses(addrRes)
      const defaultAddr = addrRes.find((a) => a.is_default) ?? addrRes[0]
      if (defaultAddr) setSelectedAddressId(defaultAddr.id)
    } catch {
      // ignore
    }
  }, [])

  useEffect(() => {
    if (isAuthenticated) {
      Promise.all([fetchAddresses()]).finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [isAuthenticated, fetchAddresses])

  // Pre-fill shipping from user data
  useEffect(() => {
    if (isAuthenticated && user) {
      setShipFirstName(user.first_name || "")
      setShipLastName(user.last_name || "")
      setShipPhone(user.phone || "")
      setShipEmail(user.email || "")
    }
  }, [isAuthenticated, user])

  const handleGuestSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setAuthLoading(true)
    try {
      await login(signInEmail, signInPassword)
      toast.add({ title: "Welcome back!", type: "success" })
      await mergeGuestCart()
      await fetchAddresses()
      setAuthMode("guest")
    } catch (err) {
      toast.add({ title: "Sign in failed", description: getApiError(err), type: "error" })
    } finally {
      setAuthLoading(false)
    }
  }

  const handleGuestSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setAuthLoading(true)
    try {
      await register({
        first_name: signUpFirstName,
        last_name: signUpLastName,
        email: signUpEmail,
        phone: signUpPhone,
        password: signUpPassword,
      })
      toast.add({ title: "Account created!", description: "Please verify your phone to continue.", type: "success" })
      // Auto-login after register
      try {
        await login(signUpEmail, signUpPassword)
        await mergeGuestCart()
        await fetchAddresses()
        setAuthMode("guest")
      } catch {
        toast.add({ title: "Please sign in", description: "Account created but login failed. Please sign in.", type: "info" })
        setAuthMode("signin")
      }
    } catch (err) {
      toast.add({ title: "Registration failed", description: getApiError(err), type: "error" })
    } finally {
      setAuthLoading(false)
    }
  }

  const validateShipping = (): boolean => {
    if (isAuthenticated && selectedAddressId && !useNewAddress) return true

    const required = isGuest || useNewAddress
    if (!required) return true

    const fields = isGuest
      ? [shipFirstName, shipLastName, shipPhone, shipRegion, shipCity, shipStreet]
      : [newAddrRegion, newAddrCity, newAddrStreet]

    if (fields.some((f) => !f.trim())) {
      toast.add({ title: "Missing information", description: "Please fill in all required shipping fields.", type: "warning" })
      return false
    }
    return true
  }

  const handlePlaceOrder = async () => {
    if (!validateShipping()) return
    if (paymentMethod === "mobile_money" && !phoneNumber.trim()) {
      toast.add({ title: "Please enter your phone number", type: "warning" })
      return
    }

    setPlacing(true)
    try {
      let addressId = selectedAddressId

      // For guests or new address — create address first
      if (isGuest || useNewAddress) {
        const addrData = isGuest
          ? {
              country: shipCountry,
              region: shipRegion,
              city: shipCity,
              street: shipStreet,
              postal_code: shipPostalCode || null,
              is_default: true,
            }
          : {
              country: newAddrCountry,
              region: newAddrRegion,
              city: newAddrCity,
              street: newAddrStreet,
              postal_code: newAddrPostalCode || null,
              is_default: addresses.length === 0,
            }

        const addr = await api.post<Address>("/addresses", addrData)
        addressId = addr.id
      }

      if (!addressId) {
        toast.add({ title: "Please select a delivery address", type: "warning" })
        setPlacing(false)
        return
      }

      // Step 1: Create the order
      const order = await api.post<OrderResponse>("/orders", {
        shipping_address_id: addressId,
        notes: (isGuest ? shipNotes : notes).trim() || undefined,
      })

      // Step 2: Handle payment
      if (paymentMethod === "cash_on_delivery") {
        toast.add({ title: "Order placed successfully!", description: "Pay with cash when your order arrives.", type: "success" })
        router.push(`/checkout/success?order_id=${order.id}`)
        return
      }

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
        window.location.href = checkoutUrl
      } else {
        router.push(`/checkout/processing?payment_id=${payment.id}&order_id=${order.id}`)
      }
    } catch (err) {
      toast.add({ title: "Failed to place order", description: getApiError(err), type: "error" })
    } finally {
      setPlacing(false)
    }
  }

  if (cartLoading || loading) {
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

  if (items.length === 0) {
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

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <Link href="/cart" className={cn(buttonVariants({ variant: "ghost", size: "icon" }))}>
          <ArrowLeft className="size-5" />
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">Checkout</h1>
        {isGuest && (
          <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-950/40 dark:text-amber-400">
            Guest Checkout
          </span>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left: Items + Address + Payment */}
        <div className="flex flex-col gap-6 lg:col-span-2">
          {/* Guest auth prompt */}
          {isGuest && (
            <Card className={cn("border-primary/30", authMode !== "guest" && "ring-1 ring-primary/20")}>
              <CardContent className="p-4">
                {authMode === "guest" ? (
                  <div className="flex flex-col items-center gap-3 text-center sm:flex-row sm:text-left">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                      <User className="size-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">Have an account?</p>
                      <p className="text-xs text-muted-foreground">Sign in for faster checkout, saved addresses, and order tracking.</p>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => setAuthMode("signin")}>Sign In</Button>
                      <Button size="sm" onClick={() => setAuthMode("signup")}>Sign Up</Button>
                    </div>
                  </div>
                ) : authMode === "signin" ? (
                  <form className="flex flex-col gap-3" onSubmit={handleGuestSignIn}>
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold">Sign In</h3>
                      <button type="button" onClick={() => setAuthMode("guest")} className="text-xs text-muted-foreground hover:text-foreground">
                        Continue as guest
                      </button>
                    </div>
                    <Input type="email" placeholder="Email" value={signInEmail} onChange={(e) => setSignInEmail(e.target.value)} required />
                    <Input type="password" placeholder="Password" value={signInPassword} onChange={(e) => setSignInPassword(e.target.value)} required />
                    <Button type="submit" loading={authLoading} size="sm">Sign In</Button>
                  </form>
                ) : (
                  <form className="flex flex-col gap-3" onSubmit={handleGuestSignUp}>
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold">Create Account</h3>
                      <button type="button" onClick={() => setAuthMode("guest")} className="text-xs text-muted-foreground hover:text-foreground">
                        Continue as guest
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <Input placeholder="First name" value={signUpFirstName} onChange={(e) => setSignUpFirstName(e.target.value)} required />
                      <Input placeholder="Last name" value={signUpLastName} onChange={(e) => setSignUpLastName(e.target.value)} required />
                    </div>
                    <Input type="email" placeholder="Email" value={signUpEmail} onChange={(e) => setSignUpEmail(e.target.value)} required />
                    <Input type="tel" placeholder="Phone (e.g. 0712345678)" value={signUpPhone} onChange={(e) => setSignUpPhone(e.target.value)} required />
                    <Input type="password" placeholder="Password (min 8 chars)" value={signUpPassword} onChange={(e) => setSignUpPassword(e.target.value)} required minLength={8} />
                    <Button type="submit" loading={authLoading} size="sm">Create Account & Continue</Button>
                  </form>
                )}
              </CardContent>
            </Card>
          )}

          {/* Order Items */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <ShoppingBag className="size-4 text-primary" />
                Order Items ({items.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              {items.map((item) => {
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
              {/* Saved addresses for authenticated users */}
              {isAuthenticated && addresses.length > 0 && !useNewAddress && (
                <>
                  {addresses.map((addr) => {
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
                  })}
                  <button
                    onClick={() => setUseNewAddress(true)}
                    className="flex items-center justify-center gap-2 rounded-lg border border-dashed py-3 text-sm text-muted-foreground hover:border-primary hover:text-primary"
                  >
                    <MapPin className="size-4" />
                    Use a new address
                  </button>
                </>
              )}

              {/* New address form for authenticated users with no addresses, or when useNewAddress is true */}
              {isAuthenticated && (addresses.length === 0 || useNewAddress) && (
                <div className="flex flex-col gap-3 rounded-lg border p-4">
                  {useNewAddress && (
                    <button
                      onClick={() => setUseNewAddress(false)}
                      className="mb-1 flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                    >
                      <ArrowLeft className="size-3" /> Use saved address
                    </button>
                  )}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="mb-1 block text-xs font-medium">Country</label>
                      <Input value={newAddrCountry} onChange={(e) => setNewAddrCountry(e.target.value)} readOnly className="bg-muted/50" />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium">Region *</label>
                      <select
                        value={newAddrRegion}
                        onChange={(e) => setNewAddrRegion(e.target.value)}
                        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
                      >
                        <option value="">Select region</option>
                        {TZ_REGIONS.map((r) => <option key={r} value={r}>{r}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="mb-1 block text-xs font-medium">City *</label>
                      <Input placeholder="e.g. Kinondoni" value={newAddrCity} onChange={(e) => setNewAddrCity(e.target.value)} />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium">Postal Code</label>
                      <Input placeholder="e.g. 14110" value={newAddrPostalCode} onChange={(e) => setNewAddrPostalCode(e.target.value)} />
                    </div>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium">Street Address *</label>
                    <Input placeholder="e.g. House No. 12, Mlimani Street" value={newAddrStreet} onChange={(e) => setNewAddrStreet(e.target.value)} />
                  </div>
                </div>
              )}

              {/* Guest shipping form */}
              {isGuest && (
                <div className="flex flex-col gap-4 rounded-lg border p-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="mb-1 block text-xs font-medium">First Name *</label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                        <Input className="pl-8" placeholder="John" value={shipFirstName} onChange={(e) => setShipFirstName(e.target.value)} required />
                      </div>
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium">Last Name *</label>
                      <Input placeholder="Doe" value={shipLastName} onChange={(e) => setShipLastName(e.target.value)} required />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="mb-1 block text-xs font-medium">Phone *</label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                        <Input className="pl-8" type="tel" placeholder="0712345678" value={shipPhone} onChange={(e) => setShipPhone(e.target.value)} required />
                      </div>
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium">Email</label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                        <Input className="pl-8" type="email" placeholder="john@example.com" value={shipEmail} onChange={(e) => setShipEmail(e.target.value)} />
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="mb-1 block text-xs font-medium">Country</label>
                      <Input value={shipCountry} onChange={(e) => setShipCountry(e.target.value)} readOnly className="bg-muted/50" />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium">Region *</label>
                      <select
                        value={shipRegion}
                        onChange={(e) => setShipRegion(e.target.value)}
                        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
                      >
                        <option value="">Select region</option>
                        {TZ_REGIONS.map((r) => <option key={r} value={r}>{r}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="mb-1 block text-xs font-medium">City *</label>
                      <Input placeholder="e.g. Kinondoni" value={shipCity} onChange={(e) => setShipCity(e.target.value)} required />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium">Postal Code</label>
                      <Input placeholder="e.g. 14110" value={shipPostalCode} onChange={(e) => setShipPostalCode(e.target.value)} />
                    </div>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium">Street Address *</label>
                    <Input placeholder="e.g. House No. 12, Mlimani Street" value={shipStreet} onChange={(e) => setShipStreet(e.target.value)} required />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium">Order Notes (Optional)</label>
                    <Input placeholder="Any special delivery instructions?" value={shipNotes} onChange={(e) => setShipNotes(e.target.value)} />
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox id="save-info" checked={saveInfo} onCheckedChange={(v) => setSaveInfo(!!v)} />
                    <label htmlFor="save-info" className="text-xs text-muted-foreground">
                      Save my information for faster checkout next time
                    </label>
                  </div>
                </div>
              )}

              {/* No addresses for authenticated user */}
              {isAuthenticated && addresses.length === 0 && !useNewAddress && (
                <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed py-8 text-center">
                  <MapPin className="size-8 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">No addresses found</p>
                    <p className="text-xs text-muted-foreground">Add an address below to proceed</p>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => setUseNewAddress(true)}>
                    Add Address
                  </Button>
                </div>
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

              {paymentMethod === "card" && (
                <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-900 dark:bg-amber-950/30">
                  <Info className="mt-0.5 size-4 shrink-0 text-amber-600" />
                  <p className="text-sm text-amber-700 dark:text-amber-400">
                    You will be redirected to AzamPay&apos;s secure checkout page to enter your card details.
                  </p>
                </div>
              )}

              {paymentMethod === "cash_on_delivery" && (
                <div className="flex items-start gap-3 rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-900 dark:bg-blue-950/30">
                  <Truck className="mt-0.5 size-4 shrink-0 text-blue-600" />
                  <p className="text-sm text-blue-700 dark:text-blue-400">
                    Pay with cash when your order is delivered. Please have the exact amount ready.
                  </p>
                </div>
              )}

              {isAuthenticated && !isGuest && (
                <div>
                  <label className="mb-2 block text-sm font-medium">Order Notes (Optional)</label>
                  <Input
                    placeholder="Any special instructions?"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>
              )}
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
                  <span className="font-medium">{shippingCost === 0 ? "Calculated after" : formatPrice(shippingCost)}</span>
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
                disabled={placing}
                onClick={handlePlaceOrder}
              >
                {placing ? (
                  "Processing..."
                ) : (
                  <>
                    <Lock className="size-4" />
                    {isGuest ? "Place Order" : `Pay ${formatPrice(total)}`}
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

              {isGuest && (
                <div className="flex items-start gap-2 rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground">
                  <Info className="mt-0.5 size-3.5 shrink-0" />
                  <span>
                    You can checkout as a guest. Your shipping details will be used for this order.
                    {saveInfo && " We'll save your cart for next time."}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
