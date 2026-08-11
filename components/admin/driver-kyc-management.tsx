"use client"

import * as React from "react"
import {
  ShieldCheck,
  FileText,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  User,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Car,
  Banknote,
  AlertTriangle,
  RefreshCw,
  Eye,
} from "lucide-react"
import { api, type ApiError } from "@/lib/api"
import { toast } from "@/components/ui/toast"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TableSkeleton } from "@/components/skeletons"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"

type KYCStatus = "pending" | "verified" | "rejected"

type DriverKYCT = {
  id: string
  driver_id: string
  full_name: string
  date_of_birth: string | null
  gender: string | null
  national_id_number: string | null
  license_number: string | null
  license_class: string | null
  license_expiry: string | null
  address: string | null
  city: string | null
  region: string | null
  country: string
  emergency_contact_name: string | null
  emergency_contact_phone: string | null
  next_of_kin: string | null
  next_of_kin_phone: string | null
  bank_account_name: string | null
  bank_account_number: string | null
  bank_name: string | null
  profile_image_url: string | null
  is_verified: boolean
  submitted_at: string | null
  verified_at: string | null
  rejection_reason: string | null
  created_at: string
}

type DriverDocumentT = {
  id: string
  driver_id: string
  document_type: string
  document_number: string | null
  document_image_url: string | null
  document_image_back_url: string | null
  status: string
  expiry_date: string | null
  rejection_reason: string | null
  verified_at: string | null
  created_at: string
}

const message = (error: unknown) => (error as ApiError)?.detail || "The request could not be completed."

const statusBadge = (status: string) => {
  if (status === "approved" || status === "verified") return <Badge variant="default"><CheckCircle2 className="size-3" /> {status}</Badge>
  if (status === "rejected") return <Badge variant="destructive"><XCircle className="size-3" /> {status}</Badge>
  return <Badge variant="outline"><Clock className="size-3" /> {status}</Badge>
}

export function DriverKYCManagement() {
  const [tab, setTab] = React.useState<"kyc" | "documents">("kyc")

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Driver KYC &amp; Verification</h2>
        <p className="text-sm text-muted-foreground">
          Review driver KYC submissions, verify documents, approve or reject drivers.
        </p>
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as "kyc" | "documents")}>
        <TabsList>
          <TabsTrigger value="kyc"><ShieldCheck className="size-4" /> KYC Reviews</TabsTrigger>
          <TabsTrigger value="documents"><FileText className="size-4" /> Documents</TabsTrigger>
        </TabsList>
        <TabsContent value="kyc"><KYCTab /></TabsContent>
        <TabsContent value="documents"><DocumentsTab /></TabsContent>
      </Tabs>
    </div>
  )
}

function KYCTab() {
  const [kycList, setKycList] = React.useState<DriverKYCT[]>([])
  const [loading, setLoading] = React.useState(true)
  const [filter, setFilter] = React.useState<"pending" | "all" | "verified">("pending")
  const [search, setSearch] = React.useState("")
  const [reviewing, setReviewing] = React.useState<DriverKYCT | null>(null)
  const [viewing, setViewing] = React.useState<DriverKYCT | null>(null)

  const load = React.useCallback(() => {
    setLoading(true)
    const url = filter === "pending" ? "/admin/driver-kyc/pending" : "/admin/driver-kyc/all"
    api.get<DriverKYCT[]>(url)
      .then(setKycList)
      .catch((err) => toast.add({ title: "Failed to load KYC", description: message(err), type: "error" }))
      .finally(() => setLoading(false))
  }, [filter])

  React.useEffect(() => { load() }, [load])

  const filtered = kycList.filter((k) =>
    !search || k.full_name.toLowerCase().includes(search.toLowerCase()) ||
    (k.national_id_number ?? "").includes(search) ||
    (k.license_number ?? "").includes(search)
  )

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex gap-2">
          {(["pending", "all", "verified"] as const).map((f) => (
            <Button key={f} variant={filter === f ? "default" : "outline"} size="sm" onClick={() => setFilter(f)}>
              {f === "pending" && <Clock className="size-4" />}
              {f === "verified" && <CheckCircle2 className="size-4" />}
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </Button>
          ))}
        </div>
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search by name, ID, license..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
      </div>

      {loading ? (
        <TableSkeleton rows={5} cols={5} />
      ) : filtered.length === 0 ? (
        <Card><CardContent>
          <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
            <ShieldCheck className="size-12 text-muted-foreground/50" />
            <p className="text-sm font-medium">No KYC submissions found</p>
          </div>
        </CardContent></Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Driver Name</TableHead>
                  <TableHead>National ID</TableHead>
                  <TableHead>License</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((kyc) => (
                  <TableRow key={kyc.id}>
                    <TableCell className="font-medium">{kyc.full_name}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{kyc.national_id_number ?? "—"}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{kyc.license_number ?? "—"}</TableCell>
                    <TableCell>
                      {kyc.is_verified ? (
                        <Badge variant="default"><CheckCircle2 className="size-3" /> Verified</Badge>
                      ) : kyc.rejection_reason ? (
                        <Badge variant="destructive"><XCircle className="size-3" /> Rejected</Badge>
                      ) : (
                        <Badge variant="outline"><Clock className="size-3" /> Pending</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{kyc.submitted_at ? new Date(kyc.submitted_at).toLocaleDateString() : "—"}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon-sm" title="View Details" onClick={() => setViewing(kyc)}><Eye className="size-4" /></Button>
                      {!kyc.is_verified && (
                        <Button variant="ghost" size="icon-sm" title="Review" onClick={() => setReviewing(kyc)}><ShieldCheck className="size-4" /></Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {viewing && (
        <KYCDetailDialog kyc={viewing} open={!!viewing} onOpenChange={(o) => { if (!o) setViewing(null) }} />
      )}
      {reviewing && (
        <ReviewDialog kyc={reviewing} open={!!reviewing} onOpenChange={(o) => { if (!o) setReviewing(null) }} onReviewed={load} />
      )}
    </div>
  )
}

function KYCDetailDialog({ kyc, open, onOpenChange }: { kyc: DriverKYCT; open: boolean; onOpenChange: (o: boolean) => void }) {
  const details = [
    { icon: <User className="size-4" />, label: "Full Name", value: kyc.full_name },
    { icon: <Calendar className="size-4" />, label: "Date of Birth", value: kyc.date_of_birth ?? "—" },
    { icon: <User className="size-4" />, label: "Gender", value: kyc.gender ?? "—" },
    { icon: <FileText className="size-4" />, label: "National ID", value: kyc.national_id_number ?? "—" },
    { icon: <Car className="size-4" />, label: "License Number", value: kyc.license_number ?? "—" },
    { icon: <Car className="size-4" />, label: "License Class", value: kyc.license_class ?? "—" },
    { icon: <Calendar className="size-4" />, label: "License Expiry", value: kyc.license_expiry ? new Date(kyc.license_expiry).toLocaleDateString() : "—" },
    { icon: <MapPin className="size-4" />, label: "Address", value: kyc.address ?? "—" },
    { icon: <MapPin className="size-4" />, label: "City", value: kyc.city ?? "—" },
    { icon: <MapPin className="size-4" />, label: "Region", value: kyc.region ?? "—" },
    { icon: <MapPin className="size-4" />, label: "Country", value: kyc.country },
    { icon: <Phone className="size-4" />, label: "Emergency Contact", value: kyc.emergency_contact_name ? `${kyc.emergency_contact_name} (${kyc.emergency_contact_phone ?? "—"})` : "—" },
    { icon: <User className="size-4" />, label: "Next of Kin", value: kyc.next_of_kin ? `${kyc.next_of_kin} (${kyc.next_of_kin_phone ?? "—"})` : "—" },
    { icon: <Banknote className="size-4" />, label: "Bank Account", value: kyc.bank_account_name ? `${kyc.bank_account_name} - ${kyc.bank_account_number ?? "—"} (${kyc.bank_name ?? "—"})` : "—" },
  ]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><User className="size-5" /> KYC Details — {kyc.full_name}</DialogTitle>
          <DialogDescription>Driver KYC submission details</DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-2">
          {kyc.profile_image_url && (
            <div className="flex justify-center">
              <img src={kyc.profile_image_url} alt="Profile" className="size-24 rounded-full object-cover border-2 border-border" />
            </div>
          )}
          <div className="grid gap-3 sm:grid-cols-2">
            {details.map((d) => (
              <div key={d.label} className="flex items-start gap-2">
                <div className="mt-0.5 text-muted-foreground">{d.icon}</div>
                <div>
                  <p className="text-xs text-muted-foreground">{d.label}</p>
                  <p className="text-sm font-medium">{d.value}</p>
                </div>
              </div>
            ))}
          </div>
          {kyc.rejection_reason && (
            <>
              <Separator />
              <div className="flex items-start gap-2 rounded-lg bg-destructive/10 p-3">
                <AlertTriangle className="size-4 text-destructive mt-0.5" />
                <div>
                  <p className="text-xs font-medium text-destructive">Rejection Reason</p>
                  <p className="text-sm">{kyc.rejection_reason}</p>
                </div>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

function ReviewDialog({ kyc, open, onOpenChange, onReviewed }: { kyc: DriverKYCT; open: boolean; onOpenChange: (o: boolean) => void; onReviewed: () => void }) {
  const [approved, setApproved] = React.useState(true)
  const [reason, setReason] = React.useState("")
  const [saving, setSaving] = React.useState(false)

  const handleReview = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      await api.post(`/drivers/${kyc.driver_id}/kyc/review`, {
        is_approved: approved,
        rejection_reason: approved ? null : (reason || "Documents not sufficient"),
      })
      toast.add({ title: approved ? "Driver KYC approved" : "Driver KYC rejected", type: "success" })
      onOpenChange(false)
      onReviewed()
    } catch (err) {
      toast.add({ title: "Failed to review KYC", description: message(err), type: "error" })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <form onSubmit={handleReview}>
          <DialogHeader>
            <DialogTitle>Review KYC — {kyc.full_name}</DialogTitle>
            <DialogDescription>Approve or reject this driver's KYC submission.</DialogDescription>
          </DialogHeader>
          <FieldGroup className="py-4">
            <div className="flex gap-2">
              <Button type="button" variant={approved ? "default" : "outline"} className="flex-1" onClick={() => setApproved(true)}>
                <CheckCircle2 className="size-4" /> Approve
              </Button>
              <Button type="button" variant={!approved ? "destructive" : "outline"} className="flex-1" onClick={() => setApproved(false)}>
                <XCircle className="size-4" /> Reject
              </Button>
            </div>
            {!approved && (
              <Field>
                <FieldLabel>Rejection Reason</FieldLabel>
                <Textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={3} placeholder="Explain why the KYC is rejected..." />
              </Field>
            )}
          </FieldGroup>
          <DialogFooter>
            <DialogClose render={<Button type="button" variant="outline" />}>Cancel</DialogClose>
            <Button type="submit" loading={saving} variant={approved ? "default" : "destructive"}>
              {approved ? "Approve KYC" : "Reject KYC"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function DocumentsTab() {
  const [documents, setDocuments] = React.useState<DriverDocumentT[]>([])
  const [loading, setLoading] = React.useState(true)
  const [search, setSearch] = React.useState("")
  const [reviewing, setReviewing] = React.useState<DriverDocumentT | null>(null)
  const [rejectReason, setRejectReason] = React.useState("")
  const [saving, setSaving] = React.useState(false)

  const load = React.useCallback(() => {
    setLoading(true)
    api.get<DriverDocumentT[]>("/admin/driver-documents/pending")
      .then(setDocuments)
      .catch((err) => toast.add({ title: "Failed to load documents", description: message(err), type: "error" }))
      .finally(() => setLoading(false))
  }, [])

  React.useEffect(() => { load() }, [load])

  const filtered = documents.filter((d) =>
    !search || d.document_type.toLowerCase().includes(search.toLowerCase()) ||
    (d.document_number ?? "").includes(search)
  )

  const handleReview = async (doc: DriverDocumentT, isApproved: boolean) => {
    setSaving(true)
    try {
      await api.post(`/drivers/${doc.driver_id}/documents/${doc.id}/review`, {
        is_approved: isApproved,
        rejection_reason: isApproved ? null : (rejectReason || "Document not valid"),
      })
      toast.add({ title: isApproved ? "Document approved" : "Document rejected", type: "success" })
      setReviewing(null)
      setRejectReason("")
      load()
    } catch (err) {
      toast.add({ title: "Failed to review document", description: message(err), type: "error" })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Search documents..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
      </div>

      {loading ? (
        <TableSkeleton rows={5} cols={5} />
      ) : filtered.length === 0 ? (
        <Card><CardContent>
          <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
            <FileText className="size-12 text-muted-foreground/50" />
            <p className="text-sm font-medium">No pending documents</p>
          </div>
        </CardContent></Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((doc) => (
            <Card key={doc.id}>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="size-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium capitalize">{doc.document_type.replace(/_/g, " ")}</p>
                      <p className="text-xs text-muted-foreground">{doc.document_number ?? "No number"}</p>
                    </div>
                  </div>
                  {statusBadge(doc.status)}
                </div>
                {doc.document_image_url && (
                  <img src={doc.document_image_url} alt="Document" className="w-full rounded-lg border object-cover max-h-48" />
                )}
                {doc.expiry_date && (
                  <p className="text-xs text-muted-foreground">Expires: {new Date(doc.expiry_date).toLocaleDateString()}</p>
                )}
                <div className="flex gap-2">
                  <Button size="sm" variant="default" className="flex-1" onClick={() => handleReview(doc, true)} disabled={saving}>
                    <CheckCircle2 className="size-4" /> Approve
                  </Button>
                  <Button size="sm" variant="destructive" className="flex-1" onClick={() => setReviewing(doc)} disabled={saving}>
                    <XCircle className="size-4" /> Reject
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {reviewing && (
        <Dialog open={!!reviewing} onOpenChange={(o) => { if (!o) { setReviewing(null); setRejectReason("") } }}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Reject Document</DialogTitle>
              <DialogDescription>Provide a reason for rejecting this {reviewing.document_type.replace(/_/g, " ")} document.</DialogDescription>
            </DialogHeader>
            <FieldGroup className="py-4">
              <Field>
                <FieldLabel>Rejection Reason</FieldLabel>
                <Textarea value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} rows={3} placeholder="e.g. Document is expired, blurry image, etc." />
              </Field>
            </FieldGroup>
            <DialogFooter>
              <DialogClose render={<Button type="button" variant="outline" />}>Cancel</DialogClose>
              <Button variant="destructive" loading={saving} onClick={() => handleReview(reviewing, false)}>Reject Document</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
