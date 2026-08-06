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

function getApiError(err: unknown): string {
  const e = err as ApiError
  return e?.detail || "Something went wrong. Please try again."
}

function fileNameFromUrl(url: string): string {
  const parts = url.split("/")
  return parts[parts.length - 1] || url
}

export default function SellerKYCPage() {
  const [kycStatus, setKycStatus] = React.useState<KycStatus>("not_submitted")
  const [kycStatusData, setKycStatusData] = React.useState<KycStatusResponse | null>(null)
  const [documents, setDocuments] = React.useState<KycDocument[]>([])
  const [loading, setLoading] = React.useState(true)
  const [uploadOpen, setUploadOpen] = React.useState(false)
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
      const formData = new FormData()
      formData.append("document_type", docType)
      formData.append("file", file)
      const newDoc = await api.upload<KycDocument>("/sellers/kyc-documents", formData)
      setDocuments((prev) => [newDoc, ...prev])
      setUploadOpen(false)
      toast.add({
        title: "Document uploaded!",
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
        description: `${documentTypeLabels[doc?.document_type ?? ""] ?? doc?.document_type ?? fileNameFromUrl(doc?.document_url ?? "")} has been removed.`,
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
      <div className="flex justify-end">
        <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
          <DialogTrigger render={<Button><Upload className="size-4" /> Upload Document</Button>} />
          <DialogContent className="sm:max-w-[480px]">
            <UploadForm onSubmit={handleUpload} />
          </DialogContent>
        </Dialog>
      </div>

      {/* Documents List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Submitted Documents ({documents.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {documents.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <FileText className="size-12 text-muted-foreground" />
              <p className="mt-4 text-sm text-muted-foreground">
                No documents uploaded yet. Upload your first KYC document to get started.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center gap-4 rounded-lg border p-4"
                >
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-muted">
                    <FileText className="size-5 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{documentTypeLabels[doc.document_type] ?? doc.document_type}</span>
                      <Badge variant={docStatusConfig[doc.status]?.variant ?? "secondary"} className="text-xs">
                        {docStatusConfig[doc.status]?.label ?? doc.status}
                      </Badge>
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
                    <Button variant="ghost" size="icon-sm" title="View" onClick={() => window.open(doc.document_url, "_blank")}>
                      <Eye className="size-4" />
                    </Button>
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
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Required Documents Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Required Documents</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 sm:grid-cols-2">
            {(kycStatusData?.required_documents ?? documentTypes).map((doc) => (
              <div key={doc} className="flex items-center gap-2 text-sm">
                <FileCheck className="size-4 text-muted-foreground" />
                {documentTypeLabels[doc] ?? doc}
              </div>
            ))}
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
            <Button variant="destructive" disabled={actionLoading} onClick={() => deleteDoc && handleDelete(deleteDoc.id)}>
              <Trash2 className="size-4" />
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function UploadForm({
  onSubmit,
}: {
  onSubmit: (docType: string, file: File) => void
}) {
  const [docType, setDocType] = React.useState(documentTypes[0])
  const [file, setFile] = React.useState<File | null>(null)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!file) return
    onSubmit(docType, file)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (f) setFile(f)
  }

  return (
    <form onSubmit={handleSubmit}>
      <DialogHeader>
        <DialogTitle>Upload KYC Document</DialogTitle>
        <DialogDescription>
          Select document type and upload the file. Supported formats: PDF, JPG, PNG (max 5MB).
        </DialogDescription>
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
              <option key={t} value={t}>{documentTypeLabels[t] ?? t}</option>
            ))}
          </select>
        </Field>
        <Field>
          <FieldLabel htmlFor="file">File</FieldLabel>
          <Input
            id="file"
            type="file"
            accept=".pdf,.jpg,.jpeg,.png"
            onChange={handleFileChange}
            required
          />
          {file && (
            <FieldDescription>Selected: {file.name}</FieldDescription>
          )}
        </Field>
      </FieldGroup>
      <DialogFooter>
        <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>
        <Button type="submit"><Upload className="size-4" /> Upload</Button>
      </DialogFooter>
    </form>
  )
}
