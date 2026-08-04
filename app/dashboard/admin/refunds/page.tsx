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
import { toast } from "@/components/ui/toast"
import {
  RefreshCw,
  Search,
  Eye,
  Check,
  X,
} from "lucide-react"
import { api, type ApiError } from "@/lib/api"
import { useAuth } from "@/lib/auth-context"
import { PageSkeleton, TableSkeleton } from "@/components/skeletons"

type RefundItem = {
  id: string
  order_item_id: string
  product_name: string
  quantity: number
  refund_amount: number
}

type Refund = {
  id: string
  order_id: string
  requested_by_id: string
  status: string
  reason: string
  reason_details: string | null
  currency: string
  items_amount: number
  shipping_amount: number
  tax_amount: number
  total_amount: number
  provider_reference: string | null
  admin_note: string | null
  requested_at: string
  reviewed_at: string | null
  processed_at: string | null
  completed_at: string | null
  items: RefundItem[]
}

const refundStatusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  requested: { label: "Requested", variant: "outline" },
  under_review: { label: "Under Review", variant: "secondary" },
  approved: { label: "Approved", variant: "secondary" },
  processing: { label: "Processing", variant: "secondary" },
  completed: { label: "Completed", variant: "default" },
  rejected: { label: "Rejected", variant: "destructive" },
  failed: { label: "Failed", variant: "destructive" },
  cancelled: { label: "Cancelled", variant: "outline" },
}

function formatPrice(price: number): string {
  return `TSh ${Number(price).toLocaleString()}`
}

function getApiError(err: unknown): string {
  const e = err as ApiError
  return e?.detail || "Something went wrong. Please try again."
}

export default function AdminRefundsPage() {
  const { hasPermission, isSuperAdmin } = useAuth()
  const canReview = isSuperAdmin || hasPermission("refunds:review")
  const canProcess = isSuperAdmin || hasPermission("refunds:process")
  const [refunds, setRefunds] = React.useState<Refund[]>([])
  const [loading, setLoading] = React.useState(true)
  const [search, setSearch] = React.useState("")
  const [searchInput, setSearchInput] = React.useState("")
  const [statusFilter, setStatusFilter] = React.useState("")
  const [viewRefund, setViewRefund] = React.useState<Refund | null>(null)
  const [actionLoading, setActionLoading] = React.useState(false)

  const fetchRefunds = React.useCallback(() => {
    setLoading(true)
    const params = new URLSearchParams()
    if (statusFilter) params.set("refund_status", statusFilter)
    api.get<Refund[]>(`/refunds/admin?${params}`)
      .then(setRefunds)
      .catch((err) => {
        toast.add({ title: "Failed to load refunds", description: getApiError(err), type: "error" })
      })
      .finally(() => setLoading(false))
  }, [statusFilter])

  React.useEffect(() => { fetchRefunds() }, [fetchRefunds])

  const handleSearch = () => {
    setSearch(searchInput)
  }

  const handleAction = async (refund: Refund, action: "review" | "approve" | "reject" | "process") => {
    setActionLoading(true)
    try {
      await api.post(`/refunds/${refund.id}/${action}`)
      toast.add({ title: `Refund ${action}d!`, description: `Refund status has been updated.`, type: "success" })
      fetchRefunds()
      setViewRefund(null)
    } catch (err) {
      toast.add({ title: `Failed to ${action} refund`, description: getApiError(err), type: "error" })
    } finally {
      setActionLoading(false)
    }
  }

  const filteredRefunds = React.useMemo(() => {
    if (!search) return refunds
    const term = search.toLowerCase()
    return refunds.filter(
      (r) => r.id.toLowerCase().includes(term) || r.order_id.toLowerCase().includes(term)
    )
  }, [refunds, search])

  if (loading) {
    return (
      <PageSkeleton>
        <Card><TableSkeleton rows={10} cols={6} /></Card>
      </PageSkeleton>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Refunds</h2>
        <p className="text-sm text-muted-foreground">Manage all refund requests ({refunds.length} total).</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <RefreshCw className="size-4" /> All Refunds
            </CardTitle>
            <div className="flex gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="h-9 rounded-md border border-input bg-background px-3 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">All Statuses</option>
                {Object.entries(refundStatusConfig).map(([key, cfg]) => (
                  <option key={key} value={key}>{cfg.label}</option>
                ))}
              </select>
              <Input
                placeholder="Search refunds..."
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
                <TableHead>Refund ID</TableHead>
                <TableHead>Order ID</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Requested</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRefunds.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">No refunds found.</TableCell>
                </TableRow>
              ) : (
                filteredRefunds.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-mono text-xs">{r.id.slice(0, 8)}</TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">{r.order_id.slice(0, 8)}</TableCell>
                    <TableCell className="font-medium">{formatPrice(Number(r.total_amount))}</TableCell>
                    <TableCell className="text-xs">{r.reason.replace(/_/g, " ")}</TableCell>
                    <TableCell>
                      <Badge variant={refundStatusConfig[r.status]?.variant ?? "outline"}>
                        {refundStatusConfig[r.status]?.label ?? r.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs">{new Date(r.requested_at).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon-sm" title="View Details" onClick={() => setViewRefund(r)}>
                        <Eye className="size-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* View Refund Dialog */}
      <Dialog open={!!viewRefund} onOpenChange={(open) => !open && setViewRefund(null)}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Refund Details</DialogTitle>
            <DialogDescription>Refund ID: {viewRefund?.id.slice(0, 8)}</DialogDescription>
          </DialogHeader>
          {viewRefund && (
            <div className="flex flex-col gap-4">
              <div className="grid gap-2 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Order ID:</span> <span className="font-mono text-xs">{viewRefund.order_id.slice(0, 8)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Status:</span> <Badge variant={refundStatusConfig[viewRefund.status]?.variant ?? "outline"}>{viewRefund.status}</Badge></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Reason:</span> {viewRefund.reason.replace(/_/g, " ")}</div>
                {viewRefund.reason_details && (
                  <div className="flex justify-between"><span className="text-muted-foreground">Details:</span> {viewRefund.reason_details}</div>
                )}
                <div className="flex justify-between"><span className="text-muted-foreground">Items Amount:</span> {formatPrice(Number(viewRefund.items_amount))}</div>
                <div className="flex justify-between"><span className="text-muted-foreground">Shipping:</span> {formatPrice(Number(viewRefund.shipping_amount))}</div>
                <div className="flex justify-between"><span className="text-muted-foreground">Tax:</span> {formatPrice(Number(viewRefund.tax_amount))}</div>
                <div className="flex justify-between font-medium"><span>Total Refund:</span> {formatPrice(Number(viewRefund.total_amount))}</div>
                {viewRefund.admin_note && (
                  <div className="flex justify-between"><span className="text-muted-foreground">Admin Note:</span> {viewRefund.admin_note}</div>
                )}
              </div>

              {viewRefund.items.length > 0 && (
                <div>
                  <h4 className="mb-2 text-sm font-medium">Refunded Items</h4>
                  <div className="flex flex-col gap-2">
                    {viewRefund.items.map((item) => (
                      <div key={item.id} className="flex items-center justify-between rounded-lg border p-3 text-sm">
                        <div>
                          <div className="font-medium">{item.product_name}</div>
                          <div className="text-xs text-muted-foreground">Qty: {item.quantity}</div>
                        </div>
                        <div className="font-medium">{formatPrice(Number(item.refund_amount))}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-2">
                {canReview && viewRefund.status === "requested" && (
                  <Button variant="outline" size="sm" disabled={actionLoading} onClick={() => handleAction(viewRefund, "review")}>
                    <Eye className="size-4" /> Mark Under Review
                  </Button>
                )}
                {canReview && (viewRefund.status === "under_review" || viewRefund.status === "requested") && (
                  <>
                    <Button size="sm" disabled={actionLoading} className="bg-green-600" onClick={() => handleAction(viewRefund, "approve")}>
                      <Check className="size-4" /> Approve
                    </Button>
                    <Button variant="destructive" size="sm" disabled={actionLoading} onClick={() => handleAction(viewRefund, "reject")}>
                      <X className="size-4" /> Reject
                    </Button>
                  </>
                )}
                {canProcess && viewRefund.status === "approved" && (
                  <Button size="sm" disabled={actionLoading} onClick={() => handleAction(viewRefund, "process")}>
                    <RefreshCw className="size-4" /> Process Refund
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
