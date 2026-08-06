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
import { Input } from "@/components/ui/input"
import { toast } from "@/components/ui/toast"
import {
  ArrowDownToLine,
  Banknote,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
} from "lucide-react"
import { api, type ApiError } from "@/lib/api"
import { StatsCardSkeleton, PageSkeleton } from "@/components/skeletons"
import Link from "next/link"

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

type PayoutAccount = {
  id: string
  seller_id: string
  account_type: string
  provider: string
  account_name: string
  account_number: string
  currency: string
  is_default: boolean
  created_at: string
}

type WalletResponse = {
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
}

const payoutStatusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: React.ReactNode }> = {
  pending: { label: "Pending", variant: "secondary", icon: <Clock className="size-3" /> },
  approved: { label: "Approved", variant: "secondary", icon: <CheckCircle2 className="size-3" /> },
  processing: { label: "Processing", variant: "secondary", icon: <Loader2 className="size-3 animate-spin" /> },
  completed: { label: "Completed", variant: "default", icon: <CheckCircle2 className="size-3" /> },
  cancelled: { label: "Cancelled", variant: "outline", icon: <XCircle className="size-3" /> },
  rejected: { label: "Rejected", variant: "destructive", icon: <XCircle className="size-3" /> },
  failed: { label: "Failed", variant: "destructive", icon: <XCircle className="size-3" /> },
}

function formatPrice(price: number): string {
  return `TSh ${Number(price).toLocaleString()}`
}

function getApiError(err: unknown): string {
  const e = err as ApiError
  return e?.detail || "Something went wrong. Please try again."
}

export default function SellerPayoutsPage() {
  const [payouts, setPayouts] = React.useState<PayoutRequest[]>([])
  const [accounts, setAccounts] = React.useState<PayoutAccount[]>([])
  const [wallet, setWallet] = React.useState<WalletResponse | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [payoutOpen, setPayoutOpen] = React.useState(false)
  const [cancelPayout, setCancelPayout] = React.useState<PayoutRequest | null>(null)
  const [actionLoading, setActionLoading] = React.useState(false)

  React.useEffect(() => {
    Promise.allSettled([
      api.get<PayoutRequest[]>("/wallet/me/payouts"),
      api.get<PayoutAccount[]>("/sellers/payout-accounts"),
      api.get<WalletResponse>("/wallet/me"),
    ]).then(([pyRes, accRes, wRes]) => {
      if (pyRes.status === "fulfilled") setPayouts(pyRes.value)
      if (accRes.status === "fulfilled") setAccounts(accRes.value)
      if (wRes.status === "fulfilled") setWallet(wRes.value)
    }).finally(() => setLoading(false))
  }, [])

  const handleRequestPayout = async (amount: number, accountId: string) => {
    setActionLoading(true)
    try {
      const newPayout = await api.post<PayoutRequest>("/wallet/me/payouts", {
        payout_account_id: accountId,
        amount,
      })
      setPayouts((prev) => [newPayout, ...prev])
      setPayoutOpen(false)
      toast.add({ title: "Payout requested!", description: `${formatPrice(amount)} is being processed.`, type: "success" })
    } catch (err) {
      toast.add({ title: "Failed to request payout", description: getApiError(err), type: "error" })
    } finally {
      setActionLoading(false)
    }
  }

  const handleCancelPayout = async (id: string) => {
    setActionLoading(true)
    try {
      const updated = await api.post<PayoutRequest>(`/wallet/me/payouts/${id}/cancel`, {})
      setPayouts((prev) => prev.map((p) => (p.id === id ? updated : p)))
      setCancelPayout(null)
      toast.add({ title: "Payout cancelled", description: "The payout request has been cancelled.", type: "success" })
    } catch (err) {
      toast.add({ title: "Failed to cancel payout", description: getApiError(err), type: "error" })
    } finally {
      setActionLoading(false)
    }
  }

  if (loading) {
    return (
      <PageSkeleton>
        <div className="grid gap-4 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => <StatsCardSkeleton key={i} />)}
        </div>
        <StatsCardSkeleton />
      </PageSkeleton>
    )
  }

  const totalRequested = payouts.reduce((sum, p) => sum + Number(p.amount), 0)
  const totalCompleted = payouts.filter((p) => p.status === "completed").reduce((sum, p) => sum + Number(p.amount), 0)
  const totalPending = payouts.filter((p) => p.status === "pending" || p.status === "approved" || p.status === "processing").reduce((sum, p) => sum + Number(p.amount), 0)

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div className="animate-fade-in-up">
          <h2 className="text-2xl font-bold tracking-tight">Payouts</h2>
          <p className="text-sm text-muted-foreground">Request and track your payout history.</p>
        </div>
        <Dialog open={payoutOpen} onOpenChange={setPayoutOpen}>
          <DialogTrigger render={<Button disabled={accounts.length === 0}><ArrowDownToLine className="size-4" /> Request Payout</Button>} />
          <DialogContent className="sm:max-w-[440px]">
            <PayoutForm accounts={accounts} balance={wallet?.available_balance ?? 0} onSubmit={handleRequestPayout} actionLoading={actionLoading} />
          </DialogContent>
        </Dialog>
      </div>

      {accounts.length === 0 && (
        <Card className="border-amber-500/30 bg-amber-500/5">
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-amber-700">
                You need a payout account before requesting a payout.
              </p>
              <Link href="/dashboard/seller/wallet/accounts" className="text-sm font-medium text-amber-700 underline">
                Add Account →
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="bg-primary text-primary-foreground">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-primary-foreground/80">Available Balance</CardTitle>
            <Banknote className="size-4 text-primary-foreground/80" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatPrice(wallet?.available_balance ?? 0)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending Payouts</CardTitle>
            <Clock className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatPrice(totalPending)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Completed Payouts</CardTitle>
            <CheckCircle2 className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatPrice(totalCompleted)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Payouts List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Payout History ({payouts.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {payouts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Banknote className="size-12 text-muted-foreground" />
              <p className="mt-4 text-sm text-muted-foreground">No payouts yet. Request your first payout to get started.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {payouts.map((payout) => {
                const cfg = payoutStatusConfig[payout.status] ?? { label: payout.status, variant: "outline" as const, icon: null }
                return (
                  <div key={payout.id} className="flex items-center gap-4 rounded-lg border p-4">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-muted">
                      <Banknote className="size-5 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{formatPrice(payout.amount)}</span>
                        <Badge variant={cfg.variant} className="text-xs">
                          {cfg.icon}
                          {cfg.label}
                        </Badge>
                      </div>
                      <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                        <span>{new Date(payout.requested_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</span>
                        {payout.completed_at && (
                          <span className="text-green-600">Completed: {new Date(payout.completed_at).toLocaleDateString()}</span>
                        )}
                        {payout.seller_note && <span className="truncate">"{payout.seller_note}"</span>}
                      </div>
                      {payout.admin_note && (
                        <div className="mt-2 rounded bg-muted px-2 py-1 text-xs text-muted-foreground">
                          <strong>Admin note:</strong> {payout.admin_note}
                        </div>
                      )}
                    </div>
                    {payout.status === "pending" && (
                      <Button variant="ghost" size="sm" disabled={actionLoading} onClick={() => setCancelPayout(payout)} className="text-red-500">
                        Cancel
                      </Button>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Cancel Payout Dialog */}
      <Dialog open={!!cancelPayout} onOpenChange={(open) => !open && setCancelPayout(null)}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle>Cancel Payout?</DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel the payout of <strong>{cancelPayout && formatPrice(cancelPayout.amount)}</strong>? The funds will be returned to your available balance.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>Keep Payout</DialogClose>
            <Button variant="destructive" disabled={actionLoading} onClick={() => cancelPayout && handleCancelPayout(cancelPayout.id)}>
              Cancel Payout
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function PayoutForm({
  accounts,
  balance,
  onSubmit,
  actionLoading,
}: {
  accounts: PayoutAccount[]
  balance: number
  onSubmit: (amount: number, accountId: string) => void
  actionLoading: boolean
}) {
  const [amount, setAmount] = React.useState("")
  const [accountId, setAccountId] = React.useState(accounts[0]?.id ?? "")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const n = parseFloat(amount)
    if (!n || n <= 0 || n > balance || !accountId) return
    onSubmit(n, accountId)
  }

  return (
    <form onSubmit={handleSubmit}>
      <DialogHeader>
        <DialogTitle>Request Payout</DialogTitle>
        <DialogDescription>
          Available balance: {formatPrice(balance)}. Funds will be transferred within 1-2 business days.
        </DialogDescription>
      </DialogHeader>
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="amount">Amount (TSh)</FieldLabel>
          <Input id="amount" type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="e.g. 100000" required min="1" max={balance} disabled={actionLoading} />
          <FieldDescription>Maximum: {formatPrice(balance)}</FieldDescription>
        </Field>
        <Field>
          <FieldLabel htmlFor="account">Payout Account</FieldLabel>
          <select id="account" value={accountId} onChange={(e) => setAccountId(e.target.value)} disabled={actionLoading} className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50">
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>{a.provider} — {a.account_number.slice(-4)}</option>
            ))}
          </select>
        </Field>
      </FieldGroup>
      <DialogFooter>
        <DialogClose render={<Button variant="outline" disabled={actionLoading} />}>Cancel</DialogClose>
        <Button type="submit" disabled={actionLoading}>
          {actionLoading ? <Loader2 className="size-4 animate-spin" /> : <ArrowDownToLine className="size-4" />}
          Request Payout
        </Button>
      </DialogFooter>
    </form>
  )
}
