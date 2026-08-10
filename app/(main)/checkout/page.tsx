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
  User,
  Mail,
  ShieldCheck,
  Package,
  Plus,
  Trash2,
  Home,
  Building2,
  Star,
  type LucideIcon,
} from "lucide-react"
import { Button, buttonVariants } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import { api, type ApiError } from "@/lib/api"
import { toast } from "@/components/ui/toast"
import { formatPrice } from "@/lib/store-types"
import { useAuth } from "@/lib/auth-context"
import { useCart } from "@/lib/cart-context"
import { PhoneInput } from "@/components/ui/phone-input"
import { 
  Item, 
  ItemContent, 
  ItemMedia, 
  ItemTitle,
  ItemDescription,
  ItemGroup
} from "@/components/ui/item"
import { Spinner } from "@/components/ui/spinner"
import { Progress } from "@/components/ui/progress"
import {
  Questionnaire,
  QuestionnaireChoice,
  QuestionnaireChoices,
  QuestionnaireDescription,
  QuestionnaireItem,
  QuestionnaireTitle,
} from "@/components/ui/questionnaire"

function getApiError(err: unknown): string {
  const e = err as ApiError
  return e?.detail || "Something went wrong. Please try again."
}

type Address = {
  id: string
  label: string | null
  recipient_name: string | null
  recipient_phone: string | null
  country: string
  region: string
  district: string | null
  ward: string | null
  city: string
  street: string
  landmark: string | null
  postal_code: string | null
  is_default: boolean
}

type PaginatedAddressResponse = {
  total: number
  page: number
  page_size: number
  results: Address[]
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

type ShippingQuoteOption = {
  rate_id: string
  method_id: string
  method_name: string
  carrier_name: string | null
  amount: number
  currency: string
  min_delivery_days: number
  max_delivery_days: number
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

const STEPS = [
  { id: 0, label: "Shipping", icon: MapPin },
  { id: 1, label: "Payment", icon: CreditCard },
  { id: 2, label: "Review", icon: CheckCircle2 },
]

export default function CheckoutPage() {
  const router = useRouter()
  const { isAuthenticated, user, login, register } = useAuth()
  const { items, subtotal, discount, shippingCost, total, couponCode, loading: cartLoading, isGuest, mergeGuestCart } = useCart()
  const [addresses, setAddresses] = useState<Address[]>([])
  const [loading, setLoading] = useState(true)
  const [placing, setPlacing] = useState(false)
  const [step, setStep] = useState(0)

  // Auth state for guest (at review step)
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signup")
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
  const [shipDistrict, setShipDistrict] = useState("")
  const [shipWard, setShipWard] = useState("")
  const [shipCity, setShipCity] = useState("")
  const [shipStreet, setShipStreet] = useState("")
  const [shipLandmark, setShipLandmark] = useState("")
  const [shipPostalCode, setShipPostalCode] = useState("")
  const [shipNotes, setShipNotes] = useState("")

  // Saved address selection (for authenticated users)
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null)
  const [useNewAddress, setUseNewAddress] = useState(false)
  const [savingAddress, setSavingAddress] = useState(false)
  // New address form for authenticated users
  const [newAddrLabel, setNewAddrLabel] = useState("")
  const [newAddrRecipientName, setNewAddrRecipientName] = useState("")
  const [newAddrRecipientPhone, setNewAddrRecipientPhone] = useState("")
  const [newAddrCountry, setNewAddrCountry] = useState("Tanzania")
  const [newAddrRegion, setNewAddrRegion] = useState("")
  const [newAddrDistrict, setNewAddrDistrict] = useState("")
  const [newAddrWard, setNewAddrWard] = useState("")
  const [newAddrCity, setNewAddrCity] = useState("")
  const [newAddrStreet, setNewAddrStreet] = useState("")
  const [newAddrLandmark, setNewAddrLandmark] = useState("")
  const [newAddrPostalCode, setNewAddrPostalCode] = useState("")
  const [newAddrIsDefault, setNewAddrIsDefault] = useState(false)

  // Shipping quote state
  const [shippingQuotes, setShippingQuotes] = useState<ShippingQuoteOption[]>([])
  const [selectedRateId, setSelectedRateId] = useState<string | null>(null)
  const [loadingQuotes, setLoadingQuotes] = useState(false)

  // Compute actual shipping cost from selected quote
  const selectedQuote = shippingQuotes.find((q) => q.rate_id === selectedRateId)
  const computedShippingCost = selectedQuote ? Number(selectedQuote.amount) : 0
  const computedTotal = subtotal - discount + computedShippingCost

  // Payment state
  const [paymentMethod, setPaymentMethod] = useState<string | null>(null)
  const [mnoProvider, setMnoProvider] = useState("mpesa")
  const [phoneNumber, setPhoneNumber] = useState("")
  const [notes, setNotes] = useState("")
  const [paymentSubStep, setPaymentSubStep] = useState(0)
  const [checkingStatus, setCheckingStatus] = useState(false)
  const [statusAttempts, setStatusAttempts] = useState(0)
  const [activePaymentId, setActivePaymentId] = useState<string | null>(null)

  useEffect(() => {
    let timer: ReturnType<typeof setInterval>
    if (checkingStatus && activePaymentId) {
      timer = setInterval(async () => {
        try {
          const res = await api.get<PaymentResponse>(`/payments/${activePaymentId}`)
          if (res.status === "completed") {
            setCheckingStatus(false)
            toast.add({ title: "Payment received!", type: "success" })
            router.push(`/checkout/success?order_id=${res.order_id}&payment_id=${res.id}`)
          } else if (res.status === "failed") {
            setCheckingStatus(false)
            toast.add({ title: "Payment declined", type: "error" })
          }
          setStatusAttempts((p) => p + 1)
          if (statusAttempts > 30) {
            setCheckingStatus(false)
            toast.add({ title: "Verification is taking too long", description: "Please check your order history later.", type: "warning" })
          }
        } catch {
          // ignore
        }
      }, 3000)
    }
    return () => clearInterval(timer)
  }, [checkingStatus, activePaymentId, statusAttempts, router])

  const fetchAddresses = useCallback(async () => {
    try {
      const res = await api.get<PaginatedAddressResponse>("/addresses").catch(() => null)
      const addrList = res?.results ?? []
      setAddresses(addrList)
      const defaultAddr = addrList.find((a) => a.is_default) ?? addrList[0]
      if (defaultAddr) setSelectedAddressId(defaultAddr.id)
    } catch {
      // ignore
    }
  }, [])

  const handleDeleteAddress = async (id: string) => {
    try {
      await api.delete(`/addresses/${id}`)
      setAddresses((prev) => prev.filter((a) => a.id !== id))
      if (selectedAddressId === id) {
        const remaining = addresses.filter((a) => a.id !== id)
        setSelectedAddressId(remaining.find((a) => a.is_default)?.id ?? remaining[0]?.id ?? null)
      }
      toast.add({ title: "Address deleted", type: "success" })
    } catch (err) {
      toast.add({ title: "Failed to delete address", description: getApiError(err), type: "error" })
    }
  }

  const handleSetDefault = async (id: string) => {
    try {
      await api.post(`/addresses/${id}/default`)
      setAddresses((prev) => prev.map((a) => ({ ...a, is_default: a.id === id })))
      toast.add({ title: "Default address set", type: "success" })
    } catch (err) {
      toast.add({ title: "Failed to set default address", description: getApiError(err), type: "error" })
    }
  }

  const handleSaveNewAddress = async () => {
    if (!newAddrRegion.trim() || !newAddrCity.trim() || !newAddrStreet.trim()) {
      toast.add({ title: "Please fill in all required fields", type: "warning" })
      return
    }
    setSavingAddress(true)
    try {
      const addr = await api.post<Address>("/addresses", {
        label: newAddrLabel.trim() || null,
        recipient_name: newAddrRecipientName.trim() || null,
        recipient_phone: newAddrRecipientPhone.trim() || null,
        country: newAddrCountry,
        region: newAddrRegion,
        district: newAddrDistrict.trim() || null,
        ward: newAddrWard.trim() || null,
        city: newAddrCity,
        street: newAddrStreet,
        landmark: newAddrLandmark.trim() || null,
        postal_code: newAddrPostalCode.trim() || null,
        is_default: newAddrIsDefault || addresses.length === 0,
      })
      setAddresses((prev) => [...prev, addr])
      setSelectedAddressId(addr.id)
      setUseNewAddress(false)
      setNewAddrLabel("")
      setNewAddrRecipientName("")
      setNewAddrRecipientPhone("")
      setNewAddrRegion("")
      setNewAddrDistrict("")
      setNewAddrWard("")
      setNewAddrCity("")
      setNewAddrStreet("")
      setNewAddrLandmark("")
      setNewAddrPostalCode("")
      setNewAddrIsDefault(false)
      toast.add({ title: "New address saved", type: "success" })
      await fetchShippingQuotes(addr.id)
    } catch (err) {
      toast.add({ title: "Failed to save address", description: getApiError(err), type: "error" })
    } finally {
      setSavingAddress(false)
    }
  }

  const fetchShippingQuotes = useCallback(async (addressId: string) => {
    setLoadingQuotes(true)
    try {
      const quotes = await api.post<ShippingQuoteOption[]>("/shipping/quote", {
        address_id: addressId,
        subtotal: subtotal,
        weight_kg: 0,
      })
      setShippingQuotes(quotes)
      if (quotes.length > 0) {
        setSelectedRateId(quotes[0].rate_id)
      } else {
        setSelectedRateId(null)
      }
    } catch (err) {
      console.error("Shipping quote error:", err)
      setShippingQuotes([])
      setSelectedRateId(null)
    } finally {
      setLoadingQuotes(false)
    }
  }, [subtotal])

  useEffect(() => {
    if (isAuthenticated) {
      Promise.all([fetchAddresses()]).finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [isAuthenticated, fetchAddresses])

  // Auto-fetch shipping quotes when selected address changes
  useEffect(() => {
    if (isAuthenticated && selectedAddressId && !useNewAddress) {
      setSelectedRateId(null)
      fetchShippingQuotes(selectedAddressId)
    } else {
      setShippingQuotes([])
      setSelectedRateId(null)
    }
  }, [isAuthenticated, selectedAddressId, useNewAddress, fetchShippingQuotes])

  // Pre-fill shipping from user data
  useEffect(() => {
    if (isAuthenticated && user) {
      setShipFirstName(user.first_name || "")
      setShipLastName(user.last_name || "")
      setShipPhone(user.phone || "")
      setShipEmail(user.email || "")
    }
  }, [isAuthenticated, user])

  // Pre-fill signup form from guest shipping info
  useEffect(() => {
    if (isGuest) {
      setSignUpFirstName(shipFirstName)
      setSignUpLastName(shipLastName)
      setSignUpEmail(shipEmail)
      setSignUpPhone(shipPhone)
    }
  }, [isGuest, shipFirstName, shipLastName, shipEmail, shipPhone])

  // Auto-switch to signup with pre-filled data when guest reaches review step
  useEffect(() => {
    if (step === 2 && isGuest) {
      setAuthMode("signup")
    }
  }, [step, isGuest])

  const handleGuestSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setAuthLoading(true)
    try {
      await login(signInEmail, signInPassword)
      toast.add({ title: "Welcome back!", type: "success" })
      await mergeGuestCart()
      await fetchAddresses()
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
      toast.add({ title: "Account created!", description: "Welcome to XerinMarket.", type: "success" })
      try {
        await login(signUpEmail, signUpPassword)
        await mergeGuestCart()
        await fetchAddresses()
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
    if (isAuthenticated && selectedAddressId && !useNewAddress) {
      if (!selectedRateId) {
        toast.add({ title: "Please select a shipping method", type: "warning" })
        return false
      }
      return true
    }

    const required = isGuest || useNewAddress
    if (!required) return true

    const fields = isGuest
      ? [shipFirstName, shipLastName, shipPhone, shipRegion, shipCity, shipStreet]
      : [newAddrRegion, newAddrCity, newAddrStreet]

    if (fields.some((f) => !f.trim())) {
      toast.add({ title: "Information incomplete", description: "Please fill in all required fields.", type: "warning" })
      return false
    }
    if (useNewAddress && !selectedRateId) {
      toast.add({ title: "Please select a shipping method", type: "warning" })
      return false
    }
    return true
  }

  const validatePayment = (): boolean => {
    if (paymentMethod === "mobile_money" && !phoneNumber.trim()) {
      toast.add({ title: "Please enter your phone number", type: "warning" })
      return false
    }
    return true
  }

  const handleNextStep = () => {
    if (step === 0 && !validateShipping()) return
    if (step === 1 && !validatePayment()) return
    setStep((s) => Math.min(s + 1, 2))
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const handlePrevStep = () => {
    setStep((s) => Math.max(s - 1, 0))
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const handlePlaceOrder = async () => {
    if (!validateShipping()) return
    if (!validatePayment()) return

    setPlacing(true)
    try {
      let addressId = selectedAddressId
      let rateId = selectedRateId

      // For guests or new address — create address first
      if (isGuest || useNewAddress) {
        const addrData = isGuest
          ? {
              recipient_name: `${shipFirstName} ${shipLastName}`.trim() || null,
              recipient_phone: shipPhone || null,
              country: shipCountry,
              region: shipRegion,
              district: shipDistrict.trim() || null,
              ward: shipWard.trim() || null,
              city: shipCity,
              street: shipStreet,
              landmark: shipLandmark.trim() || null,
              postal_code: shipPostalCode || null,
              is_default: true,
            }
          : {
              label: newAddrLabel.trim() || null,
              recipient_name: newAddrRecipientName.trim() || null,
              recipient_phone: newAddrRecipientPhone.trim() || null,
              country: newAddrCountry,
              region: newAddrRegion,
              district: newAddrDistrict.trim() || null,
              ward: newAddrWard.trim() || null,
              city: newAddrCity,
              street: newAddrStreet,
              landmark: newAddrLandmark.trim() || null,
              postal_code: newAddrPostalCode || null,
              is_default: newAddrIsDefault || addresses.length === 0,
            }

        const addr = await api.post<Address>("/addresses", addrData)
        addressId = addr.id

        // Fetch shipping quotes for the new address
        const quotes = await api.post<ShippingQuoteOption[]>("/shipping/quote", {
          address_id: addr.id,
          subtotal: subtotal,
          weight_kg: 0,
        })

        if (quotes.length === 0) {
          toast.add({ title: "No shipping options available for this address", type: "error" })
          setPlacing(false)
          return
        }

        rateId = quotes[0].rate_id
      }

      if (!addressId) {
        toast.add({ title: "Please select a delivery address", type: "warning" })
        setPlacing(false)
        return
      }

      if (!rateId) {
        toast.add({ title: "Please select a shipping method", type: "warning" })
        setPlacing(false)
        return
      }

      // Step 1: Create the order
      const order = await api.post<OrderResponse>("/orders", {
        shipping_address_id: addressId,
        shipping_rate_id: rateId,
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

      if (paymentMethod === "mobile_money") {
        setActivePaymentId(payment.id)
        setCheckingStatus(true)
        setStatusAttempts(0)
        toast.add({ title: "Payment Request Sent", description: "Please check your phone to enter your PIN.", type: "info" })
      } else if (paymentMethod === "card") {
        const checkoutUrl = payment.provider_response?.checkout_url
        if (checkoutUrl) {
          window.location.href = checkoutUrl
        } else {
          router.push(`/checkout/processing?payment_id=${payment.id}&order_id=${order.id}`)
        }
      } else {
        router.push(`/checkout/success?order_id=${order.id}&payment_id=${payment.id}`)
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

      {/* Step Progress Indicator */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {STEPS.map((s, idx) => {
            const isComplete = step > s.id
            const isActive = step === s.id
            const Icon = s.icon
            return (
              <div key={s.id} className="flex flex-1 items-center">
                <div className="flex flex-col items-center gap-2">
                  <div
                    className={cn(
                      "flex size-10 items-center justify-center rounded-full border-2 transition-all duration-300",
                      isComplete && "border-primary bg-primary text-primary-foreground",
                      isActive && "border-primary bg-primary/10 text-primary ring-4 ring-primary/10",
                      !isComplete && !isActive && "border-muted-foreground/20 text-muted-foreground/40"
                    )}
                  >
                    {isComplete ? (
                      <CheckCircle2 className="size-5" />
                    ) : (
                      <Icon className="size-5" />
                    )}
                  </div>
                  <span className={cn(
                    "text-xs font-medium transition-colors",
                    isActive ? "text-primary" : isComplete ? "text-foreground" : "text-muted-foreground/50"
                  )}>
                    {s.label}
                  </span>
                </div>
                {idx < STEPS.length - 1 && (
                  <div className="mx-2 h-0.5 flex-1 rounded-full bg-muted">
                    <div
                      className={cn("h-full rounded-full bg-primary transition-all duration-500", isComplete ? "w-full" : "w-0")}
                    />
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left: Step Content */}
        <div className="flex flex-col gap-6 lg:col-span-2">
          {/* =================== STEP 0: SHIPPING =================== */}
          {step === 0 && (
            <div className="flex flex-col gap-6 animate-fade-in-up">
              {/* Order Items Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <ShoppingBag className="size-4 text-primary" />
                    Your Items ({items.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-2">
                  {items.map((item) => {
                    const product = item.product
                    const image = product?.images?.find((img) => img.is_primary)?.image_url ?? product?.images?.[0]?.image_url
                    return (
                      <Item key={item.id} variant="outline">
                        <ItemMedia variant="image" className="size-14">
                          {image ? (
                            <img src={image} alt={product?.name ?? "Product"} className="h-full w-full object-cover" />
                          ) : (
                            <ShoppingBag className="size-5 text-muted-foreground" />
                          )}
                        </ItemMedia>
                        <ItemContent>
                          <Link href={`/products/${item.product_id}`} className="line-clamp-1 text-sm font-medium hover:text-primary">
                            {product?.name ?? `Product ${item.product_id.slice(0, 8)}`}
                          </Link>
                          <ItemDescription>Qty: {item.quantity}</ItemDescription>
                        </ItemContent>
                        <span className="text-sm font-medium text-primary">{formatPrice(Number(item.unit_price) * item.quantity)}</span>
                      </Item>
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
                  <CardDescription>Where should we deliver your order?</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-3">
                  {/* Saved addresses for authenticated users */}
                  {isAuthenticated && addresses.length > 0 && !useNewAddress && (
                    <>
                      <ItemGroup>
                        {addresses.map((addr) => {
                          const isSelected = selectedAddressId === addr.id
                          return (
                            <div
                              key={addr.id}
                              onClick={() => setSelectedAddressId(addr.id)}
                              className={cn(
                                "flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition-colors",
                                isSelected
                                  ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                                  : "border-border hover:bg-muted/50"
                              )}
                            >
                              <div className={cn(
                                "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border transition-colors",
                                isSelected ? "border-primary bg-primary" : "border-muted-foreground/30"
                              )}>
                                {isSelected && <CheckCircle2 className="size-3 text-primary-foreground" />}
                              </div>
                              <div className="flex-1 space-y-1.5">
                                {/* Label + Default badge */}
                                <div className="flex items-center gap-2">
                                  {addr.label ? (
                                    <span className="flex items-center gap-1 text-sm font-semibold">
                                      {addr.label.toLowerCase().includes("home") ? <Home className="size-4 text-primary" /> : <Building2 className="size-4 text-primary" />}
                                      {addr.label}
                                    </span>
                                  ) : (
                                    <span className="flex items-center gap-1 text-sm font-semibold">
                                      <MapPin className="size-4 text-primary" />
                                      Address
                                    </span>
                                  )}
                                  {addr.is_default && (
                                    <span className="flex items-center gap-0.5 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                                      <Star className="size-2.5 fill-primary" /> Default
                                    </span>
                                  )}
                                </div>
                                {/* Recipient info */}
                                {(addr.recipient_name || addr.recipient_phone) && (
                                  <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                                    {addr.recipient_name && (
                                      <span className="flex items-center gap-1">
                                        <User className="size-3" /> {addr.recipient_name}
                                      </span>
                                    )}
                                    {addr.recipient_phone && (
                                      <span className="flex items-center gap-1">
                                        <Smartphone className="size-3" /> {addr.recipient_phone}
                                      </span>
                                    )}
                                  </div>
                                )}
                                {/* Full address */}
                                <div className="flex items-start gap-1 text-sm text-foreground">
                                  <MapPin className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
                                  <span>{addr.street}</span>
                                </div>
                                <p className="pl-4.5 text-xs text-muted-foreground">
                                  {addr.ward && `${addr.ward}, `}{addr.city}, {addr.region}{addr.district ? `, ${addr.district}` : ""}
                                </p>
                                <p className="pl-4.5 text-xs text-muted-foreground">
                                  {addr.country}{addr.postal_code ? ` • Postal: ${addr.postal_code}` : ""}
                                </p>
                                {addr.landmark && (
                                  <p className="flex items-center gap-1 pl-4.5 text-xs text-muted-foreground">
                                    <Info className="size-3" /> {addr.landmark}
                                  </p>
                                )}
                              </div>
                              <div className="flex shrink-0 flex-col items-center gap-1">
                                {!addr.is_default && (
                                  <button
                                    onClick={(e) => { e.stopPropagation(); handleSetDefault(addr.id) }}
                                    className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-primary transition-colors"
                                    title="Set as default"
                                  >
                                    <Star className="size-3.5" />
                                  </button>
                                )}
                                <button
                                  onClick={(e) => { e.stopPropagation(); handleDeleteAddress(addr.id) }}
                                  className="rounded-md p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                                  title="Delete address"
                                >
                                  <Trash2 className="size-3.5" />
                                </button>
                              </div>
                            </div>
                          )
                        })}
                      </ItemGroup>
                      <button
                        onClick={() => setUseNewAddress(true)}
                        className="flex items-center justify-center gap-2 rounded-lg border border-dashed py-3 text-sm text-muted-foreground transition-colors hover:border-primary hover:text-primary"
                      >
                        <Plus className="size-4" />
                        Add new address
                      </button>
                    </>
                  )}

                  {/* New address form for authenticated users */}
                  {isAuthenticated && (addresses.length === 0 || useNewAddress) && (
                    <div className="flex flex-col gap-4 animate-fade-in-up">
                      {useNewAddress && addresses.length > 0 && (
                        <button
                          onClick={() => setUseNewAddress(false)}
                          className="flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-primary transition-colors"
                        >
                          <ArrowLeft className="size-3" /> Use saved address
                        </button>
                      )}
                      {addresses.length === 0 && !useNewAddress && (
                        <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed py-8 text-center">
                          <div className="flex size-12 items-center justify-center rounded-full bg-muted">
                            <MapPin className="size-6 text-muted-foreground" />
                          </div>
                          <div>
                            <p className="text-sm font-medium">No saved addresses</p>
                            <p className="text-xs text-muted-foreground">Add an address to continue</p>
                          </div>
                          <Button variant="outline" size="sm" onClick={() => setUseNewAddress(true)}>
                            <Plus className="size-4" /> Add Address
                          </Button>
                        </div>
                      )}
                      {useNewAddress && (
                        <FieldGroup>
                          <div className="grid grid-cols-2 gap-3">
                            <Field>
                              <FieldLabel htmlFor="new-addr-label">Address Label</FieldLabel>
                              <Input id="new-addr-label" placeholder="Home, Office..." value={newAddrLabel} onChange={(e) => setNewAddrLabel(e.target.value)} />
                            </Field>
                            <Field>
                              <FieldLabel htmlFor="new-addr-recipient">Recipient Name</FieldLabel>
                              <Input id="new-addr-recipient" placeholder="Full name" value={newAddrRecipientName} onChange={(e) => setNewAddrRecipientName(e.target.value)} />
                            </Field>
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <Field>
                              <FieldLabel htmlFor="new-addr-phone">Recipient Phone</FieldLabel>
                              <PhoneInput id="new-addr-phone" value={newAddrRecipientPhone} onChange={setNewAddrRecipientPhone} />
                            </Field>
                            <Field>
                              <FieldLabel htmlFor="new-addr-country">Country</FieldLabel>
                              <Input id="new-addr-country" value={newAddrCountry} readOnly className="bg-muted/50" />
                            </Field>
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <Field>
                              <FieldLabel htmlFor="new-addr-region">Region *</FieldLabel>
                              <select
                                id="new-addr-region"
                                value={newAddrRegion}
                                onChange={(e) => setNewAddrRegion(e.target.value)}
                                className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-xs focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 outline-none dark:bg-input/30"
                              >
                                <option value="">Select region</option>
                                {TZ_REGIONS.map((r) => <option key={r} value={r}>{r}</option>)}
                              </select>
                            </Field>
                            <Field>
                              <FieldLabel htmlFor="new-addr-city">City *</FieldLabel>
                              <Input id="new-addr-city" placeholder="e.g. Kinondoni" value={newAddrCity} onChange={(e) => setNewAddrCity(e.target.value)} />
                            </Field>
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <Field>
                              <FieldLabel htmlFor="new-addr-district">District</FieldLabel>
                              <Input id="new-addr-district" placeholder="e.g. Kinondoni" value={newAddrDistrict} onChange={(e) => setNewAddrDistrict(e.target.value)} />
                            </Field>
                            <Field>
                              <FieldLabel htmlFor="new-addr-ward">Ward</FieldLabel>
                              <Input id="new-addr-ward" placeholder="e.g. Kijitonyama" value={newAddrWard} onChange={(e) => setNewAddrWard(e.target.value)} />
                            </Field>
                          </div>
                          <Field>
                            <FieldLabel htmlFor="new-addr-street">Street *</FieldLabel>
                            <Input id="new-addr-street" placeholder="e.g. House No. 12, Mlimani" value={newAddrStreet} onChange={(e) => setNewAddrStreet(e.target.value)} />
                          </Field>
                          <div className="grid grid-cols-2 gap-3">
                            <Field>
                              <FieldLabel htmlFor="new-addr-landmark">Landmark</FieldLabel>
                              <Input id="new-addr-landmark" placeholder="e.g. Near the shop" value={newAddrLandmark} onChange={(e) => setNewAddrLandmark(e.target.value)} />
                            </Field>
                            <Field>
                              <FieldLabel htmlFor="new-addr-postal">Postal Code</FieldLabel>
                              <Input id="new-addr-postal" placeholder="e.g. 14110" value={newAddrPostalCode} onChange={(e) => setNewAddrPostalCode(e.target.value)} />
                            </Field>
                          </div>
                          <label className="flex items-center gap-2 text-sm text-muted-foreground">
                            <input
                              type="checkbox"
                              checked={newAddrIsDefault}
                              onChange={(e) => setNewAddrIsDefault(e.target.checked)}
                              className="size-4 rounded border-input"
                            />
                            Set as default address
                          </label>
                          <div className="flex gap-2">
                            <Button onClick={handleSaveNewAddress} loading={savingAddress} disabled={savingAddress}>
                              Save Address
                            </Button>
                            {addresses.length > 0 && (
                              <Button variant="outline" onClick={() => setUseNewAddress(false)}>
                                Cancel
                              </Button>
                            )}
                          </div>
                        </FieldGroup>
                      )}
                    </div>
                  )}

                  {/* Guest shipping form */}
                  {isGuest && (
                    <FieldGroup>
                      <div className="flex gap-3 rounded-lg bg-muted/50 p-3">
                        <Info className="size-4 shrink-0 text-primary mt-0.5" />
                        <p className="text-xs text-muted-foreground">
                          Fill in your delivery details. You'll create an account at the final step to complete your order.
                        </p>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <Field>
                          <FieldLabel htmlFor="guest-fname">First Name *</FieldLabel>
                          <Input id="guest-fname" placeholder="John" value={shipFirstName} onChange={(e) => setShipFirstName(e.target.value)} />
                        </Field>
                        <Field>
                          <FieldLabel htmlFor="guest-lname">Last Name *</FieldLabel>
                          <Input id="guest-lname" placeholder="Doe" value={shipLastName} onChange={(e) => setShipLastName(e.target.value)} />
                        </Field>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <Field>
                          <FieldLabel htmlFor="guest-phone">Phone *</FieldLabel>
                          <PhoneInput id="guest-phone" value={shipPhone} onChange={setShipPhone} />
                        </Field>
                        <Field>
                          <FieldLabel htmlFor="guest-email">Email</FieldLabel>
                          <Input id="guest-email" type="email" placeholder="john@example.com" value={shipEmail} onChange={(e) => setShipEmail(e.target.value)} />
                        </Field>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <Field>
                          <FieldLabel htmlFor="guest-country">Country</FieldLabel>
                          <Input id="guest-country" value={shipCountry} readOnly className="bg-muted/50" />
                        </Field>
                        <Field>
                          <FieldLabel htmlFor="guest-region">Region *</FieldLabel>
                          <select
                            id="guest-region"
                            value={shipRegion}
                            onChange={(e) => setShipRegion(e.target.value)}
                            className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-xs focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 outline-none dark:bg-input/30"
                          >
                            <option value="">Select region</option>
                            {TZ_REGIONS.map((r) => <option key={r} value={r}>{r}</option>)}
                          </select>
                        </Field>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <Field>
                          <FieldLabel htmlFor="guest-city">City *</FieldLabel>
                          <Input id="guest-city" placeholder="e.g. Kinondoni" value={shipCity} onChange={(e) => setShipCity(e.target.value)} />
                        </Field>
                        <Field>
                          <FieldLabel htmlFor="guest-postal">Postal Code</FieldLabel>
                          <Input id="guest-postal" placeholder="e.g. 14110" value={shipPostalCode} onChange={(e) => setShipPostalCode(e.target.value)} />
                        </Field>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <Field>
                          <FieldLabel htmlFor="guest-district">District</FieldLabel>
                          <Input id="guest-district" placeholder="e.g. Kinondoni" value={shipDistrict} onChange={(e) => setShipDistrict(e.target.value)} />
                        </Field>
                        <Field>
                          <FieldLabel htmlFor="guest-ward">Ward</FieldLabel>
                          <Input id="guest-ward" placeholder="e.g. Kijitonyama" value={shipWard} onChange={(e) => setShipWard(e.target.value)} />
                        </Field>
                      </div>
                      <Field>
                        <FieldLabel htmlFor="guest-street">Street Address *</FieldLabel>
                        <Input id="guest-street" placeholder="e.g. House No. 12, Mlimani" value={shipStreet} onChange={(e) => setShipStreet(e.target.value)} />
                      </Field>
                      <div className="grid grid-cols-2 gap-3">
                        <Field>
                          <FieldLabel htmlFor="guest-landmark">Landmark</FieldLabel>
                          <Input id="guest-landmark" placeholder="e.g. Near the shop" value={shipLandmark} onChange={(e) => setShipLandmark(e.target.value)} />
                        </Field>
                        <Field>
                          <FieldLabel htmlFor="guest-notes">Additional Notes (Optional)</FieldLabel>
                          <Input id="guest-notes" placeholder="Any special delivery instructions?" value={shipNotes} onChange={(e) => setShipNotes(e.target.value)} />
                        </Field>
                      </div>
                    </FieldGroup>
                  )}
                </CardContent>
              </Card>

              {/* Shipping Rate Selection (authenticated users only) */}
              {isAuthenticated && selectedAddressId && !useNewAddress && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Truck className="size-4 text-primary" />
                      Shipping Method
                    </CardTitle>
                    <CardDescription>Choose how you'd like to receive your order</CardDescription>
                  </CardHeader>
                  <CardContent className="flex flex-col gap-3">
                    {loadingQuotes ? (
                      <div className="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground">
                        <Spinner className="size-4" />
                        Finding shipping options...
                      </div>
                    ) : shippingQuotes.length === 0 ? (
                      <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed py-6 text-center">
                        <Truck className="size-6 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">No shipping options available for this address</p>
                      </div>
                    ) : (
                      <ItemGroup>
                        {shippingQuotes.map((quote) => {
                          const isSelected = selectedRateId === quote.rate_id
                          return (
                            <div
                              key={quote.rate_id}
                              onClick={() => setSelectedRateId(quote.rate_id)}
                              className={cn(
                                "flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors",
                                isSelected
                                  ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                                  : "border-border hover:bg-muted/50"
                              )}
                            >
                              <div className={cn(
                                "flex size-5 shrink-0 items-center justify-center rounded-full border transition-colors",
                                isSelected ? "border-primary bg-primary" : "border-muted-foreground/30"
                              )}>
                                {isSelected && <CheckCircle2 className="size-3 text-primary-foreground" />}
                              </div>
                              <div className="flex-1">
                                <p className="text-sm font-medium">{quote.method_name}</p>
                                <p className="text-xs text-muted-foreground">
                                  {quote.carrier_name ? `${quote.carrier_name} • ` : ""}
                                  {quote.min_delivery_days}-{quote.max_delivery_days} days
                                </p>
                              </div>
                              <span className="text-sm font-medium text-primary">
                                {Number(quote.amount) === 0 ? "Free" : formatPrice(Number(quote.amount))}
                              </span>
                            </div>
                          )
                        })}
                      </ItemGroup>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Continue Button */}
              <div className="flex justify-end">
                <Button size="lg" className="gap-2" onClick={handleNextStep}>
                  Continue to Payment
                  <ArrowRight className="size-4" />
                </Button>
              </div>
            </div>
          )}

          {/* =================== STEP 1: PAYMENT =================== */}
          {step === 1 && (
            <div className="flex flex-col gap-6 animate-fade-in-up">
              {checkingStatus ? (
                <Card className="mx-auto w-full max-w-md">
                  <CardContent className="flex flex-col items-center gap-6 py-12 text-center">
                    <div className="relative">
                      <div className="absolute inset-0 animate-[spin_3s_linear_infinite] rounded-full border-4 border-dashed border-primary/10" />
                      <div className="relative flex size-24 items-center justify-center rounded-full bg-primary/5">
                        <Spinner className="size-7 text-primary" />
                      </div>
                      <div className="absolute inset-0 animate-ping rounded-full bg-primary/5" />
                    </div>

                    <div className="space-y-3">
                      <h2 className="text-base font-medium tracking-tight">Verifying Payment...</h2>
                      <p className="text-sm text-muted-foreground leading-relaxed px-4">
                        Please check your phone and enter your PIN to complete the payment of <strong>{formatPrice(computedTotal)}</strong>.
                      </p>
                    </div>

                    <div className="w-full space-y-2">
                      <div className="flex justify-between text-xs font-medium text-muted-foreground">
                        <span>Verification Status</span>
                        <span>{statusAttempts}/30</span>
                      </div>
                      <Progress value={(statusAttempts / 30) * 100} className="h-1" />
                    </div>

                    <button
                      onClick={() => setCheckingStatus(false)}
                      className="text-xs font-medium text-muted-foreground hover:text-primary transition-colors"
                    >
                      Cancel and go back
                    </button>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                  {/* Left Column: Questionnaire Flow (7 cols) */}
                  <div className="lg:col-span-7">
                    <Questionnaire>
                      {/* Sub-step 0: Select Method */}
                      <QuestionnaireItem isActive={paymentSubStep === 0}>
                        <div className="space-y-1">
                          <QuestionnaireTitle>Payment Method</QuestionnaireTitle>
                          <QuestionnaireDescription>Choose how you'd like to pay for this order.</QuestionnaireDescription>
                        </div>
                        <QuestionnaireChoices>
                          <QuestionnaireChoice
                            value="mobile_money"
                            selected={paymentMethod === "mobile_money"}
                            onClick={() => {
                              setPaymentMethod("mobile_money");
                              setPaymentSubStep(1);
                            }}
                          >
                            <span className="text-sm font-medium">Mobile Money</span>
                            <span className="text-xs text-muted-foreground">M-Pesa, Tigo Pesa, Airtel Money, Halopesa</span>
                          </QuestionnaireChoice>
                          <QuestionnaireChoice
                            value="card"
                            selected={paymentMethod === "card"}
                            onClick={() => {
                              setPaymentMethod("card");
                              setPaymentSubStep(1);
                            }}
                          >
                            <span className="text-sm font-medium">Bank Card</span>
                            <span className="text-xs text-muted-foreground">VISA, Mastercard (Via AzamPay)</span>
                          </QuestionnaireChoice>
                          <QuestionnaireChoice
                            value="cash_on_delivery"
                            selected={paymentMethod === "cash_on_delivery"}
                            onClick={() => {
                              setPaymentMethod("cash_on_delivery");
                              setPaymentSubStep(1);
                            }}
                          >
                            <span className="text-sm font-medium">Cash on Delivery (COD)</span>
                            <span className="text-xs text-muted-foreground">Pay with cash at your doorstep</span>
                          </QuestionnaireChoice>
                        </QuestionnaireChoices>
                      </QuestionnaireItem>

                      {/* Sub-step 1: Details */}
                      <QuestionnaireItem isActive={paymentSubStep === 1}>
                        <div className="space-y-4">
                          <button
                            onClick={() => setPaymentSubStep(0)}
                            className="flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-primary transition-colors"
                          >
                            <ArrowLeft className="size-3" /> Change payment method
                          </button>

                          {paymentMethod === "mobile_money" && (
                            <div className="space-y-4 animate-fade-in-up">
                              <QuestionnaireTitle>Mobile Money</QuestionnaireTitle>
                              <div className="space-y-3">
                                <div>
                                  <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Provider</label>
                                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                    {MNO_PROVIDERS.map((provider) => (
                                      <button
                                        key={provider.value}
                                        onClick={() => setMnoProvider(provider.value)}
                                        className={cn(
                                          "flex items-center justify-center gap-2 rounded-md border px-2 py-2 text-xs font-medium transition-colors",
                                          mnoProvider === provider.value
                                            ? "border-primary bg-primary/5 text-primary ring-1 ring-primary/20"
                                            : "border-border bg-card hover:bg-muted/50"
                                        )}
                                      >
                                        <div className={cn("size-2 rounded-full", provider.dot)} />
                                        {provider.label}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                                <div>
                                  <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Phone Number</label>
                                  <PhoneInput
                                    value={phoneNumber}
                                    onChange={setPhoneNumber}
                                  />
                                </div>
                              </div>
                            </div>
                          )}

                          {paymentMethod === "card" && (
                            <div className="space-y-3 animate-fade-in-up">
                              <QuestionnaireTitle>Bank Card</QuestionnaireTitle>
                              <div className="flex gap-3 rounded-lg border bg-muted/50 p-4">
                                <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
                                  <CreditCard className="size-4" />
                                </div>
                                <div className="space-y-0.5">
                                  <p className="text-sm font-medium">Secure with AzamPay</p>
                                  <p className="text-xs text-muted-foreground leading-relaxed">
                                    You'll be redirected to AzamPay's payment page to complete your transaction securely.
                                  </p>
                                </div>
                              </div>
                            </div>
                          )}

                          {paymentMethod === "cash_on_delivery" && (
                            <div className="space-y-3 animate-fade-in-up">
                              <QuestionnaireTitle>Cash on Delivery</QuestionnaireTitle>
                              <div className="flex gap-3 rounded-lg border bg-muted/50 p-4">
                                <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
                                  <Truck className="size-4" />
                                </div>
                                <div className="space-y-0.5">
                                  <p className="text-sm font-medium">Cash Payment</p>
                                  <p className="text-xs text-muted-foreground leading-relaxed">
                                    Pay <strong>{formatPrice(computedTotal)}</strong> when you receive your items.
                                  </p>
                                </div>
                              </div>
                            </div>
                          )}

                          <Button
                            className="mt-2 w-full"
                            onClick={handlePlaceOrder}
                            loading={placing}
                            disabled={placing || (paymentMethod === "mobile_money" && !phoneNumber)}
                          >
                            {paymentMethod === "cash_on_delivery" ? "Complete Order" : `Pay ${formatPrice(computedTotal)}`}
                          </Button>
                        </div>
                      </QuestionnaireItem>
                    </Questionnaire>
                  </div>

                  {/* Right Column: Contact & Summary (5 cols) */}
                  <div className="lg:col-span-5 space-y-4">
                    {/* Contact Info */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm">Contact Info</CardTitle>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <ItemGroup>
                          <Item variant="outline">
                            <ItemMedia variant="icon">
                              <User className="size-4" />
                            </ItemMedia>
                            <ItemContent>
                              <ItemDescription>Full Name</ItemDescription>
                              <ItemTitle>{`${shipFirstName} ${shipLastName}`.trim() || "—"}</ItemTitle>
                            </ItemContent>
                          </Item>
                          <Item variant="outline">
                            <ItemMedia variant="icon">
                              <Mail className="size-4" />
                            </ItemMedia>
                            <ItemContent>
                              <ItemDescription>Email</ItemDescription>
                              <ItemTitle>{shipEmail || "—"}</ItemTitle>
                            </ItemContent>
                          </Item>
                        </ItemGroup>
                      </CardContent>
                    </Card>

                    {/* Payment Summary */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm">Payment Summary</CardTitle>
                      </CardHeader>
                      <CardContent className="pt-0 space-y-3">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Items ({items.length})</span>
                          <span className="font-medium">{formatPrice(subtotal)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Shipping</span>
                          <span className="font-medium text-green-600">{computedShippingCost === 0 ? "Free" : formatPrice(computedShippingCost)}</span>
                        </div>
                        <Separator />
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium">Grand Total</span>
                          <span className="text-lg font-bold text-primary">{formatPrice(computedTotal)}</span>
                        </div>
                        <div className="flex items-center gap-2 pt-1 text-xs text-muted-foreground">
                          <ShieldCheck className="size-3.5 text-green-600" />
                          Your payments are 100% Secure
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* =================== STEP 2: REVIEW =================== */}
          {step === 2 && (
            <div className="flex flex-col gap-6 animate-fade-in-up">
              {/* Guest Auth Required */}
              {isGuest && (
                <Card className="border-primary/30 ring-1 ring-primary/20">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <User className="size-4 text-primary" />
                      {authMode === "signup" ? "Create Your Account" : "Sign In"}
                    </CardTitle>
                    <CardDescription>
                      {authMode === "signup"
                        ? "Create an account to complete your order. Your shipping details are pre-filled."
                        : "Sign in to your account to complete your order."}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {authMode === "signin" ? (
                      <form className="flex flex-col gap-3" onSubmit={handleGuestSignIn}>
                        <Input type="email" placeholder="Email" value={signInEmail} onChange={(e) => setSignInEmail(e.target.value)} required />
                        <Input type="password" placeholder="Password" value={signInPassword} onChange={(e) => setSignInPassword(e.target.value)} required />
                        <Button type="submit" loading={authLoading} className="gap-2">
                          <Lock className="size-4" />
                          Sign In & Place Order
                        </Button>
                        <p className="text-center text-xs text-muted-foreground">
                          Don&apos;t have an account?{" "}
                          <button type="button" onClick={() => setAuthMode("signup")} className="font-medium text-primary hover:underline">
                            Sign up
                          </button>
                        </p>
                      </form>
                    ) : (
                      <form className="flex flex-col gap-3" onSubmit={handleGuestSignUp}>
                        <div className="grid grid-cols-2 gap-2">
                          <Input placeholder="First name" value={signUpFirstName} onChange={(e) => setSignUpFirstName(e.target.value)} required />
                          <Input placeholder="Last name" value={signUpLastName} onChange={(e) => setSignUpLastName(e.target.value)} required />
                        </div>
                        <Input type="email" placeholder="Email" value={signUpEmail} onChange={(e) => setSignUpEmail(e.target.value)} required />
                        <Input type="tel" placeholder="Phone (e.g. 0712345678)" value={signUpPhone} onChange={(e) => setSignUpPhone(e.target.value)} required />
                        <Input type="password" placeholder="Password (min 10 chars)" value={signUpPassword} onChange={(e) => setSignUpPassword(e.target.value)} required minLength={10} />
                        <Button type="submit" loading={authLoading} className="gap-2">
                          <Lock className="size-4" />
                          Create Account & Place Order
                        </Button>
                        <p className="text-center text-xs text-muted-foreground">
                          Already have an account?{" "}
                          <button type="button" onClick={() => setAuthMode("signin")} className="font-medium text-primary hover:underline">
                            Sign in
                          </button>
                        </p>
                      </form>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Review: Shipping Info */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <MapPin className="size-4 text-primary" />
                      Delivery Address
                    </CardTitle>
                    <button onClick={() => setStep(0)} className="text-xs font-medium text-primary hover:underline">
                      Edit
                    </button>
                  </div>
                </CardHeader>
                <CardContent>
                  {isAuthenticated && selectedAddressId && !useNewAddress ? (
                    (() => {
                      const addr = addresses.find((a) => a.id === selectedAddressId)
                      return addr ? (
                        <div className="space-y-1.5 text-sm">
                          {addr.label && (
                            <div className="flex items-center gap-1.5 font-semibold">
                              {addr.label.toLowerCase().includes("home") ? <Home className="size-4 text-primary" /> : <Building2 className="size-4 text-primary" />}
                              {addr.label}
                              {addr.is_default && (
                                <span className="flex items-center gap-0.5 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                                  <Star className="size-2.5 fill-primary" /> Default
                                </span>
                              )}
                            </div>
                          )}
                          {(addr.recipient_name || addr.recipient_phone) && (
                            <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                              {addr.recipient_name && (
                                <span className="flex items-center gap-1">
                                  <User className="size-3" /> {addr.recipient_name}
                                </span>
                              )}
                              {addr.recipient_phone && (
                                <span className="flex items-center gap-1">
                                  <Smartphone className="size-3" /> {addr.recipient_phone}
                                </span>
                              )}
                            </div>
                          )}
                          <div className="flex items-start gap-1 text-foreground">
                            <MapPin className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
                            <span>{addr.street}</span>
                          </div>
                          <p className="pl-4.5 text-xs text-muted-foreground">
                            {addr.ward && `${addr.ward}, `}{addr.city}, {addr.region}{addr.district ? `, ${addr.district}` : ""}, {addr.country}
                            {addr.postal_code ? ` • Postal: ${addr.postal_code}` : ""}
                          </p>
                          {addr.landmark && (
                            <p className="flex items-center gap-1 pl-4.5 text-xs text-muted-foreground">
                              <Info className="size-3" /> {addr.landmark}
                            </p>
                          )}
                        </div>
                      ) : null
                    })()
                  ) : (
                    <div className="space-y-1.5 text-sm">
                      <p className="font-medium">{shipFirstName} {shipLastName}</p>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1"><Smartphone className="size-3" /> {shipPhone}</span>
                        {shipEmail && <span className="flex items-center gap-1"><Mail className="size-3" /> {shipEmail}</span>}
                      </div>
                      <div className="flex items-start gap-1 text-foreground">
                        <MapPin className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
                        <span>{shipStreet}</span>
                      </div>
                      <p className="pl-4.5 text-xs text-muted-foreground">
                        {shipWard && `${shipWard}, `}{shipCity}, {shipRegion}{shipDistrict ? `, ${shipDistrict}` : ""}, {shipCountry}
                        {shipPostalCode ? ` • Postal: ${shipPostalCode}` : ""}
                      </p>
                      {shipLandmark && (
                        <p className="flex items-center gap-1 pl-4.5 text-xs text-muted-foreground">
                          <Info className="size-3" /> {shipLandmark}
                        </p>
                      )}
                      {shipNotes && <p className="mt-1 text-xs italic text-muted-foreground">Notes: {shipNotes}</p>}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Review: Payment Method */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <CreditCard className="size-4 text-primary" />
                      Payment Method
                    </CardTitle>
                    <button onClick={() => setStep(1)} className="text-xs font-medium text-primary hover:underline">
                      Edit
                    </button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-3 text-sm">
                    {paymentMethod === "mobile_money" && (
                      <>
                        <Smartphone className="size-5 text-green-600" />
                        <div>
                          <p className="font-medium">{MNO_PROVIDERS.find((p) => p.value === mnoProvider)?.label}</p>
                          <p className="text-muted-foreground">{phoneNumber || "Phone number not set"}</p>
                        </div>
                      </>
                    )}
                    {paymentMethod === "card" && (
                      <>
                        <CreditCard className="size-5 text-amber-600" />
                        <p className="font-medium">Card payment via AzamPay</p>
                      </>
                    )}
                    {paymentMethod === "cash_on_delivery" && (
                      <>
                        <Truck className="size-5 text-blue-600" />
                        <p className="font-medium">Cash on Delivery</p>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Review: Order Items */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Package className="size-4 text-primary" />
                    Order Items ({items.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-2">
                  {items.map((item) => {
                    const product = item.product
                    const image = product?.images?.find((img) => img.is_primary)?.image_url ?? product?.images?.[0]?.image_url
                    return (
                      <div key={item.id} className="flex gap-3 rounded-lg border p-3">
                        <div className="relative size-12 shrink-0 overflow-hidden rounded-lg border bg-muted">
                          {image ? (
                            <img src={image} alt={product?.name ?? "Product"} className="h-full w-full object-cover" />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                              <ShoppingBag className="size-4" />
                            </div>
                          )}
                        </div>
                        <div className="flex flex-1 items-center justify-between">
                          <div>
                            <p className="line-clamp-1 text-sm font-medium">{product?.name ?? `Product ${item.product_id.slice(0, 8)}`}</p>
                            <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>
                          </div>
                          <span className="text-sm font-bold text-primary">{formatPrice(Number(item.unit_price) * item.quantity)}</span>
                        </div>
                      </div>
                    )
                  })}
                </CardContent>
              </Card>

              {/* Navigation Buttons */}
              <div className="flex justify-between">
                <Button variant="ghost" size="lg" className="gap-2" onClick={handlePrevStep}>
                  <ArrowLeft className="size-4" />
                  Back
                </Button>
                {!isGuest ? (
                  <Button
                    size="lg"
                    className="gap-2"
                    loading={placing}
                    disabled={placing}
                    onClick={handlePlaceOrder}
                  >
                    {placing ? "Processing..." : (
                      <>
                        <Lock className="size-4" />
                        Place Order • {formatPrice(computedTotal)}
                      </>
                    )}
                  </Button>
                ) : (
                  <div className="flex flex-col items-end gap-2">
                    <Button size="lg" className="gap-2" disabled>
                      <Lock className="size-4" />
                      Sign in or create account to continue
                    </Button>
                    <p className="text-xs text-muted-foreground">Complete the form above to place your order</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right: Order Summary (sticky, always visible) */}
        <div className="lg:col-span-1">
          <Card className="sticky top-32">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Lock className="size-4 text-primary" />
                Order Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              {/* Items count */}
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{items.length} items</span>
                <span className="font-medium">{formatPrice(subtotal)}</span>
              </div>

              <div className="flex flex-col gap-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-medium">{formatPrice(subtotal)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount {couponCode ? `(${couponCode})` : ""}</span>
                    <span>-{formatPrice(discount)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Shipping</span>
                  <span className="font-medium">
                    {selectedRateId
                      ? computedShippingCost === 0 ? "Free" : formatPrice(computedShippingCost)
                      : "Calculated at checkout"}
                  </span>
                </div>
              </div>

              <Separator />

              <div className="flex justify-between text-base font-bold">
                <span>Total</span>
                <span className="text-primary">{formatPrice(computedTotal)}</span>
              </div>

              {/* Trust badges */}
              <div className="flex flex-col gap-2 rounded-lg bg-muted/50 p-3">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <ShieldCheck className="size-4 text-green-600" />
                  Secure checkout powered by AzamPay
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Truck className="size-4 text-blue-600" />
                  Fast delivery across Tanzania
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Package className="size-4 text-primary" />
                  Quality guaranteed products
                </div>
              </div>

              {placing && (
                <Item variant="muted">
                  <ItemMedia>
                    <Spinner className="size-5 text-primary" />
                  </ItemMedia>
                  <ItemContent>
                    <ItemTitle className="text-xs font-medium text-foreground">
                      Processing secure payment...
                    </ItemTitle>
                  </ItemContent>
                </Item>
              )}

              {isGuest && step < 2 && (
                <div className="flex items-start gap-2 rounded-lg bg-amber-50 p-3 text-xs text-amber-700 dark:bg-amber-950/30 dark:text-amber-400">
                  <Info className="mt-0.5 size-3.5 shrink-0" />
                  <span>
                    You&apos;re checking out as a guest. You&apos;ll need to create an account or sign in at the final step to place your order.
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
