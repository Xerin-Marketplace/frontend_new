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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
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
  Field,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { toast } from "@/components/ui/toast"
import {
  Store,
  Search,
  Check,
  X,
  Eye,
} from "lucide-react"
import { api, type ApiError } from "@/lib/api"
import { PageSkeleton, TableSkeleton } from "@/components/skeletons"

type Seller = {
  id: string
  user_id: string
  business_name: string
  business_description: string | null
  status: string
  contact_email: string | null
  contact_phone: string | null
  created_at: string
}

type PaginatedSellers = {
  total: number
  page: number
  page_size: number
  results: Seller[]
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

const sellerStatusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  active: { label: "Active", variant: "default" },
  pending: { label: "Pending", variant: "secondary" },
  suspended: { label: "Suspended", variant: "destructive" },
  rejected: { label: "Rejected", variant: "destructive" },
}

function getApiError(err: unknown): string {
  const e = err as ApiError
  return e?.detail || "Something went wrong. Please try again."
}

export default function AdminSellersPage() {
  const [sellers, setSellers] = React.useState<Seller[]>([])
  const [total, setTotal] = React.useState(0)
  const [page, setPage] = React.useState(1)
  const [loading, setLoading] = React.useState(true)
  const [search, setSearch] = React.useState("")
  const [searchInput, setSearchInput] = React.useState("")
  const [statusFilter, setStatusFilter] = React.useState("")
  const [viewSeller, setViewSeller] = React.useState<Seller | null>(null)
  const [sellerDocs, setSellerDocs] = React.useState<KycDocument[]>([])
  const [docsLoading, setDocsLoading] = React.useState(false)
  const [rejectSeller, setRejectSeller] = React.useState<Seller | null>(null)
  const [rejectReason, setRejectReason] = React.useState("")
  const [actionLoading, setActionLoading] = React.useState(false)
  const pageSize = 10

  const fetchSellers = React.useCallback(() => {
    setLoading(true)
    const params = new URLSearchParams({ page: String(page), page_size: String(pageSize) })
    if (search) params.set("search", search)
    if (statusFilter) params.set("status_filter", statusFilter)
    api.get<PaginatedSellers>(`/admin/sellers?${params}`)
      .then((data) => {
        setSellers(data.results)
        setTotal(data.total)
      })
      .catch((err) => {
        toast.add({ title: "Failed to load sellers", description: getApiError(err), type: "error" })
      })
      .finally(() => setLoading(false))
  }, [page, search, statusFilter])

  React.useEffect(() => { fetchSellers() }, [fetchSellers])

  const handleSearch = () => {
    setSearch(searchInput)
    setPage(1)
  }

  const handleViewDocs = (seller: Seller) => {
    setViewSeller(seller)
    setDocsLoading(true)
    api.get<KycDocument[]>(`/sellers/admin/${seller.id}/documents`)
      .then(setSellerDocs)
      .catch((err) => {
        toast.add({ title: "Failed to load documents", description: getApiError(err), type: "error" })
      })
      .finally(() => setDocsLoading(false))
  }

  const handleApprove = async (seller: Seller) => {
    setActionLoading(true)
    try {
      await api.post(`/sellers/admin/${seller.id}/approve`)
      toast.add({ title: "Seller approved!", description: `${seller.business_name} is now active.`, type: "success" })
      fetchSellers()
      setViewSeller(null)
    } catch (err) {
      toast.add({ title: "Failed to approve seller", description: getApiError(err), type: "error" })
    } finally {
      setActionLoading(false)
    }
  }

  const handleReject = async () => {
    if (!rejectSeller || !rejectReason.trim()) return
    setActionLoading(true)
    try {
      const formData = new FormData()
      formData.append("reason", rejectReason.trim())
      await api.post(`/sellers/admin/${rejectSeller.id}/reject`, formData)
      setRejectSeller(null)
      setRejectReason("")
      toast.add({ title: "Seller rejected", description: `${rejectSeller.business_name} has been rejected.`, type: "success" })
      fetchSellers()
    } catch (err) {
      toast.add({ title: "Failed to reject seller", description: getApiError(err), type: "error" })
    } finally {
      setActionLoading(false)
    }
  }

  const totalPages = Math.ceil(total / pageSize)

  if (loading && sellers.length === 0) {
    return (
      <PageSkeleton>
        <Card><TableSkeleton rows={10} cols={6} /></Card>
      </PageSkeleton>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Sellers</h2>
        <p className="text-sm text-muted-foreground">Manage all sellers and approve pending applications ({total} total).</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Store className="size-4" /> All Sellers
            </CardTitle>
            <div className="flex gap-2">
              <select
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }}
                className="h-9 rounded-md border border-input bg-background px-3 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">All Statuses</option>
                <option value="active">Active</option>
                <option value="pending">Pending</option>
                <option value="suspended">Suspended</option>
                <option value="rejected">Rejected</option>
              </select>
              <Input
                placeholder="Search sellers..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                className="w-64"
              />
              <Button variant="outline" size="sm" onClick={handleSearch}>
                <Search className="size-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Business Name</TableHead>
                <TableHead>Contact Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sellers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">No sellers found.</TableCell>
                </TableRow>
              ) : (
                sellers.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium">{s.business_name}</TableCell>
                    <TableCell>{s.contact_email ?? "—"}</TableCell>
                    <TableCell>{s.contact_phone ?? "—"}</TableCell>
                    <TableCell>
                      <Badge variant={sellerStatusConfig[s.status]?.variant ?? "outline"}>
                        {sellerStatusConfig[s.status]?.label ?? s.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs">{new Date(s.created_at).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon-sm" title="View Details" onClick={() => handleViewDocs(s)}>
                          <Eye className="size-4" />
                        </Button>
                        {s.status === "pending" && (
                          <>
                            <Button variant="ghost" size="icon-sm" disabled={actionLoading} title="Approve" className="text-green-600" onClick={() => handleApprove(s)}>
                              <Check className="size-4" />
                            </Button>
                            <Button variant="ghost" size="icon-sm" disabled={actionLoading} title="Reject" className="text-red-500" onClick={() => setRejectSeller(s)}>
                              <X className="size-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {totalPages > 1 && (
            <div className="mt-4 flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Page {page} of {totalPages}</p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={page === 1 || loading} onClick={() => setPage(page - 1)}>Previous</Button>
                <Button variant="outline" size="sm" disabled={page === totalPages || loading} onClick={() => setPage(page + 1)}>Next</Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* View Seller Documents Dialog */}
      <Dialog open={!!viewSeller} onOpenChange={(open) => !open && setViewSeller(null)}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{viewSeller?.business_name}</DialogTitle>
            <DialogDescription>KYC Documents & Seller Details</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <div className="grid gap-2 text-sm">
              <div><span className="text-muted-foreground">Email:</span> {viewSeller?.contact_email ?? "—"}</div>
              <div><span className="text-muted-foreground">Phone:</span> {viewSeller?.contact_phone ?? "—"}</div>
              <div><span className="text-muted-foreground">Description:</span> {viewSeller?.business_description ?? "—"}</div>
              <div><span className="text-muted-foreground">Status:</span> <Badge variant={sellerStatusConfig[viewSeller?.status ?? ""]?.variant ?? "outline"}>{viewSeller?.status}</Badge></div>
            </div>
            <div>
              <h4 className="mb-2 text-sm font-medium">KYC Documents</h4>
              {docsLoading ? (
                <div className="py-4 text-center text-sm text-muted-foreground">Loading documents...</div>
              ) : sellerDocs.length === 0 ? (
                <div className="py-4 text-center text-sm text-muted-foreground">No documents uploaded.</div>
              ) : (
                <div className="flex flex-col gap-2">
                  {sellerDocs.map((doc) => (
                    <div key={doc.id} className="flex items-center justify-between rounded-lg border p-3">
                      <div>
                        <div className="text-sm font-medium">{doc.document_type}</div>
                        <div className="text-xs text-muted-foreground">{new Date(doc.uploaded_at).toLocaleDateString()}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={doc.status === "approved" ? "default" : doc.status === "rejected" ? "destructive" : "secondary"}>
                          {doc.status}
                        </Badge>
                        <a href={doc.document_url} target="_blank" rel="noopener noreferrer">
                          <Button variant="outline" size="sm">View</Button>
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          {viewSeller?.status === "pending" && (
            <DialogFooter>
              <Button variant="outline" disabled={actionLoading} onClick={() => setRejectSeller(viewSeller)}>
                <X className="size-4" /> Reject
              </Button>
              <Button disabled={actionLoading} onClick={() => handleApprove(viewSeller)}>
                <Check className="size-4" /> Approve Seller
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>

      {/* Reject Seller Dialog */}
      <Dialog open={!!rejectSeller} onOpenChange={(open) => !open && setRejectSeller(null)}>
        <DialogContent className="sm:max-w-[440px]">
          <DialogHeader>
            <DialogTitle>Reject Seller?</DialogTitle>
            <DialogDescription>Reject <strong>{rejectSeller?.business_name}</strong>? Please provide a reason.</DialogDescription>
          </DialogHeader>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="rejectReason">Reason</FieldLabel>
              <Input id="rejectReason" value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} placeholder="e.g. Documents not clear" />
            </Field>
          </FieldGroup>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>
            <Button variant="destructive" disabled={actionLoading || !rejectReason.trim()} onClick={handleReject}>
              <X className="size-4" /> Reject Seller
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
