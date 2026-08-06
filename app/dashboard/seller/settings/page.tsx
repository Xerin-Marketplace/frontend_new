"use client"

import * as React from "react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldDescription,
} from "@/components/ui/field"
import { Checkbox } from "@/components/ui/checkbox"
import { PhoneInput } from "@/components/ui/phone-input"
import { toast } from "@/components/ui/toast"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog"
import {
  Store,
  Save,
  Globe,
  FileText,
  Mail,
  Phone,
  MapPin,
  Shield,
  Lock,
  Bell,
  Settings as SettingsIcon,
  Upload,
  FileCheck,
  CheckCircle2,
  Clock,
  XCircle,
  Trash2,
  AlertCircle,
  Eye,
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronRight,
  Package,
  Smartphone,
  Monitor,
  Moon,
  Clock as ClockIcon,
} from "lucide-react"
import { api, type ApiError } from "@/lib/api"
import { useAuth } from "@/lib/auth-context"
import { useSearchParams } from "next/navigation"
import { PageSkeleton } from "@/components/skeletons"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

// ─── Types ──────────────────────────────────────────────────────────────────

type SellerResponse = {
  id: string
  user_id: string
  business_name: string
  business_description: string | null
  business_country: string | null
  business_region: string | null
  business_city: string | null
  business_address: string | null
  product_description: string | null
  years_in_business: string | null
  website_url: string | null
  contact_email: string | null
  contact_phone: string | null
  status: string
  agreement_accepted: boolean
  created_at: string
}

type KycDocument = {
  id: string
  seller_id: string
  document_type: string
  document_url: string
  status: string
  rejection_reason: string | null
  uploaded_at: string
}

type KycStatusResponse = {
  seller_status: string
  required_documents: string[]
  uploaded_documents: string[]
  missing_documents: string[]
  can_submit_for_review: boolean
}

type NotificationPrefsResponse = {
  in_app_enabled: boolean
  email_enabled: boolean
  sms_enabled: boolean
  push_enabled: boolean
  event_preferences: Record<string, Record<string, boolean>>
  quiet_hours_start: string | null
  quiet_hours_end: string | null
  timezone: string
}

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
  return e?.detail || "Something went wrong. Please try again."
}

function fileNameFromUrl(url: string): string {
  const parts = url.split("/")
  return parts[parts.length - 1] || url
}

// ─── Constants ──────────────────────────────────────────────────────────────

const STEPS = [
  { id: 0, label: "Account", icon: SettingsIcon, desc: "Personal information" },
  { id: 1, label: "Business", icon: Store, desc: "Store & business details" },
  { id: 2, label: "KYC", icon: FileText, desc: "Verification documents" },
  { id: 3, label: "Notifications", icon: Bell, desc: "Notification preferences" },
  { id: 4, label: "Security", icon: Shield, desc: "Password & security" },
] as const

const documentTypes = [
  "Business Registration Certificate",
  "TIN Certificate",
  "VAT Certificate",
  "Trade License",
  "ID / Passport Copy",
  "Bank Statement",
  "Utility Bill",
]

const kycStatusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: React.ReactNode; desc: string }> = {
  not_submitted: { label: "Not Submitted", variant: "outline", icon: <AlertCircle className="size-4" />, desc: "Upload your business documents to start selling." },
  pending_review: { label: "Pending Review", variant: "secondary", icon: <Clock className="size-4" />, desc: "Your documents are under review. This usually takes 1-2 business days." },
  approved: { label: "Approved", variant: "default", icon: <CheckCircle2 className="size-4" />, desc: "Your KYC is verified. You can sell on the marketplace." },
  rejected: { label: "Rejected", variant: "destructive", icon: <XCircle className="size-4" />, desc: "Some documents were rejected. Please re-upload corrected versions." },
}

const docStatusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" }> = {
  pending: { label: "Pending", variant: "secondary" },
  approved: { label: "Approved", variant: "default" },
  rejected: { label: "Rejected", variant: "destructive" },
}

// ─── Main Component ─────────────────────────────────────────────────────────

export default function SellerSettingsPage() {
  const { user } = useAuth()
  const searchParams = useSearchParams()
  const initialStep = (() => {
    const step = searchParams.get("step")
    if (step === "business") return 1
    if (step === "kyc") return 2
    if (step === "notifications") return 3
    if (step === "security") return 4
    return 0
  })()
  const [activeStep, setActiveStep] = React.useState(initialStep)
  const [loading, setLoading] = React.useState(true)
  const [saving, setSaving] = React.useState(false)

  // Account state
  const [account, setAccount] = React.useState({
    full_name: "",
    email: "",
    phone: "",
  })

  // Seller/store state
  const [seller, setSeller] = React.useState<SellerResponse | null>(null)
  const [storeData, setStoreData] = React.useState({
    business_name: "",
    business_email: "",
    business_phone: "",
    description: "",
    website: "",
    address_line: "",
    city: "",
    region: "",
    country: "",
    product_description: "",
    years_in_business: "",
  })

  // KYC state
  const [kycStatus, setKycStatus] = React.useState<string>("not_submitted")
  const [kycStatusData, setKycStatusData] = React.useState<KycStatusResponse | null>(null)
  const [documents, setDocuments] = React.useState<KycDocument[]>([])
  const [uploadOpen, setUploadOpen] = React.useState(false)
  const [deleteDoc, setDeleteDoc] = React.useState<KycDocument | null>(null)
  const [actionLoading, setActionLoading] = React.useState(false)

  // Notification state
  const [channelPrefs, setChannelPrefs] = React.useState({
    in_app_enabled: true,
    email_enabled: true,
    sms_enabled: false,
    push_enabled: false,
  })
  const [quietHoursStart, setQuietHoursStart] = React.useState("")
  const [quietHoursEnd, setQuietHoursEnd] = React.useState("")
  const [timezone, setTimezone] = React.useState("UTC")

  // Security state
  const [passwordOpen, setPasswordOpen] = React.useState(false)

  // ─── Data Loading ──────────────────────────────────────────────────────────

  React.useEffect(() => {
    Promise.allSettled([
      api.get<{ id: string; first_name: string; last_name: string; email: string; phone: string | null }>("/users/me"),
      api.get<SellerResponse>("/sellers/me").catch(() => null),
      api.get<KycStatusResponse>("/sellers/kyc-status").catch(() => null),
      api.get<KycDocument[]>("/sellers/kyc-documents").catch(() => []),
      api.get<NotificationPrefsResponse>("/notifications/preferences").catch(() => null),
    ])
      .then(([userRes, sellerRes, kycRes, docsRes, prefsRes]) => {
        if (userRes.status === "fulfilled") {
          const d = userRes.value
          setAccount({
            full_name: `${d.first_name ?? ""} ${d.last_name ?? ""}`.trim(),
            email: d.email,
            phone: d.phone ?? "",
          })
        }

        if (sellerRes.status === "fulfilled" && sellerRes.value) {
          const s = sellerRes.value
          setSeller(s)
          setStoreData({
            business_name: s.business_name ?? "",
            business_email: s.contact_email ?? "",
            business_phone: s.contact_phone ?? "",
            description: s.business_description ?? "",
            website: s.website_url ?? "",
            address_line: s.business_address ?? "",
            city: s.business_city ?? "",
            region: s.business_region ?? "",
            country: s.business_country ?? "",
            product_description: s.product_description ?? "",
            years_in_business: s.years_in_business ?? "",
          })
        }

        if (kycRes.status === "fulfilled" && kycRes.value) {
          setKycStatusData(kycRes.value)
          setKycStatus(kycRes.value.seller_status)
        }

        if (docsRes.status === "fulfilled") {
          setDocuments(docsRes.value)
        }

        if (prefsRes.status === "fulfilled" && prefsRes.value) {
          const p = prefsRes.value
          setChannelPrefs({
            in_app_enabled: p.in_app_enabled,
            email_enabled: p.email_enabled,
            sms_enabled: p.sms_enabled,
            push_enabled: p.push_enabled,
          })
          setQuietHoursStart(p.quiet_hours_start ?? "")
          setQuietHoursEnd(p.quiet_hours_end ?? "")
          setTimezone(p.timezone || "UTC")
        }
      })
      .finally(() => setLoading(false))
  }, [])

  // ─── Handlers ──────────────────────────────────────────────────────────────

  const updateAccount = (field: keyof typeof account, value: string) => {
    setAccount((prev) => ({ ...prev, [field]: value }))
  }

  const updateStore = (field: keyof typeof storeData, value: string) => {
    setStoreData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSaveAccount = async () => {
    setSaving(true)
    try {
      const [firstName, ...rest] = account.full_name.split(" ")
      const lastName = rest.join(" ")
      await api.patch("/users/me", { first_name: firstName, last_name: lastName, email: account.email, phone: account.phone })
      toast.add({ title: "Account saved!", description: "Your profile has been updated.", type: "success" })
    } catch (err) {
      toast.add({ title: "Failed to save", description: getApiError(err), type: "error" })
    } finally {
      setSaving(false)
    }
  }

  const handleSaveStore = async () => {
    setSaving(true)
    try {
      await api.patch("/sellers/me", {
        business_name: storeData.business_name,
        business_description: storeData.description,
        business_country: storeData.country,
        business_region: storeData.region,
        business_city: storeData.city,
        business_address: storeData.address_line,
        product_description: storeData.product_description,
        years_in_business: storeData.years_in_business,
        website_url: storeData.website,
        contact_email: storeData.business_email,
        contact_phone: storeData.business_phone,
      })
      toast.add({ title: "Store profile saved!", description: "Your business information has been updated.", type: "success" })
    } catch (err) {
      toast.add({ title: "Failed to save", description: getApiError(err), type: "error" })
    } finally {
      setSaving(false)
    }
  }

  const handleUpload = async (docType: string, file: File) => {
    setActionLoading(true)
    try {
      const formData = new FormData()
      formData.append("document_type", docType)
      formData.append("file", file)
      const newDoc = await api.upload<KycDocument>("/sellers/kyc-documents", formData)
      setDocuments((prev) => [newDoc, ...prev])
      setUploadOpen(false)
      toast.add({ title: "Document uploaded!", description: `${docType} has been submitted for review.`, type: "success" })
    } catch (err) {
      toast.add({ title: "Failed to upload", description: getApiError(err), type: "error" })
    } finally {
      setActionLoading(false)
    }
  }

  const handleDeleteDoc = async (id: string) => {
    const doc = documents.find((d) => d.id === id)
    setActionLoading(true)
    try {
      await api.delete(`/sellers/kyc-documents/${id}`)
      setDocuments((prev) => prev.filter((d) => d.id !== id))
      setDeleteDoc(null)
      toast.add({ title: "Document deleted!", description: `${fileNameFromUrl(doc?.document_url ?? "")} has been removed.`, type: "success" })
    } catch (err) {
      toast.add({ title: "Failed to delete", description: getApiError(err), type: "error" })
    } finally {
      setActionLoading(false)
    }
  }

  const handleSavePrefs = async () => {
    setSaving(true)
    try {
      await api.patch("/notifications/preferences", {
        in_app_enabled: channelPrefs.in_app_enabled,
        email_enabled: channelPrefs.email_enabled,
        sms_enabled: channelPrefs.sms_enabled,
        push_enabled: channelPrefs.push_enabled,
        quiet_hours_start: quietHoursStart || null,
        quiet_hours_end: quietHoursEnd || null,
        timezone,
      })
      toast.add({ title: "Preferences saved!", description: "Notification settings have been saved.", type: "success" })
    } catch (err) {
      toast.add({ title: "Failed to save", description: getApiError(err), type: "error" })
    } finally {
      setSaving(false)
    }
  }

  const handleChangePassword = async (data: { current: string; new: string; confirm: string }) => {
    if (data.new !== data.confirm) {
      toast.add({ title: "Passwords don't match", description: "New password and confirmation must match.", type: "error" })
      return
    }
    try {
      await api.post("/auth/change-password", { current_password: data.current, new_password: data.new })
      setPasswordOpen(false)
      toast.add({ title: "Password changed!", description: "Your password has been updated.", type: "success" })
    } catch (err) {
      toast.add({ title: "Failed to change password", description: getApiError(err), type: "error" })
    }
  }

  // ─── Render ─────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <PageSkeleton>
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-48 w-full" />
      </PageSkeleton>
    )
  }

  const kycCfg = kycStatusConfig[kycStatus] ?? kycStatusConfig.not_submitted

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Seller Settings</h2>
        <p className="text-sm text-muted-foreground">Manage your account, store, KYC documents, and preferences.</p>
      </div>

      {/* ─── Stepper ─────────────────────────────────────────────────────────── */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between gap-2 overflow-x-auto pb-2">
            {STEPS.map((step, idx) => {
              const Icon = step.icon
              const isActive = activeStep === idx
              const isCompleted = activeStep > idx
              return (
                <React.Fragment key={step.id}>
                  <button
                    onClick={() => setActiveStep(idx)}
                    className={cn(
                      "flex flex-col items-center gap-2 rounded-xl px-3 py-2 transition-all min-w-[80px]",
                      isActive && "bg-primary/5",
                    )}
                  >
                    <div
                      className={cn(
                        "flex size-10 items-center justify-center rounded-full border-2 transition-all",
                        isCompleted && "border-primary bg-primary text-primary-foreground",
                        isActive && !isCompleted && "border-primary bg-primary/10 text-primary",
                        !isActive && !isCompleted && "border-muted bg-muted/50 text-muted-foreground",
                      )}
                    >
                      {isCompleted ? <Check className="size-5" /> : <Icon className="size-4" />}
                    </div>
                    <div className="text-center">
                      <div className={cn("text-xs font-medium", isActive ? "text-foreground" : "text-muted-foreground")}>
                        {step.label}
                      </div>
                      <div className="text-[10px] text-muted-foreground hidden sm:block">{step.desc}</div>
                    </div>
                  </button>
                  {idx < STEPS.length - 1 && (
                    <div className={cn("h-0.5 flex-1 min-w-[20px] rounded-full transition-colors", activeStep > idx ? "bg-primary" : "bg-muted")} />
                  )}
                </React.Fragment>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* ─── Step Content ────────────────────────────────────────────────────── */}

      {/* Step 0: Account Info */}
      {activeStep === 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <SettingsIcon className="size-4" /> Account Information
            </CardTitle>
            <CardDescription>Your personal account details</CardDescription>
          </CardHeader>
          <CardContent>
            <FieldGroup>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field>
                  <FieldLabel htmlFor="full_name">Full Name</FieldLabel>
                  <Input id="full_name" value={account.full_name} onChange={(e) => updateAccount("full_name", e.target.value)} />
                </Field>
                <Field>
                  <FieldLabel htmlFor="email">Email</FieldLabel>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input id="email" type="email" className="pl-9" value={account.email} onChange={(e) => updateAccount("email", e.target.value)} />
                  </div>
                </Field>
              </div>
              <Field>
                <FieldLabel htmlFor="phone">Phone</FieldLabel>
                <PhoneInput id="phone" value={account.phone} onChange={(v) => updateAccount("phone", v)} />
              </Field>
              <div className="flex justify-between">
                <div />
                <Button onClick={handleSaveAccount} disabled={saving}>
                  <Save className="size-4" /> {saving ? "Saving..." : "Save Account"}
                </Button>
              </div>
            </FieldGroup>
          </CardContent>
        </Card>
      )}

      {/* Step 1: Business Profile */}
      {activeStep === 1 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  <Store className="size-4" /> Business Profile
                </CardTitle>
                <CardDescription>Your store and business information</CardDescription>
              </div>
              {seller && (
                <Badge variant={seller.status === "approved" || seller.status === "active" ? "default" : "secondary"}>
                  {seller.status}
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <FieldGroup>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field>
                  <FieldLabel htmlFor="business_name">Business Name</FieldLabel>
                  <div className="relative">
                    <Store className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input id="business_name" className="pl-9" value={storeData.business_name} onChange={(e) => updateStore("business_name", e.target.value)} />
                  </div>
                </Field>
                <Field>
                  <FieldLabel htmlFor="years_in_business">Years in Business</FieldLabel>
                  <Input id="years_in_business" value={storeData.years_in_business} onChange={(e) => updateStore("years_in_business", e.target.value)} placeholder="e.g. 5 years" />
                </Field>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field>
                  <FieldLabel htmlFor="business_email">Business Email</FieldLabel>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input id="business_email" type="email" className="pl-9" value={storeData.business_email} onChange={(e) => updateStore("business_email", e.target.value)} />
                  </div>
                </Field>
                <Field>
                  <FieldLabel htmlFor="business_phone">Business Phone</FieldLabel>
                  <PhoneInput id="business_phone" value={storeData.business_phone} onChange={(v) => updateStore("business_phone", v)} />
                </Field>
              </div>
              <Field>
                <FieldLabel htmlFor="description">Business Description</FieldLabel>
                <textarea
                  id="description"
                  value={storeData.description}
                  onChange={(e) => updateStore("description", e.target.value)}
                  rows={3}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="Tell customers about your business..."
                />
                <FieldDescription>Shown on your public store page</FieldDescription>
              </Field>
              <Field>
                <FieldLabel htmlFor="website">Website</FieldLabel>
                <div className="relative">
                  <Globe className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input id="website" className="pl-9" value={storeData.website} onChange={(e) => updateStore("website", e.target.value)} placeholder="https://..." />
                </div>
              </Field>
              <Field>
                <FieldLabel htmlFor="product_description">What do you sell?</FieldLabel>
                <textarea
                  id="product_description"
                  value={storeData.product_description}
                  onChange={(e) => updateStore("product_description", e.target.value)}
                  rows={2}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="Describe the types of products you sell..."
                />
              </Field>
              <div className="grid gap-4 sm:grid-cols-3">
                <Field>
                  <FieldLabel htmlFor="city">City</FieldLabel>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input id="city" className="pl-9" value={storeData.city} onChange={(e) => updateStore("city", e.target.value)} />
                  </div>
                </Field>
                <Field>
                  <FieldLabel htmlFor="region">Region</FieldLabel>
                  <Input id="region" value={storeData.region} onChange={(e) => updateStore("region", e.target.value)} />
                </Field>
                <Field>
                  <FieldLabel htmlFor="country">Country</FieldLabel>
                  <Input id="country" value={storeData.country} onChange={(e) => updateStore("country", e.target.value)} />
                </Field>
              </div>
              <Field>
                <FieldLabel htmlFor="address_line">Street Address</FieldLabel>
                <Input id="address_line" value={storeData.address_line} onChange={(e) => updateStore("address_line", e.target.value)} />
              </Field>
              <div className="flex justify-between">
                <div />
                <Button onClick={handleSaveStore} disabled={saving}>
                  <Save className="size-4" /> {saving ? "Saving..." : "Save Business Profile"}
                </Button>
              </div>
            </FieldGroup>
          </CardContent>
        </Card>
      )}

      {/* Step 2: KYC Documents */}
      {activeStep === 2 && (
        <>
          {/* KYC Status Banner */}
          <Card className={kycStatus === "approved" ? "border-green-500" : kycStatus === "rejected" ? "border-red-500" : ""}>
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <div className={cn(
                  "flex size-12 shrink-0 items-center justify-center rounded-full",
                  kycStatus === "approved" ? "bg-green-100 text-green-600" :
                  kycStatus === "rejected" ? "bg-red-100 text-red-600" :
                  kycStatus === "pending_review" ? "bg-blue-100 text-blue-600" :
                  "bg-muted text-muted-foreground"
                )}>
                  {kycCfg.icon}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-semibold">Verification Status</h3>
                    <Badge variant={kycCfg.variant}>{kycCfg.label}</Badge>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{kycCfg.desc}</p>
                  {kycStatus === "rejected" && (
                    <div className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950/50 dark:text-red-300">
                      <strong>Action needed:</strong> Re-upload the rejected documents with corrections.
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Upload Button */}
          <div className="flex justify-end">
            <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
              <DialogTrigger render={<Button><Upload className="size-4" /> Upload Document</Button>} />
              <DialogContent className="sm:max-w-[480px]">
                <UploadForm onSubmit={handleUpload} actionLoading={actionLoading} />
              </DialogContent>
            </Dialog>
          </div>

          {/* Documents List */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="size-4" /> Submitted Documents ({documents.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {documents.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="flex size-16 items-center justify-center rounded-2xl bg-muted">
                    <FileText className="size-8 text-muted-foreground" />
                  </div>
                  <p className="mt-4 text-sm text-muted-foreground">
                    No documents uploaded yet. Upload your first KYC document to get started.
                  </p>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {documents.map((doc) => (
                    <div key={doc.id} className="flex items-center gap-4 rounded-xl border p-4 transition-colors hover:bg-muted/20">
                      <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted">
                        <FileText className="size-5 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">{doc.document_type}</span>
                          <Badge variant={docStatusConfig[doc.status]?.variant ?? "secondary"} className="text-xs">
                            {docStatusConfig[doc.status]?.label ?? doc.status}
                          </Badge>
                        </div>
                        <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                          <span className="font-mono">{fileNameFromUrl(doc.document_url)}</span>
                          <span>{new Date(doc.uploaded_at).toLocaleDateString()}</span>
                        </div>
                        {doc.rejection_reason && (
                          <div className="mt-2 rounded bg-red-50 px-2 py-1 text-xs text-red-700 dark:bg-red-950/50 dark:text-red-300">
                            <strong>Rejected:</strong> {doc.rejection_reason}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon-sm" title="View" onClick={() => window.open(doc.document_url, "_blank")}>
                          <Eye className="size-4" />
                        </Button>
                        <Button variant="ghost" size="icon-sm" disabled={actionLoading} onClick={() => setDeleteDoc(doc)} title="Delete" className="text-red-500 hover:text-red-600">
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Required Documents */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <FileCheck className="size-4" /> Required Documents
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-2 sm:grid-cols-2">
                {(kycStatusData?.required_documents ?? documentTypes).map((doc) => {
                  const uploaded = documents.some((d) => d.document_type === doc)
                  return (
                    <div key={doc} className={cn(
                      "flex items-center gap-2 rounded-lg border p-3 text-sm transition-colors",
                      uploaded ? "border-green-300 bg-green-50 dark:border-green-800 dark:bg-green-950/30" : "border-border"
                    )}>
                      {uploaded ? <CheckCircle2 className="size-4 text-green-600" /> : <FileCheck className="size-4 text-muted-foreground" />}
                      {doc}
                      {uploaded && <Badge variant="default" className="ml-auto text-xs">Uploaded</Badge>}
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          {/* Delete Confirmation */}
          <Dialog open={!!deleteDoc} onOpenChange={(open) => !open && setDeleteDoc(null)}>
            <DialogContent className="sm:max-w-[420px]">
              <DialogHeader>
                <DialogTitle>Delete Document?</DialogTitle>
                <DialogDescription>
                  Are you sure you want to delete <strong>{deleteDoc ? fileNameFromUrl(deleteDoc.document_url) : ""}</strong>? You can re-upload it later.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>
                <Button variant="destructive" disabled={actionLoading} onClick={() => deleteDoc && handleDeleteDoc(deleteDoc.id)}>
                  <Trash2 className="size-4" /> Delete
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </>
      )}

      {/* Step 3: Notification Preferences */}
      {activeStep === 3 && (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Bell className="size-4" /> Notification Channels
              </CardTitle>
              <CardDescription>Choose how you want to receive notifications</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {[
                  { key: "in_app_enabled" as const, label: "In-App", icon: <Monitor className="size-4" /> },
                  { key: "email_enabled" as const, label: "Email", icon: <Mail className="size-4" /> },
                  { key: "sms_enabled" as const, label: "SMS", icon: <Smartphone className="size-4" /> },
                  { key: "push_enabled" as const, label: "Push", icon: <Bell className="size-4" /> },
                ].map((ch) => (
                  <div
                    key={ch.key}
                    className={cn(
                      "flex items-center justify-between rounded-xl border p-4 transition-colors",
                      channelPrefs[ch.key] ? "border-primary/50 bg-primary/5" : "border-border"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "flex size-10 items-center justify-center rounded-lg",
                        channelPrefs[ch.key] ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                      )}>
                        {ch.icon}
                      </div>
                      <div>
                        <div className="text-sm font-medium">{ch.label}</div>
                        <div className="text-xs text-muted-foreground">{channelPrefs[ch.key] ? "Enabled" : "Disabled"}</div>
                      </div>
                    </div>
                    <Switch
                      checked={channelPrefs[ch.key]}
                      onCheckedChange={() => setChannelPrefs((prev) => ({ ...prev, [ch.key]: !prev[ch.key] }))}
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Moon className="size-4" /> Quiet Hours
              </CardTitle>
              <CardDescription>Pause non-critical notifications during specified hours</CardDescription>
            </CardHeader>
            <CardContent>
              <FieldGroup>
                <div className="grid gap-4 sm:grid-cols-3">
                  <Field>
                    <FieldLabel htmlFor="quiet_start"><span className="flex items-center gap-1.5"><ClockIcon className="size-3.5" /> Start Time</span></FieldLabel>
                    <Input id="quiet_start" type="time" value={quietHoursStart} onChange={(e) => setQuietHoursStart(e.target.value)} />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="quiet_end"><span className="flex items-center gap-1.5"><ClockIcon className="size-3.5" /> End Time</span></FieldLabel>
                    <Input id="quiet_end" type="time" value={quietHoursEnd} onChange={(e) => setQuietHoursEnd(e.target.value)} />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="tz"><span className="flex items-center gap-1.5"><Globe className="size-3.5" /> Timezone</span></FieldLabel>
                    <Input id="tz" value={timezone} onChange={(e) => setTimezone(e.target.value)} placeholder="UTC" />
                  </Field>
                </div>
                <div className="flex justify-end">
                  <Button onClick={handleSavePrefs} disabled={saving}>
                    <Save className="size-4" /> {saving ? "Saving..." : "Save Preferences"}
                  </Button>
                </div>
              </FieldGroup>
            </CardContent>
          </Card>
        </>
      )}

      {/* Step 4: Security */}
      {activeStep === 4 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Shield className="size-4" /> Security
            </CardTitle>
            <CardDescription>Account security and password management</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between rounded-xl border p-4 transition-colors hover:bg-muted/20">
                <div className="flex items-center gap-3">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted">
                    <Lock className="size-4 text-muted-foreground" />
                  </div>
                  <div>
                    <div className="text-sm font-medium">Change Password</div>
                    <div className="text-xs text-muted-foreground">Update your password regularly for security</div>
                  </div>
                </div>
                <Button variant="outline" size="sm" onClick={() => setPasswordOpen(true)}>Change</Button>
              </div>
              <div className="flex items-center justify-between rounded-xl border p-4 transition-colors hover:bg-muted/20">
                <div className="flex items-center gap-3">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-green-50 dark:bg-green-950/50">
                    <Shield className="size-4 text-green-600" />
                  </div>
                  <div>
                    <div className="text-sm font-medium">Account Status</div>
                    <div className="text-xs text-muted-foreground">Your account security status</div>
                  </div>
                </div>
                <Badge variant="default" className="gap-1"><CheckCircle2 className="size-3" /> Secure</Badge>
              </div>
              <div className="flex items-center justify-between rounded-xl border p-4 transition-colors hover:bg-muted/20">
                <div className="flex items-center gap-3">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted">
                    <Smartphone className="size-4 text-muted-foreground" />
                  </div>
                  <div>
                    <div className="text-sm font-medium">Two-Factor Authentication</div>
                    <div className="text-xs text-muted-foreground">Add an extra layer of security</div>
                  </div>
                </div>
                <Badge variant="secondary">Not Enabled</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ─── Navigation Buttons ─────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={() => setActiveStep((prev) => Math.max(0, prev - 1))}
          disabled={activeStep === 0}
        >
          <ArrowLeft className="size-4" /> Previous
        </Button>
        <div className="flex items-center gap-1.5">
          {STEPS.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setActiveStep(idx)}
              className={cn(
                "h-2 rounded-full transition-all",
                activeStep === idx ? "w-8 bg-primary" : "w-2 bg-muted hover:bg-muted-foreground/50"
              )}
            />
          ))}
        </div>
        <Button
          variant="outline"
          onClick={() => setActiveStep((prev) => Math.min(STEPS.length - 1, prev + 1))}
          disabled={activeStep === STEPS.length - 1}
        >
          Next <ArrowRight className="size-4" />
        </Button>
      </div>

      {/* Change Password Dialog */}
      <Dialog open={passwordOpen} onOpenChange={setPasswordOpen}>
        <DialogContent className="sm:max-w-[440px]">
          <PasswordForm onSubmit={handleChangePassword} />
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ─── Upload Form ─────────────────────────────────────────────────────────────

function UploadForm({ onSubmit, actionLoading }: { onSubmit: (docType: string, file: File) => void; actionLoading: boolean }) {
  const [docType, setDocType] = React.useState(documentTypes[0])
  const [file, setFile] = React.useState<File | null>(null)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!file) return
    onSubmit(docType, file)
  }

  return (
    <form onSubmit={handleSubmit}>
      <DialogHeader>
        <DialogTitle>Upload KYC Document</DialogTitle>
        <DialogDescription>Select document type and upload the file. Supported formats: PDF, JPG, PNG (max 5MB).</DialogDescription>
      </DialogHeader>
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="docType">Document Type</FieldLabel>
          <select
            id="docType"
            value={docType}
            onChange={(e) => setDocType(e.target.value)}
            className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
          >
            {documentTypes.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </Field>
        <Field>
          <FieldLabel htmlFor="file">File</FieldLabel>
          <div className="flex w-full items-center justify-center rounded-lg border-2 border-dashed border-input p-6 transition-colors hover:border-primary/50">
            <label htmlFor="file" className="flex cursor-pointer flex-col items-center gap-2">
              <Upload className="size-8 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                {file ? file.name : "Click to select a file"}
              </span>
              <input
                id="file"
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) setFile(f) }}
                required
                className="hidden"
              />
            </label>
          </div>
          {file && <FieldDescription>Selected: {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)</FieldDescription>}
        </Field>
      </FieldGroup>
      <DialogFooter>
        <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>
        <Button type="submit" disabled={actionLoading || !file}>
          <Upload className="size-4" /> {actionLoading ? "Uploading..." : "Upload"}
        </Button>
      </DialogFooter>
    </form>
  )
}

// ─── Password Form ───────────────────────────────────────────────────────────

function PasswordForm({ onSubmit }: { onSubmit: (data: { current: string; new: string; confirm: string }) => void }) {
  const [current, setCurrent] = React.useState("")
  const [newPwd, setNewPwd] = React.useState("")
  const [confirm, setConfirm] = React.useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!current || !newPwd || !confirm) return
    onSubmit({ current, new: newPwd, confirm })
  }

  return (
    <form onSubmit={handleSubmit}>
      <DialogHeader>
        <DialogTitle>Change Password</DialogTitle>
        <DialogDescription>Enter your current password and a new password.</DialogDescription>
      </DialogHeader>
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="current">Current Password</FieldLabel>
          <Input id="current" type="password" value={current} onChange={(e) => setCurrent(e.target.value)} required />
        </Field>
        <Field>
          <FieldLabel htmlFor="new">New Password</FieldLabel>
          <Input id="new" type="password" value={newPwd} onChange={(e) => setNewPwd(e.target.value)} required />
          <FieldDescription>At least 8 characters</FieldDescription>
        </Field>
        <Field>
          <FieldLabel htmlFor="confirm">Confirm New Password</FieldLabel>
          <Input id="confirm" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required />
        </Field>
      </FieldGroup>
      <DialogFooter>
        <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>
        <Button type="submit">Update Password</Button>
      </DialogFooter>
    </form>
  )
}
