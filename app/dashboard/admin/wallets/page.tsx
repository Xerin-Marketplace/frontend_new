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

export default function AdminWalletsPage() {
  const [tab, setTab] = React.useState<"wallets" | "payouts">("wallets")
  const [wallets, setWallets] = React.useState<SellerWallet[]>([])
  const [payouts, setPayouts] = React.useState<PayoutRequest[]>([])
  const [loading, setLoading] = React.useState(true)
  const [search, setSearch] = React.useState("")
  const [searchInput, setSearchInput] = React.useState("")
  const [editPayout, setEditPayout] = React.useState<PayoutRequest | null>(null)
  const [newStatus, setNewStatus] = React.useState("")
  const [adminNote, setAdminNote] = React.useState("")
  const [providerRef, setProviderRef] = React.useState("")
  const [actionLoading, setActionLoading] = React.useState(false)

  React.useEffect(() => {
    setLoading(true)
    Promise.all([
      api.get<SellerWallet[]>("/wallet/admin/wallets"),
      api.get<PayoutRequest[]>("/wallet/admin/payouts"),
    ])
      .then(([w, p]) => {
        setWallets(w)
        setPayouts(p)
      })
      .catch((err) => {
        toast.add({ title: "Failed to load wallet data", description: getApiError(err), type: "error" })
      })
      .finally(() => setLoading(false))
  }, [])

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

  const filteredWallets = React.useMemo(() => {
    if (!search) return wallets
    const term = search.toLowerCase()
    return wallets.filter((w) => w.seller_id.toLowerCase().includes(term))
  }, [wallets, search])

  const filteredPayouts = React.useMemo(() => {
    if (!search) return payouts
    const term = search.toLowerCase()
    return payouts.filter((p) => p.seller_id.toLowerCase().includes(term) || p.id.toLowerCase().includes(term))
  }, [payouts, search])

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
        <h2 className="text-2xl font-bold tracking-tight">Wallets</h2>
        <p className="text-sm text-muted-foreground">Manage seller wallets and payout requests.</p>
      </div>

      <div className="flex gap-1 rounded-lg border p-1 w-fit">
        <Button variant={tab === "wallets" ? "default" : "ghost"} size="sm" onClick={() => setTab("wallets")}>
          Seller Wallets
        </Button>
        <Button variant={tab === "payouts" ? "default" : "ghost"} size="sm" onClick={() => setTab("payouts")}>
          Payout Requests
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Wallet className="size-4" /> {tab === "wallets" ? "Seller Wallets" : "Payout Requests"}
            </CardTitle>
            <div className="flex gap-2">
              <Input
                placeholder="Search by seller ID..."
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
                  <TableHead>Seller ID</TableHead>
                  <TableHead>Pending</TableHead>
                  <TableHead>Available</TableHead>
                  <TableHead>Reserved</TableHead>
                  <TableHead>Paid Out</TableHead>
                  <TableHead>Frozen</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredWallets.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">No wallets found.</TableCell>
                  </TableRow>
                ) : (
                  filteredWallets.map((w) => (
                    <TableRow key={w.id}>
                      <TableCell className="font-mono text-xs">{w.seller_id.slice(0, 8)}</TableCell>
                      <TableCell>{formatPrice(Number(w.pending_balance))}</TableCell>
                      <TableCell className="font-medium">{formatPrice(Number(w.available_balance))}</TableCell>
                      <TableCell>{formatPrice(Number(w.reserved_balance))}</TableCell>
                      <TableCell>{formatPrice(Number(w.paid_out_balance))}</TableCell>
                      <TableCell>
                        <Badge variant={w.is_frozen ? "destructive" : "outline"}>
                          {w.is_frozen ? "Frozen" : "Active"}
                        </Badge>
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
                        <Button variant="ghost" size="icon-sm" title="Manage" onClick={() => { setEditPayout(p); setNewStatus(p.status); setAdminNote(p.admin_note ?? ""); setProviderRef(p.provider_reference ?? "") }}>
                          <Pencil className="size-4" />
                        </Button>
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
    </div>
  )
}
