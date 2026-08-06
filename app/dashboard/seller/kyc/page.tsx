"use client"

import * as React from "react"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
  Field,
  FieldGroup,
  FieldLabel,
  FieldDescription,
} from "@/components/ui/field"
import { toast } from "@/components/ui/toast"
import {
  FileCheck,
  Upload,
  FileText,
  CheckCircle2,
  Clock,
  XCircle,
  Trash2,
  AlertCircle,
  Eye,
  Loader2,
  RotateCcw,
  Lock,
  Send,
  Plus,
  Paperclip,
  Headphones,
  Mail,
  MessageCircle,
} from "lucide-react"
import { api, type ApiError } from "@/lib/api"
import { PageSkeleton } from "@/components/skeletons"
import { Skeleton } from "@/components/ui/skeleton"

type KycStatus = "pending" | "under_review" | "approved" | "rejected" | "suspended" | "not_submitted"

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

type PaginatedKycDocuments = {
  total: number
  page: number
  page_size: number
  results: KycDocument[]
}

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: React.ReactNode; desc: string }> = {
  pending: { label: "Pending", variant: "outline", icon: <AlertCircle className="size-4" />, desc: "Upload your business documents to start selling." },
  under_review: { label: "Under Review", variant: "secondary", icon: <Clock className="size-4" />, desc: "Your documents are under review. This usually takes 1-2 business days." },
  approved: { label: "Approved", variant: "default", icon: <CheckCircle2 className="size-4" />, desc: "Your KYC is verified. You can sell on the marketplace." },
  rejected: { label: "Rejected", variant: "destructive", icon: <XCircle className="size-4" />, desc: "Some documents were rejected. Please re-upload corrected versions." },
  suspended: { label: "Suspended", variant: "destructive", icon: <XCircle className="size-4" />, desc: "Your seller account has been suspended. Contact support for assistance." },
  not_submitted: { label: "Not Submitted", variant: "outline", icon: <AlertCircle className="size-4" />, desc: "Upload your business documents to start selling." },
}

const docStatusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" }> = {
  pending: { label: "Pending", variant: "secondary" },
  approved: { label: "Approved", variant: "default" },
  rejected: { label: "Rejected", variant: "destructive" },
}

const documentTypeLabels: Record<string, string> = {
  tin: "TIN Certificate",
  business_profile: "Business Profile",
  business_registration: "Business Registration Certificate",
}

const documentTypes = ["tin", "business_profile", "business_registration"]

const ADDITIONAL_DOC_CATEGORIES = [
  { value: "tax_certificate", label: "Tax Clearance Certificate" },
  { value: "trade_license", label: "Trade License" },
  { value: "id_copy", label: "National ID / Passport Copy" },
  { value: "utility_bill", label: "Utility Bill (Proof of Address)" },
  { value: "bank_statement", label: "Bank Statement" },
  { value: "partnership_deed", label: "Partnership Deed" },
  { value: "memorandum", label: "Memorandum & Articles of Association" },
  { value: "other", label: "Other Document" },
] as const

function getApiError(err: unknown): string {
  const e = err as ApiError
  return e?.detail || "Something went wrong. Please try again."
}

function fileNameFromUrl(url: string): string {
  const parts = url.split("/")
  return parts[parts.length - 1] || url
}

function resolveFileUrl(rawUrl: string): string {
  if (/^https?:\/\//i.test(rawUrl)) return rawUrl
  const normalized = rawUrl.replace(/\\/g, "/")
  const uploadIdx = normalized.indexOf("uploads/")
  const relPath = uploadIdx >= 0 ? normalized.slice(uploadIdx + 8) : normalized
  return `/uploads/${relPath}`
}

export default function SellerKYCPage() {
  const [kycStatus, setKycStatus] = React.useState<KycStatus>("not_submitted")
  const [kycStatusData, setKycStatusData] = React.useState<KycStatusResponse | null>(null)
  const [documents, setDocuments] = React.useState<KycDocument[]>([])
  const [loading, setLoading] = React.useState(true)
  const [uploadOpen, setUploadOpen] = React.useState(false)
  const [additionalOpen, setAdditionalOpen] = React.useState(false)
  const [previewDoc, setPreviewDoc] = React.useState<KycDocument | null>(null)
  const [deleteDoc, setDeleteDoc] = React.useState<KycDocument | null>(null)
  const [actionLoading, setActionLoading] = React.useState(false)

  React.useEffect(() => {
    Promise.allSettled([
      api.get<KycStatusResponse>("/sellers/kyc-status"),
      api.get<PaginatedKycDocuments>("/sellers/kyc-documents?page=1&page_size=100"),
    ])
      .then(([statusRes, docsRes]) => {
        if (statusRes.status === "fulfilled") {
          setKycStatusData(statusRes.value)
          setKycStatus(statusRes.value.seller_status as KycStatus)
        }
        if (docsRes.status === "fulfilled") {
          const val = docsRes.value
          setDocuments(Array.isArray(val?.results) ? val.results : Array.isArray(val) ? val : [])
        }
      })
      .finally(() => setLoading(false))
  }, [])

  const handleUpload = async (docType: string, file: File) => {
    setActionLoading(true)
    try {
      const existing = documents.find((d) => d.document_type === docType)
      if (existing) {
        await api.delete(`/sellers/kyc-documents/${existing.id}`)
      }
      const formData = new FormData()
      formData.append("document_type", docType)
      formData.append("file", file)
      const newDoc = await api.upload<KycDocument>("/sellers/kyc-documents", formData)
      setDocuments((prev) => {
        const filtered = prev.filter((d) => d.document_type !== docType)
        return [newDoc, ...filtered]
      })
      setUploadOpen(false)
      toast.add({
        title: existing ? "Document replaced!" : "Document uploaded!",
        description: `${documentTypeLabels[docType] ?? docType} has been submitted for review.`,
        type: "success",
      })
    } catch (err) {
      toast.add({
        title: "Failed to upload",
        description: getApiError(err),
        type: "error",
      })
    } finally {
      setActionLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    const doc = documents.find((d) => d.id === id)
    setActionLoading(true)
    try {
      await api.delete(`/sellers/kyc-documents/${id}`)
      setDocuments((prev) => prev.filter((d) => d.id !== id))
      setDeleteDoc(null)
      toast.add({
        title: "Document deleted!",
        description: `${documentTypeLabels[doc?.document_type ?? ""] ?? doc?.document_type ?? "Document"} has been removed.`,
        type: "success",
      })
    } catch (err) {
      toast.add({
        title: "Failed to delete",
        description: getApiError(err),
        type: "error",
      })
    } finally {
      setActionLoading(false)
    }
  }

  const canEdit = kycStatus === "pending" || kycStatus === "rejected" || kycStatus === "not_submitted"
  const isLocked = !canEdit
  const allUploaded = kycStatusData?.can_submit_for_review ?? false

  if (loading) {
    return (
      <PageSkeleton>
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-64 w-full" />
      </PageSkeleton>
    )
  }

  const cfg = statusConfig[kycStatus] ?? statusConfig.not_submitted

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">KYC & Verification</h2>
        <p className="text-sm text-muted-foreground">
          Upload business documents for verification to start selling.
        </p>
      </div>

      {/* Status Banner */}
      <Card className={kycStatus === "approved" ? "border-green-500" : kycStatus === "rejected" ? "border-red-500" : ""}>
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <div className={`flex size-12 shrink-0 items-center justify-center rounded-full ${
              kycStatus === "approved" ? "bg-green-100 text-green-600" :
              kycStatus === "rejected" ? "bg-red-100 text-red-600" :
              kycStatus === "under_review" ? "bg-blue-100 text-blue-600" :
              "bg-muted text-muted-foreground"
            }`}>
              {cfg.icon}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-semibold">Verification Status</h3>
                <Badge variant={cfg.variant}>{cfg.label}</Badge>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">{cfg.desc}</p>
              {kycStatus === "rejected" && (
                <div className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">
                  <strong>Action needed:</strong> Re-upload the rejected documents with corrections.
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Upload Button */}
      {canEdit && (
        <div className="flex justify-end gap-2">
          <Dialog open={additionalOpen} onOpenChange={setAdditionalOpen}>
            <DialogTrigger render={<Button variant="outline"><Plus className="size-4" /> Additional Document</Button>} />
            <DialogContent className="sm:max-w-[520px]">
              <AdditionalDocForm onSubmit={handleUpload} actionLoading={actionLoading} existingTypes={documents.map((d) => d.document_type)} />
            </DialogContent>
          </Dialog>
          <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
            <DialogTrigger render={<Button><Upload className="size-4" /> Upload Document</Button>} />
            <DialogContent className="sm:max-w-[480px]">
              <UploadForm onSubmit={handleUpload} actionLoading={actionLoading} existingTypes={documents.map((d) => d.document_type)} />
            </DialogContent>
          </Dialog>
        </div>
      )}

      {isLocked && (
        <div className="flex items-center gap-2 rounded-lg border border-blue-500/30 bg-blue-500/5 px-4 py-3 text-sm text-blue-700">
          <Lock className="size-4 shrink-0" />
          <span>Documents are locked for review. You can view them but cannot make changes.</span>
        </div>
      )}

      {/* Documents List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Submitted Documents ({documents.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {documents.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <FileText className="size-12 text-muted-foreground" />
              <p className="mt-4 text-sm font-medium">No documents uploaded yet</p>
              <p className="mt-1 text-xs text-muted-foreground">Upload your required business documents to start the verification process.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {documents.map((doc) => {
                const isRequired = documentTypes.includes(doc.document_type)
                return (
                  <div key={doc.id} className="flex items-center gap-3 rounded-lg border p-3">
                    <div className={`flex size-9 shrink-0 items-center justify-center rounded-md ${isRequired ? "bg-primary/10" : "bg-muted"}`}>
                      <FileText className={`size-4 ${isRequired ? "text-primary" : "text-muted-foreground"}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{documentTypeLabels[doc.document_type] ?? doc.document_type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}</span>
                        <Badge variant={docStatusConfig[doc.status]?.variant ?? "secondary"} className="text-xs">
                          {docStatusConfig[doc.status]?.label ?? doc.status}
                        </Badge>
                        {!isRequired && (
                          <Badge variant="outline" className="text-xs">Optional</Badge>
                        )}
                      </div>
                      <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="font-mono">{fileNameFromUrl(doc.document_url)}</span>
                        <span>{new Date(doc.uploaded_at).toLocaleDateString()}</span>
                      </div>
                      {doc.rejection_reason && (
                        <div className="mt-2 rounded bg-red-50 px-2 py-1 text-xs text-red-700">
                          <strong>Rejected:</strong> {doc.rejection_reason}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon-sm" title="Preview" onClick={() => setPreviewDoc(doc)}>
                        <Eye className="size-4" />
                      </Button>
                      {canEdit && (
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          disabled={actionLoading}
                          onClick={() => setDeleteDoc(doc)}
                          title="Delete"
                          className="text-red-500 hover:text-red-600"
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Required Documents Info */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Required Documents</CardTitle>
            <span className="text-xs text-muted-foreground">
              {kycStatusData?.uploaded_documents?.length ?? documents.length} / {kycStatusData?.required_documents?.length ?? documentTypes.length} uploaded
            </span>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 sm:grid-cols-2">
            {(kycStatusData?.required_documents ?? documentTypes).map((doc) => {
              const isUploaded = (kycStatusData?.uploaded_documents ?? documents.map((d) => d.document_type)).includes(doc)
              return (
                <div key={doc} className={`flex items-center gap-2 text-sm ${isUploaded ? "text-green-600" : "text-muted-foreground"}`}>
                  {isUploaded ? (
                    <CheckCircle2 className="size-4 text-green-600" />
                  ) : (
                    <FileCheck className="size-4 text-muted-foreground" />
                  )}
                  {documentTypeLabels[doc] ?? doc}
                </div>
              )
            })}
          </div>

          {canEdit && allUploaded && (
            <div className="mt-4 flex items-center justify-between rounded-lg border border-green-500/30 bg-green-500/5 px-4 py-3">
              <div className="flex items-center gap-2 text-sm text-green-700">
                <CheckCircle2 className="size-4" />
                <span>All documents uploaded! Submit for verification to continue.</span>
              </div>
              <Button
                size="sm"
                disabled={actionLoading}
                onClick={async () => {
                  setActionLoading(true)
                  try {
                    const res = await api.get<KycStatusResponse>("/sellers/kyc-status")
                    setKycStatusData(res)
                    setKycStatus(res.seller_status as KycStatus)
                    toast.add({
                      title: "Submitted for verification!",
                      description: "Your documents are now under review. This usually takes 1-2 business days.",
                      type: "success",
                    })
                  } catch (err) {
                    toast.add({ title: "Failed to submit", description: getApiError(err), type: "error" })
                  } finally {
                    setActionLoading(false)
                  }
                }}
              >
                {actionLoading ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
                Submit for Verification
              </Button>
            </div>
          )}

          {canEdit && !allUploaded && (kycStatusData?.missing_documents?.length ?? 0) > 0 && (
            <div className="mt-4 rounded-lg border border-amber-500/30 bg-amber-500/5 px-4 py-3 text-sm text-amber-700">
              <strong>Remaining:</strong> {(kycStatusData?.missing_documents ?? []).map((d) => documentTypeLabels[d] ?? d).join(", ")}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Contact Support */}
      <Card className="border-primary/20">
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-primary/10">
                <Headphones className="size-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-sm">Need help with verification?</h3>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Our support team is available to assist you with document uploads and verification questions.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                render={<a href="mailto:support@xerinmarketplace.com?subject=KYC Verification Assistance" />}
              >
                <Mail className="size-4" />
                Email Support
              </Button>
              <Button
                variant="outline"
                size="sm"
                render={<a href="https://wa.me/255700000000?text=Hello%2C%20I%20need%20help%20with%20KYC%20verification" target="_blank" rel="noopener noreferrer" />}
              >
                <MessageCircle className="size-4" />
                WhatsApp
              </Button>
              <Button
                size="sm"
                render={<a href="/dashboard/seller/help" />}
              >
                <Headphones className="size-4" />
                Contact Our Team
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation */}
      <Dialog open={!!deleteDoc} onOpenChange={(open) => !open && setDeleteDoc(null)}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle>Delete Document?</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <strong>{deleteDoc ? documentTypeLabels[deleteDoc.document_type] ?? deleteDoc.document_type : ""}</strong>? You can re-upload it later.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" disabled={actionLoading} />}>Cancel</DialogClose>
            <Button variant="destructive" disabled={actionLoading} onClick={() => deleteDoc && handleDelete(deleteDoc.id)}>
              {actionLoading ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Document Preview */}
      <Dialog open={!!previewDoc} onOpenChange={(open) => !open && setPreviewDoc(null)}>
        <DialogContent className="sm:max-w-[640px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="size-5" />
              {previewDoc ? documentTypeLabels[previewDoc.document_type] ?? previewDoc.document_type : ""}
            </DialogTitle>
            <DialogDescription>
              {previewDoc ? fileNameFromUrl(previewDoc.document_url) : ""}
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[60vh] overflow-hidden rounded-lg border">
            {previewDoc && resolveFileUrl(previewDoc.document_url).match(/\.(jpg|jpeg|png|gif|webp|bmp)$/i) ? (
              <img src={resolveFileUrl(previewDoc.document_url)} alt={previewDoc.document_type} className="h-full w-full object-contain" />
            ) : previewDoc ? (
              <iframe src={resolveFileUrl(previewDoc.document_url)} className="h-[60vh] w-full" title="Document Preview" />
            ) : null}
          </div>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>Close</DialogClose>
            <Button render={<a href={previewDoc ? resolveFileUrl(previewDoc.document_url) : "#"} target="_blank" rel="noopener noreferrer" />}>
              <Eye className="size-4" />
              Open Full
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function UploadForm({
  onSubmit,
  actionLoading,
  existingTypes,
}: {
  onSubmit: (docType: string, file: File) => void
  actionLoading: boolean
  existingTypes: string[]
}) {
  const [docType, setDocType] = React.useState(documentTypes[0])
  const [file, setFile] = React.useState<File | null>(null)
  const [progress, setProgress] = React.useState(0)
  const [error, setError] = React.useState<string | null>(null)
  const [dragOver, setDragOver] = React.useState(false)

  React.useEffect(() => {
    if (actionLoading) {
      setProgress(0)
      const interval = setInterval(() => {
        setProgress((p) => {
          if (p >= 90) return p
          return p + Math.random() * 15
        })
      }, 200)
      return () => clearInterval(interval)
    } else {
      setProgress(100)
    }
  }, [actionLoading])

  const validateFile = (f: File): string | null => {
    const allowedTypes = ["application/pdf", "image/jpeg", "image/jpg", "image/png"]
    const allowedExtensions = [".pdf", ".jpg", ".jpeg", ".png"]
    const ext = f.name.toLowerCase().substring(f.name.lastIndexOf("."))
    if (!allowedTypes.includes(f.type) && !allowedExtensions.includes(ext)) {
      return "Invalid file type. Only PDF, JPG, and PNG are allowed."
    }
    if (f.size > 5 * 1024 * 1024) {
      return "File too large. Maximum size is 5MB."
    }
    return null
  }

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault()
    if (!file) return
    onSubmit(docType, file)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (f) {
      const err = validateFile(f)
      if (err) {
        setError(err)
        setFile(null)
        e.target.value = ""
        return
      }
      setError(null)
      setFile(f)
      setProgress(0)
      onSubmit(docType, f)
    }
  }

  const isExisting = existingTypes.includes(docType)

  return (
    <form onSubmit={handleSubmit}>
      <DialogHeader>
        <DialogTitle>Upload KYC Document</DialogTitle>
        <DialogDescription>
          Select document type and choose a file. It will upload automatically. Supported: PDF, JPG, PNG (max 5MB).
        </DialogDescription>
      </DialogHeader>
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="docType">Document Type</FieldLabel>
          <select
            id="docType"
            value={docType}
            onChange={(e) => setDocType(e.target.value)}
            disabled={actionLoading}
            className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
          >
            {documentTypes.map((t) => (
              <option key={t} value={t}>
                {documentTypeLabels[t] ?? t}{existingTypes.includes(t) ? " (replace)" : ""}
              </option>
            ))}
          </select>
          {isExisting && (
            <FieldDescription className="text-amber-600">
              <RotateCcw className="inline size-3 mr-1" />
              A document of this type already exists. Uploading will replace it.
            </FieldDescription>
          )}
        </Field>
        <Field>
          <FieldLabel htmlFor="file">Choose File</FieldLabel>
          <label
            htmlFor="file"
            onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault()
              setDragOver(false)
              const f = e.dataTransfer.files?.[0]
              if (f) {
                const err = validateFile(f)
                if (err) { setError(err); return }
                setError(null)
                setFile(f)
                setProgress(0)
                onSubmit(docType, f)
              }
            }}
            className={`relative flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-8 transition-colors cursor-pointer ${
              dragOver
                ? "border-primary bg-primary/5"
                : "border-muted-foreground/25 hover:border-muted-foreground/50 hover:bg-muted/5"
            } ${error ? "border-red-500/50" : ""}`}
          >
            {actionLoading ? (
              <>
                <Loader2 className="size-8 animate-spin text-primary" />
                <p className="text-sm font-medium text-foreground">Uploading... {Math.round(progress)}%</p>
                <div className="mt-2 h-2 w-full max-w-[200px] overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary transition-all duration-200 ease-out"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </>
            ) : (
              <>
                <div className="flex size-12 items-center justify-center rounded-full bg-muted">
                  <Upload className="size-6 text-muted-foreground" />
                </div>
                <p className="text-sm font-medium text-foreground">
                  {file ? file.name : "Click to browse or drag a file here"}
                </p>
                <p className="text-xs text-muted-foreground/70">PDF, JPG, PNG — max 5MB</p>
              </>
            )}
          </label>
          <input
            id="file"
            type="file"
            accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
            onChange={handleFileChange}
            disabled={actionLoading}
            className="sr-only"
          />
          {error && (
            <FieldDescription className="text-red-500">{error}</FieldDescription>
          )}
          {file && !actionLoading && !error && (
            <FieldDescription>Selected: {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)</FieldDescription>
          )}
        </Field>
      </FieldGroup>
      <DialogFooter>
        <DialogClose render={<Button variant="outline" disabled={actionLoading} />}>Cancel</DialogClose>
      </DialogFooter>
    </form>
  )
}

function AdditionalDocForm({
  onSubmit,
  actionLoading,
  existingTypes,
}: {
  onSubmit: (docType: string, file: File) => void
  actionLoading: boolean
  existingTypes: string[]
}) {
  const [category, setCategory] = React.useState<string>(ADDITIONAL_DOC_CATEGORIES[0].value)
  const [customName, setCustomName] = React.useState("")
  const [file, setFile] = React.useState<File | null>(null)
  const [progress, setProgress] = React.useState(0)
  const [error, setError] = React.useState<string | null>(null)
  const [dragOver, setDragOver] = React.useState(false)

  React.useEffect(() => {
    if (actionLoading) {
      setProgress(0)
      const interval = setInterval(() => {
        setProgress((p) => {
          if (p >= 90) return p
          return p + Math.random() * 15
        })
      }, 200)
      return () => clearInterval(interval)
    } else {
      setProgress(100)
    }
  }, [actionLoading])

  const validateFile = (f: File): string | null => {
    const allowedExtensions = [".pdf", ".jpg", ".jpeg", ".png"]
    const ext = f.name.toLowerCase().substring(f.name.lastIndexOf("."))
    if (!allowedExtensions.includes(ext)) {
      return "Invalid file type. Only PDF, JPG, and PNG are allowed."
    }
    if (f.size > 5 * 1024 * 1024) {
      return "File too large. Maximum size is 5MB."
    }
    return null
  }

  const docType = category === "other" ? customName.trim().toLowerCase().replace(/\s+/g, "_") : category

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (f) {
      const err = validateFile(f)
      if (err) {
        setError(err)
        setFile(null)
        e.target.value = ""
        return
      }
      setError(null)
      setFile(f)
      setProgress(0)
      if (docType) {
        onSubmit(docType, f)
      }
    }
  }

  const isExisting = docType && existingTypes.includes(docType)
  const canSubmit = docType && file && !error

  return (
    <form onSubmit={(e) => { e.preventDefault(); if (canSubmit) onSubmit(docType, file) }}>
      <DialogHeader>
        <DialogTitle>Upload Additional Document</DialogTitle>
        <DialogDescription>
          Optional documents to support your verification. These are not required but may speed up the review process.
        </DialogDescription>
      </DialogHeader>
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="category">Document Category</FieldLabel>
          <select
            id="category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            disabled={actionLoading}
            className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
          >
            {ADDITIONAL_DOC_CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
        </Field>

        {category === "other" && (
          <Field>
            <FieldLabel htmlFor="customName">Document Name</FieldLabel>
            <Input
              id="customName"
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              placeholder="e.g. Insurance Certificate"
              disabled={actionLoading}
              required
            />
          </Field>
        )}

        {isExisting && (
          <div className="flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/5 px-3 py-2 text-xs text-amber-700">
            <RotateCcw className="size-3" />
            A document of this type already exists. Uploading will replace it.
          </div>
        )}

        <Field>
          <FieldLabel htmlFor="addFile">Choose File</FieldLabel>
          <label
            htmlFor="addFile"
            onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault()
              setDragOver(false)
              const f = e.dataTransfer.files?.[0]
              if (f) {
                const err = validateFile(f)
                if (err) { setError(err); return }
                setError(null)
                setFile(f)
                setProgress(0)
                if (docType) {
                  onSubmit(docType, f)
                }
              }
            }}
            className={`relative flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-8 transition-colors cursor-pointer ${
              dragOver
                ? "border-primary bg-primary/5"
                : "border-muted-foreground/25 hover:border-muted-foreground/50 hover:bg-muted/5"
            } ${error ? "border-red-500/50" : ""}`}
          >
            {actionLoading ? (
              <>
                <Loader2 className="size-8 animate-spin text-primary" />
                <p className="text-sm font-medium text-foreground">Uploading... {Math.round(progress)}%</p>
                <div className="mt-2 h-2 w-full max-w-[200px] overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary transition-all duration-200 ease-out"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </>
            ) : (
              <>
                <div className="flex size-12 items-center justify-center rounded-full bg-muted">
                  <Paperclip className="size-6 text-muted-foreground" />
                </div>
                <p className="text-sm font-medium text-foreground">
                  {file ? file.name : "Click to browse or drag a file here"}
                </p>
                <p className="text-xs text-muted-foreground/70">PDF, JPG, PNG — max 5MB</p>
              </>
            )}
          </label>
          <input
            id="addFile"
            type="file"
            accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
            onChange={handleFileChange}
            disabled={actionLoading}
            className="sr-only"
          />
          {error && (
            <FieldDescription className="text-red-500">{error}</FieldDescription>
          )}
          {file && !actionLoading && !error && (
            <FieldDescription>Selected: {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)</FieldDescription>
          )}
        </Field>
      </FieldGroup>
      <DialogFooter>
        <DialogClose render={<Button variant="outline" disabled={actionLoading} />}>Cancel</DialogClose>
      </DialogFooter>
    </form>
  )
}
