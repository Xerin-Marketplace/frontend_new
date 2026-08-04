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
  Wallet,
  Search,
  Pencil,
} from "lucide-react"
import { api, type ApiError } from "@/lib/api"
import { useAuth } from "@/lib/auth-context"
import { PageSkeleton, TableSkeleton } from "@/components/skeletons"

type PayoutRequest = {
  id: string
  seller_id: string
  payout_account_id: string
  amount: number
  currency: string
  status: string
  provider_reference: string | null
  seller_note: string | null
  admin_note: string | null
  requested_at: string
  processed_at: string | null
  completed_at: string | null
}

const payoutStatusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  pending: { label: "Pending", variant: "outline" },
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

export default function AdminPayoutsPage() {
  const { hasPermission, isSuperAdmin } = useAuth()
  const canManagePayouts = isSuperAdmin || hasPermission("wallet:manage")
  const [payouts, setPayouts] = React.useState<PayoutRequest[]>([])
  const [loading, setLoading] = React.useState(true)
  const [search, setSearch] = React.useState("")
  const [searchInput, setSearchInput] = React.useState("")
  const [statusFilter, setStatusFilter] = React.useState("")
  const [editPayout, setEditPayout] = React.useState<PayoutRequest | null>(null)
  const [newStatus, setNewStatus] = React.useState("")
  const [adminNote, setAdminNote] = React.useState("")
  const [providerRef, setProviderRef] = React.useState("")
  const [actionLoading, setActionLoading] = React.useState(false)

  const fetchPayouts = React.useCallback(() => {
    setLoading(true)
    api.get<PayoutRequest[]>("/wallet/admin/payouts")
      .then(setPayouts)
      .catch((err) => {
        toast.add({ title: "Failed to load payouts", description: getApiError(err), type: "error" })
      })
      .finally(() => setLoading(false))
  }, [])

  React.useEffect(() => { fetchPayouts() }, [fetchPayouts])

  const handleSearch = () => setSearch(searchInput)

  const handleUpdatePayout = async () => {
    if (!editPayout || !newStatus) return
    setActionLoading(true)
    try {
      await api.patch(`/wallet/admin/payouts/${editPayout.id}`, {
        status: newStatus,
        note: adminNote || null,
        provider_reference: providerRef || null,
      })
      setEditPayout(null)
      setNewStatus("")
      setAdminNote("")
      setProviderRef("")
      toast.add({ title: "Payout updated!", description: `Payout status set to ${newStatus}.`, type: "success" })
      fetchPayouts()
    } catch (err) {
      toast.add({ title: "Failed to update payout", description: getApiError(err), type: "error" })
    } finally {
      setActionLoading(false)
    }
  }

  const filteredPayouts = React.useMemo(() => {
    let result = payouts
    if (search) {
      const term = search.toLowerCase()
      result = result.filter((p) => p.seller_id.toLowerCase().includes(term) || p.id.toLowerCase().includes(term))
    }
    if (statusFilter) {
      result = result.filter((p) => p.status === statusFilter)
    }
    return result
  }, [payouts, search, statusFilter])

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
        <h2 className="text-2xl font-bold tracking-tight">Payout Requests</h2>
        <p className="text-sm text-muted-foreground">Manage seller payout requests ({payouts.length} total).</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Wallet className="size-4" /> All Payout Requests
            </CardTitle>
            <div className="flex gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="h-9 rounded-md border border-input bg-background px-3 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">All Statuses</option>
                {Object.entries(payoutStatusConfig).map(([key, cfg]) => (
                  <option key={key} value={key}>{cfg.label}</option>
                ))}
              </select>
              <Input
                placeholder="Search payouts..."
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
                <TableHead>Payout ID</TableHead>
                <TableHead>Seller ID</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Requested</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPayouts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">No payout requests found.</TableCell>
                </TableRow>
              ) : (
                filteredPayouts.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-mono text-xs">{p.id.slice(0, 8)}</TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">{p.seller_id.slice(0, 8)}</TableCell>
                    <TableCell className="font-medium">{formatPrice(Number(p.amount))}</TableCell>
                    <TableCell>
                      <Badge variant={payoutStatusConfig[p.status]?.variant ?? "outline"}>
                        {payoutStatusConfig[p.status]?.label ?? p.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs">{new Date(p.requested_at).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right">
                      {canManagePayouts && <Button variant="ghost" size="icon-sm" title="Manage" onClick={() => { setEditPayout(p); setNewStatus(p.status); setAdminNote(p.admin_note ?? ""); setProviderRef(p.provider_reference ?? "") }}>
                        <Pencil className="size-4" />
                      </Button>}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit Payout Dialog */}
      <Dialog open={!!editPayout} onOpenChange={(open) => !open && setEditPayout(null)}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>Manage Payout</DialogTitle>
            <DialogDescription>Payout ID: {editPayout?.id.slice(0, 8)} — {formatPrice(Number(editPayout?.amount ?? 0))}</DialogDescription>
          </DialogHeader>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="payoutStatus">Status</FieldLabel>
              <select
                id="payoutStatus"
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
              >
                {Object.entries(payoutStatusConfig).map(([key, cfg]) => (
                  <option key={key} value={key}>{cfg.label}</option>
                ))}
              </select>
            </Field>
            <Field>
              <FieldLabel htmlFor="providerRef">Provider Reference</FieldLabel>
              <Input id="providerRef" value={providerRef} onChange={(e) => setProviderRef(e.target.value)} placeholder="e.g. BANK-12345" />
            </Field>
            <Field>
              <FieldLabel htmlFor="adminNote">Admin Note</FieldLabel>
              <Input id="adminNote" value={adminNote} onChange={(e) => setAdminNote(e.target.value)} placeholder="Optional note" />
            </Field>
          </FieldGroup>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>
            <Button disabled={actionLoading || !newStatus} onClick={handleUpdatePayout}>
              {actionLoading ? "Updating..." : "Update Payout"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
