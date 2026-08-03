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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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
  FileDown,
  FileText,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ChevronLeft,
  ChevronRight,
  Filter,
  Users,
  MapPin,
} from "lucide-react"
import { api, type ApiError } from "@/lib/api"
import { PageSkeleton, TableSkeleton } from "@/components/skeletons"
import { useRouter } from "next/navigation"

type Seller = {
  id: string
  user_id: string
  business_name: string
  business_description: string | null
  business_country: string | null
  business_region: string | null
  business_city: string | null
  business_address: string | null
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

type SortField = "business_name" | "contact_email" | "contact_phone" | "status" | "created"
type SortDir = "asc" | "desc"

const sellerStatusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  approved: { label: "Approved", variant: "default" },
  active: { label: "Active", variant: "default" },
  pending: { label: "Pending", variant: "secondary" },
  under_review: { label: "Under Review", variant: "secondary" },
  suspended: { label: "Suspended", variant: "destructive" },
  rejected: { label: "Rejected", variant: "destructive" },
}

function getApiError(err: unknown): string {
  const e = err as ApiError
  return e?.detail || "Something went wrong. Please try again."
}

function exportToCSV(sellers: Seller[]) {
  const headers = ["Business Name", "Contact Email", "Contact Phone", "Status", "Location", "Created"]
  const rows = sellers.map((s) => [
    s.business_name,
    s.contact_email ?? "",
    s.contact_phone ?? "",
    s.status,
    [s.business_city, s.business_region, s.business_country].filter(Boolean).join(", "),
    new Date(s.created_at).toLocaleDateString(),
  ])
  const csv = [headers, ...rows]
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
    .join("\n")
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = `sellers-export-${new Date().toISOString().slice(0, 10)}.csv`
  link.click()
  URL.revokeObjectURL(url)
  toast.add({ title: "CSV exported", description: `${sellers.length} sellers exported.`, type: "success" })
}

function exportToPDF(sellers: Seller[]) {
  const win = window.open("", "_blank")
  if (!win) {
    toast.add({ title: "Popup blocked", description: "Please allow popups to export PDF.", type: "error" })
    return
  }
  const rows = sellers
    .map(
      (s, i) => `<tr>
        <td>${i + 1}</td>
        <td>${s.business_name}</td>
        <td>${s.contact_email ?? "—"}</td>
        <td>${s.contact_phone ?? "—"}</td>
        <td>${s.status}</td>
        <td>${[s.business_city, s.business_region, s.business_country].filter(Boolean).join(", ") || "—"}</td>
        <td>${new Date(s.created_at).toLocaleDateString()}</td>
      </tr>`
    )
    .join("")
  win.document.write(`<!DOCTYPE html>
<html>
<head>
<title>Sellers Export — ${new Date().toLocaleDateString()}</title>
<style>
  body { font-family: system-ui, -apple-system, sans-serif; padding: 40px; color: #1a1a1a; }
  h1 { font-size: 24px; margin-bottom: 8px; }
  .meta { color: #666; font-size: 13px; margin-bottom: 24px; }
  table { width: 100%; border-collapse: collapse; font-size: 13px; }
  th { text-align: left; padding: 10px 12px; background: #f5f5f5; border-bottom: 2px solid #ddd; font-weight: 600; }
  td { padding: 8px 12px; border-bottom: 1px solid #eee; }
  tr:nth-child(even) { background: #fafafa; }
  .badge { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 600; }
  @media print { body { padding: 20px; } }
</style>
</head>
<body>
  <h1>Sellers Export Report</h1>
  <div class="meta">Generated: ${new Date().toLocaleString()} · Total: ${sellers.length} sellers</div>
  <table>
    <thead>
      <tr><th>#</th><th>Business Name</th><th>Email</th><th>Phone</th><th>Status</th><th>Location</th><th>Created</th></tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>
  <script>window.onload = () => window.print()</script>
</body>
</html>`)
  win.document.close()
}

export default function AdminSellersPage() {
  const router = useRouter()
  const [sellers, setSellers] = React.useState<Seller[]>([])
  const [loading, setLoading] = React.useState(true)
  const [searchInput, setSearchInput] = React.useState("")
  const [search, setSearch] = React.useState("")
  const [sortField, setSortField] = React.useState<SortField>("created")
  const [sortDir, setSortDir] = React.useState<SortDir>("desc")
  const [statusFilter, setStatusFilter] = React.useState("")
  const [locationFilter, setLocationFilter] = React.useState("")
  const [page, setPage] = React.useState(1)
  const [viewSeller, setViewSeller] = React.useState<Seller | null>(null)
  const [sellerDocs, setSellerDocs] = React.useState<KycDocument[]>([])
  const [docsLoading, setDocsLoading] = React.useState(false)
  const [rejectSeller, setRejectSeller] = React.useState<Seller | null>(null)
  const [rejectReason, setRejectReason] = React.useState("")
  const [actionLoading, setActionLoading] = React.useState(false)
  const pageSize = 10

  const fetchSellers = React.useCallback(() => {
    setLoading(true)
    api.get<Seller[]>(`/admin/sellers`)
      .then((data) => {
        setSellers(data)
      })
      .catch((err) => {
        toast.add({ title: "Failed to load sellers", description: getApiError(err), type: "error" })
      })
      .finally(() => setLoading(false))
  }, [])

  React.useEffect(() => { fetchSellers() }, [fetchSellers])

  // Debounced AJAX search
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput)
      setPage(1)
    }, 400)
    return () => clearTimeout(timer)
  }, [searchInput])

  // Client-side filter + sort + paginate
  const processedSellers = React.useMemo(() => {
    let result = [...sellers]

    // Search
    if (search) {
      const q = search.toLowerCase()
      result = result.filter((s) =>
        s.business_name.toLowerCase().includes(q) ||
        (s.contact_email ?? "").toLowerCase().includes(q) ||
        (s.contact_phone ?? "").toLowerCase().includes(q)
      )
    }

    // Status filter
    if (statusFilter) {
      result = result.filter((s) => s.status === statusFilter)
    }

    // Location filter
    if (locationFilter) {
      const lf = locationFilter.toLowerCase()
      result = result.filter((s) =>
        (s.business_city ?? "").toLowerCase().includes(lf) ||
        (s.business_region ?? "").toLowerCase().includes(lf) ||
        (s.business_country ?? "").toLowerCase().includes(lf)
      )
    }

    // Sort
    result.sort((a, b) => {
      let cmp = 0
      switch (sortField) {
        case "business_name":
          cmp = a.business_name.localeCompare(b.business_name)
          break
        case "contact_email":
          cmp = (a.contact_email ?? "").localeCompare(b.contact_email ?? "")
          break
        case "contact_phone":
          cmp = (a.contact_phone ?? "").localeCompare(b.contact_phone ?? "")
          break
        case "status":
          cmp = a.status.localeCompare(b.status)
          break
        case "created":
          cmp = new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          break
      }
      return sortDir === "asc" ? cmp : -cmp
    })

    return result
  }, [sellers, search, statusFilter, locationFilter, sortField, sortDir])

  const total = processedSellers.length
  const totalPages = Math.ceil(total / pageSize)
  const paginatedSellers = processedSellers.slice((page - 1) * pageSize, page * pageSize)

  const handleSort = (field: SortField, dir: SortDir) => {
    setSortField(field)
    setSortDir(dir)
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

  if (loading && sellers.length === 0) {
    return (
      <PageSkeleton>
        <Card><TableSkeleton rows={10} cols={7} /></Card>
      </PageSkeleton>
    )
  }

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ArrowUpDown className="size-3 text-muted-foreground/50" />
    return sortDir === "asc" ? <ArrowUp className="size-3 text-primary" /> : <ArrowDown className="size-3 text-primary" />
  }

  const SortMenu = ({ field, label }: { field: SortField; label: string }) => (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <button className="flex items-center gap-1.5 hover:text-foreground transition-colors">
            {label} <SortIcon field={field} />
          </button>
        }
      />
      <DropdownMenuContent align="start" className="w-44">
        <DropdownMenuLabel>Sort {label}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => handleSort(field, "asc")}>
          <ArrowUp className="size-3.5" /> A to Z
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleSort(field, "desc")}>
          <ArrowDown className="size-3.5" /> Z to A
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Sellers</h2>
          <p className="text-sm text-muted-foreground">Manage all sellers and approve pending applications ({sellers.length} total).</p>
        </div>
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button variant="outline">
                  <FileDown className="size-4" /> Export
                </Button>
              }
            />
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuLabel>Export {total} sellers</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => exportToCSV(processedSellers)}>
                <FileDown className="size-4" /> Export as CSV
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => exportToPDF(processedSellers)}>
                <FileText className="size-4" /> Export as PDF
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Stats summary */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Sellers</CardTitle>
            <Store className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{sellers.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Approved</CardTitle>
            <Check className="size-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{sellers.filter((s) => s.status === "approved" || s.status === "active").length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending</CardTitle>
            <Users className="size-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{sellers.filter((s) => s.status === "pending" || s.status === "under_review").length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Rejected</CardTitle>
            <X className="size-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{sellers.filter((s) => s.status === "rejected").length}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <CardTitle className="text-base flex items-center gap-2">
              <Store className="size-4" /> All Sellers
            </CardTitle>
            <div className="flex items-center gap-2">
              {/* Status filter */}
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <Button variant="outline" size="sm" className={statusFilter ? "border-primary" : ""}>
                      <Filter className="size-3.5" /> {statusFilter ? sellerStatusConfig[statusFilter]?.label ?? statusFilter : "Status"}
                    </Button>
                  }
                />
                <DropdownMenuContent align="end" className="w-44">
                  <DropdownMenuLabel>Filter by Status</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => { setStatusFilter(""); setPage(1) }}>
                    <span className="flex items-center justify-between w-full">All <Badge variant="secondary" className="text-xs">{sellers.length}</Badge></span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => { setStatusFilter("approved"); setPage(1) }}>
                    <span className="flex items-center justify-between w-full">Approved <Badge variant="default" className="text-xs">{sellers.filter((s) => s.status === "approved").length}</Badge></span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => { setStatusFilter("active"); setPage(1) }}>
                    <span className="flex items-center justify-between w-full">Active <Badge variant="default" className="text-xs">{sellers.filter((s) => s.status === "active").length}</Badge></span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => { setStatusFilter("pending"); setPage(1) }}>
                    <span className="flex items-center justify-between w-full">Pending <Badge variant="secondary" className="text-xs">{sellers.filter((s) => s.status === "pending").length}</Badge></span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => { setStatusFilter("under_review"); setPage(1) }}>
                    <span className="flex items-center justify-between w-full">Under Review <Badge variant="secondary" className="text-xs">{sellers.filter((s) => s.status === "under_review").length}</Badge></span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => { setStatusFilter("rejected"); setPage(1) }}>
                    <span className="flex items-center justify-between w-full">Rejected <Badge variant="destructive" className="text-xs">{sellers.filter((s) => s.status === "rejected").length}</Badge></span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => { setStatusFilter("suspended"); setPage(1) }}>
                    <span className="flex items-center justify-between w-full">Suspended <Badge variant="destructive" className="text-xs">{sellers.filter((s) => s.status === "suspended").length}</Badge></span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Location filter */}
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Location..."
                  value={locationFilter}
                  onChange={(e) => { setLocationFilter(e.target.value); setPage(1) }}
                  className="pl-8 w-40 text-xs h-8"
                />
              </div>

              {/* AJAX Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search sellers..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="pl-9 w-64"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead><SortMenu field="business_name" label="Business Name" /></TableHead>
                <TableHead><SortMenu field="contact_email" label="Email" /></TableHead>
                <TableHead><SortMenu field="contact_phone" label="Phone" /></TableHead>
                <TableHead><SortMenu field="status" label="Status" /></TableHead>
                <TableHead>Location</TableHead>
                <TableHead><SortMenu field="created" label="Created" /></TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedSellers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">No sellers found.</TableCell>
                </TableRow>
              ) : (
                paginatedSellers.map((s) => (
                  <TableRow key={s.id} className="transition-colors hover:bg-muted/30">
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-xs font-bold text-primary">
                          {s.business_name.slice(0, 2).toUpperCase()}
                        </div>
                        {s.business_name}
                      </div>
                    </TableCell>
                    <TableCell>{s.contact_email ?? "—"}</TableCell>
                    <TableCell>{s.contact_phone ?? "—"}</TableCell>
                    <TableCell>
                      <Badge variant={sellerStatusConfig[s.status]?.variant ?? "outline"}>
                        {sellerStatusConfig[s.status]?.label ?? s.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {[s.business_city, s.business_region, s.business_country].filter(Boolean).join(", ") || "—"}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs">{new Date(s.created_at).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon-sm" title="View Details" onClick={() => handleViewDocs(s)}>
                          <Eye className="size-4" />
                        </Button>
                        <Button variant="ghost" size="icon-sm" title="View Full Profile" onClick={() => router.push(`/dashboard/admin/sellers/${s.id}`)}>
                          <Store className="size-4" />
                        </Button>
                        {(s.status === "pending" || s.status === "under_review") && (
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

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-4 flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Page {page} of {totalPages} · {total} sellers
              </p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(page - 1)}>
                  <ChevronLeft className="size-4" /> Prev
                </Button>
                <Button variant="outline" size="sm" disabled={page === totalPages} onClick={() => setPage(page + 1)}>
                  Next <ChevronRight className="size-4" />
                </Button>
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
              <div><span className="text-muted-foreground">Location:</span> {[viewSeller?.business_city, viewSeller?.business_region, viewSeller?.business_country].filter(Boolean).join(", ") || "—"}</div>
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
                        <div className="text-sm font-medium capitalize">{doc.document_type.replace(/_/g, " ")}</div>
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
          {viewSeller && (viewSeller.status === "pending" || viewSeller.status === "under_review") && (
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
