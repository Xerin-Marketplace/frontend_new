"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Checkbox } from "@/components/ui/checkbox"
import { PhoneInput } from "@/components/ui/phone-input"
import { toast } from "@/components/ui/toast"
import { useAuth, type ApiError } from "@/lib/auth-context"
import { api } from "@/lib/api"
import { cn } from "@/lib/utils"
import {
  Store,
  Mail,
  MapPin,
  Globe,
  FileText,
  CheckCircle2,
  Clock,
  XCircle,
  ArrowLeft,
  Package,
  Building2,
  Tags,
  Briefcase,
  Phone,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Wallet,
  Users,
} from "lucide-react"

type BusinessCategory = {
  id: string
  name: string
  description: string | null
}

type ApplicationStatus = {
  has_application: boolean
  seller_id?: string
  status?: string
  business_name?: string
  can_access_seller_dashboard?: boolean
  can_upload_kyc?: boolean
  submitted_at?: string
  approved_at?: string
}

function getApiError(err: unknown): string {
  const e = err as ApiError
  if (e?.detail && typeof e?.detail === "object") {
    return (e.detail as Record<string, string>).message || "Something went wrong."
  }
  return (e?.detail as string) || "Something went wrong. Please try again."
}

function formatDate(date: string | null | undefined) {
  if (!date) return "—"
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

const statusConfig: Record<string, { label: string; icon: React.ElementType; color: string; bg: string; border: string }> = {
  pending: { label: "Pending Review", icon: Clock, color: "text-amber-600", bg: "bg-amber-50 dark:bg-amber-950/50", border: "border-amber-200 dark:border-amber-900" },
  under_review: { label: "Under Review", icon: Clock, color: "text-blue-600", bg: "bg-blue-50 dark:bg-blue-950/50", border: "border-blue-200 dark:border-blue-900" },
  approved: { label: "Approved", icon: CheckCircle2, color: "text-green-600", bg: "bg-green-50 dark:bg-green-950/50", border: "border-green-200 dark:border-green-900" },
  rejected: { label: "Rejected", icon: XCircle, color: "text-red-600", bg: "bg-red-50 dark:bg-red-950/50", border: "border-red-200 dark:border-red-900" },
  suspended: { label: "Suspended", icon: XCircle, color: "text-red-600", bg: "bg-red-50 dark:bg-red-950/50", border: "border-red-200 dark:border-red-900" },
}

const benefits = [
  { icon: TrendingUp, title: "Reach More Customers", desc: "Tap into XerinMarket's growing customer base across Tanzania." },
  { icon: Wallet, title: "Fast Payouts", desc: "Get paid directly to your wallet with flexible payout options." },
  { icon: ShieldCheck, title: "Secure & Trusted", desc: "Built-in fraud protection and secure payment processing." },
  { icon: Users, title: "Manage Your Store", desc: "Full control over products, inventory, orders, and analytics." },
]

export default function BecomeSellerPage() {
  const router = useRouter()
  const { user, isAuthenticated, applyToBecomeSeller, refreshUser } = useAuth()
  const [loading, setLoading] = React.useState(true)
  const [submitting, setSubmitting] = React.useState(false)
  const [applicationStatus, setApplicationStatus] = React.useState<ApplicationStatus | null>(null)
  const [categories, setCategories] = React.useState<BusinessCategory[]>([])
  const [categoryError, setCategoryError] = React.useState(false)
  const [selectedCategoryIds, setSelectedCategoryIds] = React.useState<string[]>([])
  const [agreed, setAgreed] = React.useState(false)
  const [errors, setErrors] = React.useState<Record<string, string>>({})

  // Form state
  const [businessName, setBusinessName] = React.useState("")
  const [businessDescription, setBusinessDescription] = React.useState("")
  const [businessCountry, setBusinessCountry] = React.useState("")
  const [businessRegion, setBusinessRegion] = React.useState("")
  const [businessCity, setBusinessCity] = React.useState("")
  const [businessAddress, setBusinessAddress] = React.useState("")
  const [productDescription, setProductDescription] = React.useState("")
  const [yearsInBusiness, setYearsInBusiness] = React.useState("")
  const [websiteUrl, setWebsiteUrl] = React.useState("")
  const [contactEmail, setContactEmail] = React.useState("")
  const [contactPhone, setContactPhone] = React.useState("")

  React.useEffect(() => {
    if (!isAuthenticated) {
      router.push("/auth?tab=login")
      return
    }

    let cancelled = false

    async function loadData() {
      try {
        const [status, cats] = await Promise.all([
          api.get<ApplicationStatus>("/sellers/application-status"),
          api.get<BusinessCategory[]>("/admin/business-categories"),
        ])
        if (cancelled) return
        setApplicationStatus(status)
        setCategories(cats)
        setCategoryError(false)
      } catch {
        if (cancelled) return
        setCategoryError(true)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    loadData()
    return () => { cancelled = true }
  }, [isAuthenticated, router])

  const toggleCategory = (id: string) => {
    setSelectedCategoryIds((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})

    if (!businessName.trim()) {
      setErrors((p) => ({ ...p, business_name: "Business name is required" }))
      return
    }
    if (selectedCategoryIds.length === 0) {
      toast.add({
        title: "Select categories",
        description: "Please select at least one business category.",
        type: "warning",
      })
      return
    }
    if (!agreed) {
      toast.add({ title: "Please accept the Seller Agreement", type: "warning" })
      return
    }

    setSubmitting(true)
    try {
      await applyToBecomeSeller({
        business_name: businessName.trim(),
        business_category_ids: selectedCategoryIds,
        business_description: businessDescription.trim() || undefined,
        business_country: businessCountry.trim() || undefined,
        business_region: businessRegion.trim() || undefined,
        business_city: businessCity.trim() || undefined,
        business_address: businessAddress.trim() || undefined,
        product_description: productDescription.trim() || undefined,
        years_in_business: yearsInBusiness.trim() || undefined,
        website_url: websiteUrl.trim() || undefined,
        contact_email: contactEmail.trim() || undefined,
        contact_phone: contactPhone || undefined,
        agreement_accepted: true,
      })

      toast.add({
        title: "Application submitted!",
        description: "Your seller application is now pending review.",
        type: "success",
      })

      // Refresh status
      const status = await api.get<ApplicationStatus>("/sellers/application-status")
      setApplicationStatus(status)
      await refreshUser()
    } catch (err) {
      const apiErr = err as ApiError
      if (apiErr?.errors) {
        const fieldErrs: Record<string, string> = {}
        for (const [key, val] of Object.entries(apiErr.errors)) {
          fieldErrs[key] = Array.isArray(val) ? val[0] : val
        }
        setErrors(fieldErrs)
      }
      toast.add({
        title: "Application failed",
        description: getApiError(err),
        type: "error",
      })
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8 sm:py-12">
        <div className="flex flex-col gap-6">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-40 w-full rounded-2xl" />
          <Skeleton className="h-64 w-full rounded-2xl" />
          <Skeleton className="h-64 w-full rounded-2xl" />
        </div>
      </div>
    )
  }

  // If user already has an application, show status
  if (applicationStatus?.has_application) {
    const cfg = statusConfig[applicationStatus.status ?? "pending"] ?? statusConfig.pending
    const StatusIcon = cfg.icon

    return (
      <div className="mx-auto max-w-4xl px-4 py-8 sm:py-12">
        <button
          onClick={() => router.push("/dashboard/user")}
          className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Back to Dashboard
        </button>

        <Card className="overflow-hidden">
          {/* Header banner */}
          <div className={cn("flex flex-col items-center gap-3 px-6 py-10 text-center", cfg.bg, cfg.border, "border-b")}>
            <div className={cn("flex size-20 items-center justify-center rounded-3xl bg-background/80 shadow-sm")}>
              <Store className={cn("size-10", cfg.color)} />
            </div>
            <div>
              <h2 className="text-2xl font-bold tracking-tight">Seller Application Status</h2>
              <p className="mt-1 text-sm text-muted-foreground">{applicationStatus.business_name}</p>
            </div>
            <div className={cn("mt-2 flex items-center gap-2 rounded-full border px-4 py-2", cfg.color, cfg.border)}>
              <StatusIcon className="size-5" />
              <span className="font-semibold">{cfg.label}</span>
            </div>
          </div>

          <CardContent className="space-y-6 p-6">
            {/* Timeline */}
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-xl border bg-muted/30 p-4">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Clock className="size-3.5" />
                  Submitted
                </div>
                <p className="mt-1.5 text-sm font-medium">{formatDate(applicationStatus.submitted_at)}</p>
              </div>
              <div className="rounded-xl border bg-muted/30 p-4">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <CheckCircle2 className="size-3.5" />
                  Approved
                </div>
                <p className="mt-1.5 text-sm font-medium">{formatDate(applicationStatus.approved_at)}</p>
              </div>
            </div>

            {/* Approved state */}
            {applicationStatus.status === "approved" && applicationStatus.can_access_seller_dashboard && (
              <div className="flex flex-col items-center gap-4 rounded-xl border border-green-200 bg-green-50 p-6 text-center dark:border-green-900 dark:bg-green-950/50">
                <div className="flex size-12 items-center justify-center rounded-2xl bg-green-100 dark:bg-green-900">
                  <CheckCircle2 className="size-6 text-green-600" />
                </div>
                <p className="text-sm font-medium text-green-800 dark:text-green-200">
                  Your seller account is approved! You can now access the Seller Center.
                </p>
                <Button onClick={() => router.push("/dashboard/seller")} className="gap-2">
                  <Package className="size-4" />
                  Go to Seller Dashboard
                </Button>
              </div>
            )}

            {/* Rejected state */}
            {applicationStatus.status === "rejected" && (
              <div className="flex flex-col items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-6 text-center dark:border-red-900 dark:bg-red-950/50">
                <div className="flex size-12 items-center justify-center rounded-2xl bg-red-100 dark:bg-red-900">
                  <XCircle className="size-6 text-red-600" />
                </div>
                <p className="text-sm text-red-800 dark:text-red-200">
                  Your application was rejected. Please contact support for more information.
                </p>
              </div>
            )}

            {/* Pending / Under Review */}
            {(applicationStatus.status === "pending" || applicationStatus.status === "under_review") && (
              <div className="flex flex-col items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 p-6 text-center dark:border-amber-900 dark:bg-amber-950/50">
                <div className="flex size-12 items-center justify-center rounded-2xl bg-amber-100 dark:bg-amber-900">
                  <Clock className="size-6 text-amber-600" />
                </div>
                <p className="text-sm text-amber-800 dark:text-amber-200">
                  Your application is being reviewed. We&apos;ll notify you once it&apos;s processed.
                </p>
              </div>
            )}

            {/* KYC Upload */}
            {applicationStatus.can_upload_kyc && applicationStatus.status !== "approved" && (
              <div className="flex flex-col items-center gap-3">
                <Button
                  variant="outline"
                  onClick={() => router.push("/dashboard/seller/kyc")}
                  className="gap-2"
                >
                  <FileText className="size-4" />
                  Upload KYC Documents
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }

  // Show application form
  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:py-12">
      <button
        onClick={() => router.push("/dashboard/user")}
        className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Back to Dashboard
      </button>

      {/* Hero */}
      <Card className="mb-6 overflow-hidden border-primary/20">
        <div className="relative bg-gradient-to-br from-primary/10 via-primary/5 to-transparent px-6 py-8 sm:px-8 sm:py-10">
          <div className="flex flex-col items-start gap-4">
            <div className="flex size-14 items-center justify-center rounded-2xl bg-primary/10">
              <Store className="size-7 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Become a Seller</h1>
              <p className="mt-1.5 max-w-lg text-sm text-muted-foreground">
                Join XerinMarket and start selling to thousands of customers across Tanzania.
                Your existing account, orders, and addresses will be preserved.
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* Benefits */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {benefits.map((b, i) => {
          const Icon = b.icon
          return (
            <Card key={i} className="p-4">
              <div className="flex size-9 items-center justify-center rounded-xl bg-primary/10">
                <Icon className="size-4 text-primary" />
              </div>
              <h3 className="mt-3 text-sm font-semibold">{b.title}</h3>
              <p className="mt-1 text-xs text-muted-foreground leading-snug">{b.desc}</p>
            </Card>
          )
        })}
      </div>

      {/* Application Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Sparkles className="size-5 text-primary" />
            Seller Application Form
          </CardTitle>
          <CardDescription>
            Fill in your business details below. Fields marked with * are required.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            <FieldGroup>
              {/* ─── Business Info ─── */}
              <div className="flex items-center gap-2">
                <Building2 className="size-4 text-primary" />
                <h3 className="text-sm font-semibold">Business Information</h3>
                <Separator className="flex-1" />
              </div>

              {/* Business Name */}
              <Field>
                <FieldLabel htmlFor="business-name">Business Name *</FieldLabel>
                <div className="relative">
                  <Store className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="business-name"
                    type="text"
                    placeholder="e.g. Xerin Marketplace"
                    className={cn("pl-9", errors.business_name && "border-red-500")}
                    value={businessName}
                    onChange={(e) => {
                      setBusinessName(e.target.value)
                      if (errors.business_name) setErrors((p) => ({ ...p, business_name: "" }))
                    }}
                    required
                  />
                </div>
                <FieldDescription>Enter your official business or shop name as customers will see it.</FieldDescription>
                {errors.business_name && <FieldDescription className="text-red-500">{errors.business_name}</FieldDescription>}
              </Field>

              {/* Business Categories */}
              <Field>
                <FieldLabel className="flex items-center gap-1.5">
                  <Tags className="size-3.5 text-muted-foreground" />
                  Business Categories *
                </FieldLabel>
                <FieldDescription>Select at least one category for your business.</FieldDescription>
                <div className="flex flex-wrap gap-2 pt-1">
                  {categoryError ? (
                    <span className="text-sm text-red-500">Failed to load categories. Please refresh the page.</span>
                  ) : categories.length === 0 ? (
                    <div className="flex items-center gap-2 py-1">
                      <div className="size-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                      <span className="text-sm text-muted-foreground">Loading categories...</span>
                    </div>
                  ) : (
                    categories.map((cat) => (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => toggleCategory(cat.id)}
                        className={cn(
                          "flex items-center gap-1 rounded-full border px-3 py-1.5 text-xs font-medium transition-all",
                          selectedCategoryIds.includes(cat.id)
                            ? "border-primary bg-primary text-primary-foreground shadow-sm"
                            : "border-input bg-background hover:bg-muted hover:border-muted-foreground/30"
                        )}
                      >
                        {selectedCategoryIds.includes(cat.id) && <CheckCircle2 className="size-3" />}
                        {cat.name}
                      </button>
                    ))
                  )}
                </div>
                {errors.business_category_ids && <FieldDescription className="text-red-500">{errors.business_category_ids}</FieldDescription>}
              </Field>

              {/* Business Description */}
              <Field>
                <FieldLabel htmlFor="business-description">Business Description</FieldLabel>
                <textarea
                  id="business-description"
                  className={cn(
                    "flex min-h-[80px] w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary",
                    errors.business_description && "border-red-500"
                  )}
                  placeholder="Tell us about your business..."
                  value={businessDescription}
                  onChange={(e) => setBusinessDescription(e.target.value)}
                />
                {errors.business_description && <FieldDescription className="text-red-500">{errors.business_description}</FieldDescription>}
              </Field>

              {/* ─── Location ─── */}
              <div className="flex items-center gap-2 pt-2">
                <MapPin className="size-4 text-primary" />
                <h3 className="text-sm font-semibold">Business Location</h3>
                <Separator className="flex-1" />
              </div>

              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                <Field>
                  <FieldLabel htmlFor="business-country">Country</FieldLabel>
                  <Input
                    id="business-country"
                    type="text"
                    placeholder="e.g. Tanzania"
                    value={businessCountry}
                    onChange={(e) => setBusinessCountry(e.target.value)}
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="business-region">Region</FieldLabel>
                  <Input
                    id="business-region"
                    type="text"
                    placeholder="e.g. Dar es Salaam"
                    value={businessRegion}
                    onChange={(e) => setBusinessRegion(e.target.value)}
                  />
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                <Field>
                  <FieldLabel htmlFor="business-city">City</FieldLabel>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="business-city"
                      type="text"
                      placeholder="e.g. Dar es Salaam"
                      className="pl-9"
                      value={businessCity}
                      onChange={(e) => setBusinessCity(e.target.value)}
                    />
                  </div>
                </Field>
                <Field>
                  <FieldLabel htmlFor="business-address">Street Address</FieldLabel>
                  <Input
                    id="business-address"
                    type="text"
                    placeholder="e.g. 123 Main Street"
                    value={businessAddress}
                    onChange={(e) => setBusinessAddress(e.target.value)}
                  />
                </Field>
              </div>

              {/* ─── Products & Additional Info ─── */}
              <div className="flex items-center gap-2 pt-2">
                <Briefcase className="size-4 text-primary" />
                <h3 className="text-sm font-semibold">Products & Experience</h3>
                <Separator className="flex-1" />
              </div>

              <Field>
                <FieldLabel htmlFor="product-description">What do you sell?</FieldLabel>
                <textarea
                  id="product-description"
                  className="flex min-h-[60px] w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary"
                  placeholder="Describe the products you plan to sell..."
                  value={productDescription}
                  onChange={(e) => setProductDescription(e.target.value)}
                />
              </Field>

              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                <Field>
                  <FieldLabel htmlFor="years-in-business">Years in Business</FieldLabel>
                  <Input
                    id="years-in-business"
                    type="text"
                    placeholder="e.g. 3"
                    value={yearsInBusiness}
                    onChange={(e) => setYearsInBusiness(e.target.value)}
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="website-url">Website URL</FieldLabel>
                  <div className="relative">
                    <Globe className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="website-url"
                      type="url"
                      placeholder="https://example.com"
                      className="pl-9"
                      value={websiteUrl}
                      onChange={(e) => setWebsiteUrl(e.target.value)}
                    />
                  </div>
                </Field>
              </div>

              {/* ─── Contact Info ─── */}
              <div className="flex items-center gap-2 pt-2">
                <Phone className="size-4 text-primary" />
                <h3 className="text-sm font-semibold">Contact Information</h3>
                <Separator className="flex-1" />
              </div>

              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                <Field>
                  <FieldLabel htmlFor="contact-email">Contact Email</FieldLabel>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="contact-email"
                      type="email"
                      placeholder={user?.email || "business@example.com"}
                      className="pl-9"
                      value={contactEmail}
                      onChange={(e) => setContactEmail(e.target.value)}
                    />
                  </div>
                  <FieldDescription>Leave blank to use your account email.</FieldDescription>
                </Field>
                <Field>
                  <FieldLabel htmlFor="contact-phone">Contact Phone</FieldLabel>
                  <PhoneInput
                    id="contact-phone"
                    value={contactPhone}
                    onChange={setContactPhone}
                  />
                  <FieldDescription>Leave blank to use your account phone.</FieldDescription>
                </Field>
              </div>

              {/* ─── Agreement ─── */}
              <div className="flex items-center gap-2 pt-2">
                <ShieldCheck className="size-4 text-primary" />
                <h3 className="text-sm font-semibold">Agreement</h3>
                <Separator className="flex-1" />
              </div>

              <Field orientation="horizontal" className="items-start gap-2">
                <Checkbox
                  id="seller-agreement"
                  className="mt-0.5"
                  checked={agreed}
                  onCheckedChange={(val) => setAgreed(!!val)}
                  required
                />
                <FieldLabel
                  htmlFor="seller-agreement"
                  className="text-sm font-normal leading-snug"
                >
                  I agree to the{" "}
                  <a href="/terms/seller" className="underline underline-offset-4">
                    Seller Agreement
                  </a>{" "}
                  and{" "}
                  <a href="/privacy" className="underline underline-offset-4">
                    Privacy Policy
                  </a>
                </FieldLabel>
              </Field>

              <Button type="submit" className="w-full" loading={submitting} disabled={!agreed}>
                {submitting ? "Submitting..." : "Submit Application"}
              </Button>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
