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

const statusConfig: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  pending: { label: "Pending Review", icon: Clock, color: "text-amber-600" },
  under_review: { label: "Under Review", icon: Clock, color: "text-blue-600" },
  approved: { label: "Approved", icon: CheckCircle2, color: "text-green-600" },
  rejected: { label: "Rejected", icon: XCircle, color: "text-red-600" },
  suspended: { label: "Suspended", icon: XCircle, color: "text-red-600" },
}

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
      <div className="mx-auto max-w-3xl px-4 py-12">
        <div className="flex items-center gap-3">
          <div className="size-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <span className="text-muted-foreground">Loading...</span>
        </div>
      </div>
    )
  }

  // If user already has an application, show status
  if (applicationStatus?.has_application) {
    const cfg = statusConfig[applicationStatus.status ?? "pending"] ?? statusConfig.pending
    const StatusIcon = cfg.icon

    return (
      <div className="mx-auto max-w-3xl px-4 py-12">
        <button
          onClick={() => router.push("/dashboard/user")}
          className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Back to Dashboard
        </button>

        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-2xl bg-primary/10">
              <Store className="size-8 text-primary" />
            </div>
            <CardTitle className="text-2xl">Seller Application Status</CardTitle>
            <CardDescription>
              {applicationStatus.business_name}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-col items-center gap-2">
              <div className={cn("flex items-center gap-2 rounded-full border px-4 py-2", cfg.color)}>
                <StatusIcon className="size-5" />
                <span className="font-semibold">{cfg.label}</span>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-lg border bg-muted/30 p-4">
                <p className="text-xs text-muted-foreground">Submitted</p>
                <p className="mt-1 text-sm font-medium">{formatDate(applicationStatus.submitted_at)}</p>
              </div>
              <div className="rounded-lg border bg-muted/30 p-4">
                <p className="text-xs text-muted-foreground">Approved</p>
                <p className="mt-1 text-sm font-medium">{formatDate(applicationStatus.approved_at)}</p>
              </div>
            </div>

            {applicationStatus.status === "approved" && applicationStatus.can_access_seller_dashboard && (
              <div className="flex flex-col items-center gap-3">
                <p className="text-sm text-muted-foreground">
                  Your seller account is approved! You can now access the Seller Center.
                </p>
                <Button onClick={() => router.push("/dashboard/seller")} className="gap-2">
                  <Package className="size-4" />
                  Go to Seller Dashboard
                </Button>
              </div>
            )}

            {applicationStatus.status === "rejected" && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-center dark:border-red-900 dark:bg-red-950/50">
                <p className="text-sm text-red-800 dark:text-red-200">
                  Your application was rejected. Please contact support for more information.
                </p>
              </div>
            )}

            {(applicationStatus.status === "pending" || applicationStatus.status === "under_review") && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-center dark:border-amber-900 dark:bg-amber-950/50">
                <p className="text-sm text-amber-800 dark:text-amber-200">
                  Your application is being reviewed. We&apos;ll notify you once it&apos;s processed.
                </p>
              </div>
            )}

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
    <div className="mx-auto max-w-3xl px-4 py-12">
      <button
        onClick={() => router.push("/dashboard/user")}
        className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Back to Dashboard
      </button>

      <Card>
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-2xl bg-primary/10">
            <Store className="size-8 text-primary" />
          </div>
          <CardTitle className="text-2xl">Become a Seller</CardTitle>
          <CardDescription>
            Submit your business details to start selling on XerinMarket.
            Your existing account, orders, and addresses will be preserved.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <FieldGroup>
              {/* Business Name */}
              <Field>
                <FieldLabel htmlFor="business-name">Business Name *</FieldLabel>
                <div className="relative">
                  <Store className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="business-name"
                    type="text"
                    placeholder="Acme Trading Co."
                    className={cn("pl-9", errors.business_name && "border-red-500")}
                    value={businessName}
                    onChange={(e) => {
                      setBusinessName(e.target.value)
                      if (errors.business_name) setErrors((p) => ({ ...p, business_name: "" }))
                    }}
                    required
                  />
                </div>
                {errors.business_name && <FieldDescription className="text-red-500">{errors.business_name}</FieldDescription>}
              </Field>

              {/* Business Categories */}
              <Field>
                <FieldLabel>Business Categories *</FieldLabel>
                <FieldDescription>Select at least one category for your business.</FieldDescription>
                <div className="flex flex-wrap gap-2 pt-1">
                  {categoryError ? (
                    <span className="text-sm text-red-500">Failed to load categories. Please refresh the page.</span>
                  ) : categories.length === 0 ? (
                    <span className="text-sm text-muted-foreground">Loading categories...</span>
                  ) : (
                    categories.map((cat) => (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => toggleCategory(cat.id)}
                        className={cn(
                          "flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                          selectedCategoryIds.includes(cat.id)
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-input bg-background hover:bg-muted"
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
                    "flex min-h-[80px] w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary",
                    errors.business_description && "border-red-500"
                  )}
                  placeholder="Tell us about your business..."
                  value={businessDescription}
                  onChange={(e) => setBusinessDescription(e.target.value)}
                />
                {errors.business_description && <FieldDescription className="text-red-500">{errors.business_description}</FieldDescription>}
              </Field>

              {/* Location */}
              <div className="grid gap-4 sm:grid-cols-2">
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
              <div className="grid gap-4 sm:grid-cols-2">
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

              {/* Product Description */}
              <Field>
                <FieldLabel htmlFor="product-description">What do you sell?</FieldLabel>
                <textarea
                  id="product-description"
                  className="flex min-h-[60px] w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                  placeholder="Describe the products you plan to sell..."
                  value={productDescription}
                  onChange={(e) => setProductDescription(e.target.value)}
                />
              </Field>

              {/* Additional Info */}
              <div className="grid gap-4 sm:grid-cols-2">
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

              {/* Contact Info */}
              <div className="grid gap-4 sm:grid-cols-2">
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

              {/* Agreement */}
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
