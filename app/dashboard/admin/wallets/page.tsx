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
  Plus,
  Eye,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertTriangle,
  Snowflake,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
} from "lucide-react"
import { api, type ApiError } from "@/lib/api"
import { useAuth } from "@/lib/auth-context"
import { PageSkeleton, TableSkeleton } from "@/components/skeletons"

type SellerWallet = {
  id: string
  seller_id: string
  currency: string
  pending_balance: number
  available_balance: number
  reserved_balance: number
  paid_out_balance: number
  refunded_balance: number
  debt_balance: number
  is_frozen: boolean
  created_at: string
  updated_at: string | null
}

type SellerInfo = {
  id: string
  business_name: string
  status: string
  user_id: string
}

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
  const n = Number(price)
  return `TSh ${Number.isNaN(n) ? 0 : n.toLocaleString()}`
}

function getApiError(err: unknown): string {
  const e = err as ApiError
  return e?.detail || "Something went wrong. Please try again."
}

export default function AdminWalletsPage() {
  const { hasPermission, isSuperAdmin } = useAuth()
  const canManagePayouts = isSuperAdmin || hasPermission("wallet:manage")
  const canAdjustWallets = isSuperAdmin || hasPermission("wallet:adjust")
  const [tab, setTab] = React.useState<"wallets" | "payouts">("wallets")
  const [wallets, setWallets] = React.useState<SellerWallet[]>([])
  const [payouts, setPayouts] = React.useState<PayoutRequest[]>([])
  const [sellersMap, setSellersMap] = React.useState<Record<string, SellerInfo>>({})
  const [loading, setLoading] = React.useState(true)
  const [search, setSearch] = React.useState("")
  const [searchInput, setSearchInput] = React.useState("")
  const [statusFilter, setStatusFilter] = React.useState("")
  const [editPayout, setEditPayout] = React.useState<PayoutRequest | null>(null)
  const [newStatus, setNewStatus] = React.useState("")
  const [adminNote, setAdminNote] = React.useState("")
  const [providerRef, setProviderRef] = React.useState("")
  const [actionLoading, setActionLoading] = React.useState(false)
  const [adjustWallet, setAdjustWallet] = React.useState<SellerWallet | null>(null)
  const [adjustmentAmount, setAdjustmentAmount] = React.useState("")
  const [adjustmentReason, setAdjustmentReason] = React.useState("")
  const [viewWallet, setViewWallet] = React.useState<SellerWallet | null>(null)

  const fetchAll = React.useCallback(() => {
    setLoading(true)
    Promise.all([
      api.get<SellerWallet[]>("/wallet/admin/wallets"),
      api.get<PayoutRequest[]>("/wallet/admin/payouts"),
      api.get<SellerInfo[]>("/admin/sellers"),
    ])
      .then(([w, p, s]) => {
        setWallets(w)
        setPayouts(p)
        const map: Record<string, SellerInfo> = {}
        s.forEach((seller) => { map[seller.id] = seller })
        setSellersMap(map)
      })
      .catch((err) => {
        toast.add({ title: "Failed to load wallet data", description: getApiError(err), type: "error" })
      })
      .finally(() => setLoading(false))
  }, [])

  React.useEffect(() => { fetchAll() }, [fetchAll])

  const sellerName = (sellerId: string) => sellersMap[sellerId]?.business_name ?? `Seller ${sellerId.slice(0, 8)}`
  const sellerStatus = (sellerId: string) => sellersMap[sellerId]?.status ?? "unknown"

  const handleSearch = () => {
    setSearch(searchInput)
  }

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
      const updated = await api.get<PayoutRequest[]>("/wallet/admin/payouts")
      setPayouts(updated)
    } catch (err) {
      toast.add({ title: "Failed to update payout", description: getApiError(err), type: "error" })
    } finally {
      setActionLoading(false)
    }
  }

  const handleWalletAdjustment = async () => {
    if (!adjustWallet || !adjustmentAmount || !adjustmentReason.trim()) return
    setActionLoading(true)
    try {
      await api.post(`/wallet/admin/wallets/${adjustWallet.seller_id}/adjustments`, {
        amount: Number(adjustmentAmount),
        reason: adjustmentReason.trim(),
      })
      const updated = await api.get<SellerWallet[]>("/wallet/admin/wallets")
      setWallets(updated)
      setAdjustWallet(null)
      setAdjustmentAmount("")
      setAdjustmentReason("")
      toast.add({ title: "Wallet adjusted", type: "success" })
    } catch (err) {
      toast.add({ title: "Failed to adjust wallet", description: getApiError(err), type: "error" })
    } finally {
      setActionLoading(false)
    }
  }

  const filteredWallets = React.useMemo(() => {
    if (!search) return wallets
    const term = search.toLowerCase()
    return wallets.filter((w) =>
      w.seller_id.toLowerCase().includes(term) ||
      sellerName(w.seller_id).toLowerCase().includes(term)
    )
  }, [wallets, search, sellersMap])

  const filteredPayouts = React.useMemo(() => {
    let result = payouts
    if (search) {
      const term = search.toLowerCase()
      result = result.filter((p) =>
        p.seller_id.toLowerCase().includes(term) ||
        p.id.toLowerCase().includes(term) ||
        sellerName(p.seller_id).toLowerCase().includes(term)
      )
    }
    if (statusFilter) {
      result = result.filter((p) => p.status === statusFilter)
    }
    return result
  }, [payouts, search, statusFilter, sellersMap])

  const summary = React.useMemo(() => {
    const totalPending = wallets.reduce((s, w) => s + Number(w.pending_balance ?? 0), 0)
    const totalAvailable = wallets.reduce((s, w) => s + Number(w.available_balance ?? 0), 0)
    const totalReserved = wallets.reduce((s, w) => s + Number(w.reserved_balance ?? 0), 0)
    const totalDebt = wallets.reduce((s, w) => s + Number(w.debt_balance ?? 0), 0)
    const frozenCount = wallets.filter((w) => w.is_frozen).length
    const pendingPayouts = payouts.filter((p) => p.status === "pending").length
    return { totalPending, totalAvailable, totalReserved, totalDebt, frozenCount, pendingPayouts }
  }, [wallets, payouts])

  const sellerPayouts = React.useMemo(() => {
    if (!viewWallet) return []
    return payouts.filter((p) => p.seller_id === viewWallet.seller_id).slice(0, 5)
  }, [payouts, viewWallet])

  if (loading) {
    return (
      <PageSkeleton>
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => <StatsCardSkeleton key={i} />)}
        </div>
        <Card><TableSkeleton rows={10} cols={7} /></Card>
      </PageSkeleton>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="animate-fade-in-up">
          <h2 className="text-2xl font-bold tracking-tight">Wallets</h2>
          <p className="text-sm text-muted-foreground">Manage seller wallets and payout requests.</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchAll} disabled={loading}>
          <RefreshCw className={`size-4 ${loading ? "animate-spin" : ""}`} /> Refresh
        </Button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <Card className="opacity-0-init animate-fade-in-up">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Pending</CardTitle>
            <div className="flex size-8 items-center justify-center rounded-lg bg-amber-500/10">
              <Clock className="size-4 text-amber-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatPrice(summary.totalPending)}</div>
            <div className="mt-1 flex items-center gap-1 text-xs">
              <ArrowUpRight className="size-3 text-amber-500" />
              <span className="text-muted-foreground">Awaiting settlement</span>
            </div>
          </CardContent>
        </Card>

        <Card className="opacity-0-init animate-fade-in-up animation-delay-100">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Available</CardTitle>
            <div className="flex size-8 items-center justify-center rounded-lg bg-green-500/10">
              <CheckCircle className="size-4 text-green-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatPrice(summary.totalAvailable)}</div>
            <div className="mt-1 flex items-center gap-1 text-xs">
              <ArrowUpRight className="size-3 text-green-500" />
              <span className="text-muted-foreground">Ready for payout</span>
            </div>
          </CardContent>
        </Card>

        <Card className="opacity-0-init animate-fade-in-up animation-delay-200">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Reserved</CardTitle>
            <div className="flex size-8 items-center justify-center rounded-lg bg-blue-500/10">
              <Wallet className="size-4 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatPrice(summary.totalReserved)}</div>
            <div className="mt-1 flex items-center gap-1 text-xs">
              <ArrowUpRight className="size-3 text-blue-500" />
              <span className="text-muted-foreground">In payout processing</span>
            </div>
          </CardContent>
        </Card>

        <Card className="opacity-0-init animate-fade-in-up animation-delay-300">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Debt</CardTitle>
            <div className="flex size-8 items-center justify-center rounded-lg bg-red-500/10">
              <AlertTriangle className="size-4 text-red-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{formatPrice(summary.totalDebt)}</div>
            <div className="mt-1 flex items-center gap-1 text-xs">
              <ArrowDownRight className="size-3 text-red-500" />
              <span className="text-muted-foreground">{summary.frozenCount} frozen · {summary.pendingPayouts} pending payouts</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex gap-1 rounded-lg border p-1 w-fit">
        <Button variant={tab === "wallets" ? "default" : "ghost"} size="sm" onClick={() => setTab("wallets")}>
          Seller Wallets ({wallets.length})
        </Button>
        <Button variant={tab === "payouts" ? "default" : "ghost"} size="sm" onClick={() => setTab("payouts")}>
          Payout Requests ({payouts.length})
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Wallet className="size-4" /> {tab === "wallets" ? "Seller Wallets" : "Payout Requests"}
            </CardTitle>
            <div className="flex flex-wrap gap-2">
              {tab === "payouts" && (
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
              )}
              <Input
                placeholder="Search by seller name or ID..."
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
          {tab === "wallets" ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Seller</TableHead>
                  <TableHead>Pending</TableHead>
                  <TableHead>Available</TableHead>
                  <TableHead>Reserved</TableHead>
                  <TableHead>Paid Out</TableHead>
                  <TableHead>Debt</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredWallets.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                      <div className="flex flex-col items-center gap-2">
                        <Wallet className="size-5 text-muted-foreground/30" />
                        <span>No wallets found.</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredWallets.map((w) => (
                    <TableRow key={w.id} className="transition-colors hover:bg-muted/30">
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium text-sm">{sellerName(w.seller_id)}</span>
                          <span className="font-mono text-xs text-muted-foreground">{w.seller_id.slice(0, 8)}</span>
                        </div>
                      </TableCell>
                      <TableCell>{formatPrice(Number(w.pending_balance))}</TableCell>
                      <TableCell className="font-medium text-green-600">{formatPrice(Number(w.available_balance))}</TableCell>
                      <TableCell>{formatPrice(Number(w.reserved_balance))}</TableCell>
                      <TableCell>{formatPrice(Number(w.paid_out_balance))}</TableCell>
                      <TableCell className={Number(w.debt_balance) > 0 ? "font-medium text-red-600" : ""}>
                        {formatPrice(Number(w.debt_balance))}
                      </TableCell>
                      <TableCell>
                        <Badge variant={w.is_frozen ? "destructive" : "outline"} className="gap-1">
                          {w.is_frozen && <Snowflake className="size-3" />}
                          {w.is_frozen ? "Frozen" : "Active"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon-sm" title="View Details" onClick={() => setViewWallet(w)}>
                            <Eye className="size-4" />
                          </Button>
                          {canAdjustWallets && (
                            <Button variant="ghost" size="sm" title="Adjust Balance" onClick={() => setAdjustWallet(w)}>
                              <Plus className="size-4" /> Adjust
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Payout ID</TableHead>
                  <TableHead>Seller</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Requested</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPayouts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                      <div className="flex flex-col items-center gap-2">
                        <Wallet className="size-5 text-muted-foreground/30" />
                        <span>No payout requests found.</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredPayouts.map((p) => (
                    <TableRow key={p.id} className="transition-colors hover:bg-muted/30">
                      <TableCell className="font-mono text-xs">{p.id.slice(0, 8)}</TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium text-sm">{sellerName(p.seller_id)}</span>
                          <span className="font-mono text-xs text-muted-foreground">{p.seller_id.slice(0, 8)}</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">{formatPrice(Number(p.amount))}</TableCell>
                      <TableCell>
                        <Badge variant={payoutStatusConfig[p.status]?.variant ?? "outline"}>
                          {payoutStatusConfig[p.status]?.label ?? p.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-xs">{new Date(p.requested_at).toLocaleDateString()}</TableCell>
                      <TableCell className="text-right">
                        {canManagePayouts && (
                          <Button variant="ghost" size="icon-sm" title="Manage Payout" onClick={() => { setEditPayout(p); setNewStatus(p.status); setAdminNote(p.admin_note ?? ""); setProviderRef(p.provider_reference ?? "") }}>
                            <Pencil className="size-4" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
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

      <Dialog open={!!adjustWallet} onOpenChange={(open) => !open && setAdjustWallet(null)}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>Adjust Seller Wallet</DialogTitle>
            <DialogDescription>
              {adjustWallet && (
                <span>Adjusting <strong>{sellerName(adjustWallet.seller_id)}</strong> — use a positive amount to credit or negative to debit.</span>
              )}
            </DialogDescription>
          </DialogHeader>
          {adjustWallet && (
            <div className="rounded-lg border bg-muted/30 p-3 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Current Available:</span><span className="font-medium text-green-600">{formatPrice(Number(adjustWallet.available_balance))}</span></div>
              <div className="flex justify-between mt-1"><span className="text-muted-foreground">Current Pending:</span><span>{formatPrice(Number(adjustWallet.pending_balance))}</span></div>
              <div className="flex justify-between mt-1"><span className="text-muted-foreground">Current Debt:</span><span className={Number(adjustWallet.debt_balance) > 0 ? "text-red-600 font-medium" : ""}>{formatPrice(Number(adjustWallet.debt_balance))}</span></div>
            </div>
          )}
          <FieldGroup>
            <Field><FieldLabel htmlFor="adjustmentAmount">Amount (TSh)</FieldLabel><Input id="adjustmentAmount" type="number" step="0.01" value={adjustmentAmount} onChange={(e) => setAdjustmentAmount(e.target.value)} placeholder="e.g. 5000 or -5000" /></Field>
            <Field><FieldLabel htmlFor="adjustmentReason">Reason</FieldLabel><Input id="adjustmentReason" value={adjustmentReason} onChange={(e) => setAdjustmentReason(e.target.value)} placeholder="Required audit reason" /></Field>
          </FieldGroup>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>
            <Button disabled={actionLoading || !adjustmentAmount || !adjustmentReason.trim()} onClick={handleWalletAdjustment}>{actionLoading ? "Applying..." : "Apply Adjustment"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Wallet Detail Dialog */}
      <Dialog open={!!viewWallet} onOpenChange={(open) => !open && setViewWallet(null)}>
        <DialogContent className="sm:max-w-[560px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Wallet className="size-5" /> Wallet Details
            </DialogTitle>
            <DialogDescription>
              {viewWallet && (
                <span><strong>{sellerName(viewWallet.seller_id)}</strong> · Seller ID: {viewWallet.seller_id.slice(0, 8)}</span>
              )}
            </DialogDescription>
          </DialogHeader>
          {viewWallet && (
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-2">
                <Badge variant={viewWallet.is_frozen ? "destructive" : "default"} className="gap-1">
                  {viewWallet.is_frozen && <Snowflake className="size-3" />}
                  {viewWallet.is_frozen ? "Frozen" : "Active"}
                </Badge>
                <Badge variant="outline">Seller: {sellerStatus(viewWallet.seller_id)}</Badge>
                <Badge variant="outline">{viewWallet.currency}</Badge>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl border bg-amber-500/5 p-3">
                  <p className="text-xs font-medium text-muted-foreground flex items-center gap-1"><Clock className="size-3" /> Pending Balance</p>
                  <p className="mt-1 text-lg font-bold text-amber-600">{formatPrice(Number(viewWallet.pending_balance))}</p>
                </div>
                <div className="rounded-xl border bg-green-500/5 p-3">
                  <p className="text-xs font-medium text-muted-foreground flex items-center gap-1"><CheckCircle className="size-3" /> Available Balance</p>
                  <p className="mt-1 text-lg font-bold text-green-600">{formatPrice(Number(viewWallet.available_balance))}</p>
                </div>
                <div className="rounded-xl border bg-blue-500/5 p-3">
                  <p className="text-xs font-medium text-muted-foreground flex items-center gap-1"><Wallet className="size-3" /> Reserved Balance</p>
                  <p className="mt-1 text-lg font-bold text-blue-600">{formatPrice(Number(viewWallet.reserved_balance))}</p>
                </div>
                <div className="rounded-xl border bg-muted/30 p-3">
                  <p className="text-xs font-medium text-muted-foreground flex items-center gap-1"><TrendingUp className="size-3" /> Paid Out</p>
                  <p className="mt-1 text-lg font-bold">{formatPrice(Number(viewWallet.paid_out_balance))}</p>
                </div>
                <div className="rounded-xl border bg-red-500/5 p-3">
                  <p className="text-xs font-medium text-muted-foreground flex items-center gap-1"><AlertTriangle className="size-3" /> Debt Balance</p>
                  <p className="mt-1 text-lg font-bold text-red-600">{formatPrice(Number(viewWallet.debt_balance))}</p>
                </div>
                <div className="rounded-xl border bg-muted/30 p-3">
                  <p className="text-xs font-medium text-muted-foreground flex items-center gap-1"><RefreshCw className="size-3" /> Refunded</p>
                  <p className="mt-1 text-lg font-bold">{formatPrice(Number(viewWallet.refunded_balance))}</p>
                </div>
              </div>

              {sellerPayouts.length > 0 && (
                <div>
                  <p className="text-sm font-semibold mb-2">Recent Payouts</p>
                  <div className="flex flex-col gap-2">
                    {sellerPayouts.map((p) => (
                      <div key={p.id} className="flex items-center justify-between rounded-lg border p-2 text-sm">
                        <div className="flex flex-col">
                          <span className="font-mono text-xs text-muted-foreground">{p.id.slice(0, 8)}</span>
                          <span className="text-xs text-muted-foreground">{new Date(p.requested_at).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{formatPrice(Number(p.amount))}</span>
                          <Badge variant={payoutStatusConfig[p.status]?.variant ?? "outline"} className="text-xs">
                            {payoutStatusConfig[p.status]?.label ?? p.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="text-xs text-muted-foreground border-t pt-3">
                Wallet created: {new Date(viewWallet.created_at).toLocaleDateString()}
                {viewWallet.updated_at && ` · Last updated: ${new Date(viewWallet.updated_at).toLocaleDateString()}`}
              </div>
            </div>
          )}
          <DialogFooter>
            {canAdjustWallets && viewWallet && (
              <Button variant="outline" onClick={() => { setAdjustWallet(viewWallet); setViewWallet(null) }}>
                <Plus className="size-4" /> Adjust Balance
              </Button>
            )}
            <DialogClose render={<Button />}>Close</DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
