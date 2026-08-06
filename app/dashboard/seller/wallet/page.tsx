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
  Wallet,
  TrendingUp,
  TrendingDown,
  ArrowDownToLine,
  Plus,
  Trash2,
  Search,
  Banknote,
  Clock,
  CheckCircle2,
  XCircle,
  CreditCard,
} from "lucide-react"
import { api, type ApiError } from "@/lib/api"
import { StatsCardSkeleton, TableSkeleton, PageSkeleton } from "@/components/skeletons"

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
  created_at: string
  updated_at: string | null
}

type WalletTransaction = {
  id: string
  transaction_type: string
  amount: number
  currency: string
  reference: string
  order_id: string | null
  eligible_at: string | null
  released_at: string | null
  description: string | null
  created_at: string
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

const payoutStatusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  pending: { label: "Pending", variant: "secondary" },
  approved: { label: "Approved", variant: "secondary" },
  processing: { label: "Processing", variant: "secondary" },
  completed: { label: "Completed", variant: "default" },
  cancelled: { label: "Cancelled", variant: "outline" },
  rejected: { label: "Rejected", variant: "destructive" },
  failed: { label: "Failed", variant: "destructive" },
}

const creditTypes = ["sale_credit", "funds_release", "adjustment", "refund_credit"]

function formatPrice(price: number): string {
  return `TSh ${Number(price).toLocaleString()}`
}

function getApiError(err: unknown): string {
  const e = err as ApiError
  return e?.detail || "Something went wrong. Please try again."
}

export default function SellerWalletPage() {
  const [wallet, setWallet] = React.useState<WalletResponse | null>(null)
  const [transactions, setTransactions] = React.useState<WalletTransaction[]>([])
  const [payouts, setPayouts] = React.useState<PayoutRequest[]>([])
  const [accounts, setAccounts] = React.useState<PayoutAccount[]>([])
  const [loading, setLoading] = React.useState(true)
  const [search, setSearch] = React.useState("")
  const [txFilter, setTxFilter] = React.useState<"all" | "credit" | "debit">("all")
  const [payoutOpen, setPayoutOpen] = React.useState(false)
  const [accountOpen, setAccountOpen] = React.useState(false)
  const [deleteAccount, setDeleteAccount] = React.useState<PayoutAccount | null>(null)
  const [cancelPayout, setCancelPayout] = React.useState<PayoutRequest | null>(null)
  const [actionLoading, setActionLoading] = React.useState(false)

  React.useEffect(() => {
    Promise.allSettled([
      api.get<WalletResponse>("/wallet/me"),
      api.get<WalletTransaction[]>("/wallet/me/transactions"),
      api.get<PayoutRequest[]>("/wallet/me/payouts"),
      api.get<PayoutAccount[]>("/sellers/payout-accounts"),
    ])
      .then(([wRes, txRes, pyRes, accRes]) => {
        if (wRes.status === "fulfilled") setWallet(wRes.value)
        if (txRes.status === "fulfilled") setTransactions(txRes.value)
        if (pyRes.status === "fulfilled") setPayouts(pyRes.value)
        if (accRes.status === "fulfilled") setAccounts(accRes.value)
      })
      .finally(() => setLoading(false))
  }, [])

  const filteredTx = React.useMemo(() => {
    let result = transactions
    if (search) {
      const term = search.toLowerCase()
      result = result.filter((t) => (t.description ?? "").toLowerCase().includes(term) || t.reference.toLowerCase().includes(term))
    }
    if (txFilter !== "all") {
      const isCredit = txFilter === "credit"
      result = result.filter((t) => creditTypes.includes(t.transaction_type) === isCredit)
    }
    return result
  }, [transactions, search, txFilter])

  const handleRequestPayout = async (amount: number, accountId: string) => {
    setActionLoading(true)
    try {
      const newPayout = await api.post<PayoutRequest>("/wallet/me/payouts", {
        payout_account_id: accountId,
        amount,
      })
      setPayouts((prev) => [newPayout, ...prev])
      setPayoutOpen(false)
      toast.add({
        title: "Payout requested!",
        description: `${formatPrice(amount)} is being processed.`,
        type: "success",
      })
    } catch (err) {
      toast.add({
        title: "Failed to request payout",
        description: getApiError(err),
        type: "error",
      })
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
      toast.add({
        title: "Failed to cancel payout",
        description: getApiError(err),
        type: "error",
      })
    } finally {
      setActionLoading(false)
    }
  }

  const handleAddAccount = async (data: { account_type: string; provider: string; account_name: string; account_number: string; is_default: boolean }) => {
    setActionLoading(true)
    try {
      const newAccount = await api.post<PayoutAccount>("/sellers/payout-accounts", {
        account_type: data.account_type,
        provider: data.provider,
        account_name: data.account_name,
        account_number: data.account_number,
        currency: "TZS",
        is_default: data.is_default,
      })
      setAccounts((prev) => [...prev, newAccount])
      setAccountOpen(false)
      toast.add({ title: "Account added!", description: `${data.provider} account has been added.`, type: "success" })
    } catch (err) {
      toast.add({
        title: "Failed to add account",
        description: getApiError(err),
        type: "error",
      })
    } finally {
      setActionLoading(false)
    }
  }

  const handleDeleteAccount = async (id: string) => {
    setActionLoading(true)
    try {
      await api.delete(`/sellers/payout-accounts/${id}`)
      setAccounts((prev) => prev.filter((a) => a.id !== id))
      setDeleteAccount(null)
      toast.add({ title: "Account deleted", description: "Payout account has been removed.", type: "success" })
    } catch (err) {
      toast.add({
        title: "Failed to delete account",
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
        <div className="grid gap-4 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => <StatsCardSkeleton key={i} />)}
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <StatsCardSkeleton />
          <StatsCardSkeleton />
        </div>
        <Card><TableSkeleton rows={5} cols={6} /></Card>
      </PageSkeleton>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Wallet & Payouts</h2>
        <p className="text-sm text-muted-foreground">Track earnings, request payouts, and manage payout accounts.</p>
      </div>

      {/* Balance Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="bg-primary text-primary-foreground">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-primary-foreground/80">Available Balance</CardTitle>
            <Wallet className="size-4 text-primary-foreground/80" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{formatPrice(wallet?.available_balance ?? 0)}</div>
            <p className="mt-1 text-xs text-primary-foreground/70">Ready for payout</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending Balance</CardTitle>
            <Clock className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{formatPrice(wallet?.pending_balance ?? 0)}</div>
            <p className="mt-1 text-xs text-muted-foreground">Awaiting clearance</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Paid Out</CardTitle>
            <TrendingUp className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{formatPrice(wallet?.paid_out_balance ?? 0)}</div>
            <p className="mt-1 text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>
      </div>

      {/* Payouts Section */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Payouts */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Recent Payouts</CardTitle>
              <Dialog open={payoutOpen} onOpenChange={setPayoutOpen}>
                <DialogTrigger render={<Button size="sm"><ArrowDownToLine className="size-4" /> Request Payout</Button>} />
                <DialogContent className="sm:max-w-[440px]">
                  <PayoutForm accounts={accounts} balance={wallet?.available_balance ?? 0} onSubmit={handleRequestPayout} />
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            {payouts.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">No payouts yet.</p>
            ) : (
              <div className="flex flex-col gap-3">
                {payouts.map((payout) => (
                  <div key={payout.id} className="flex items-center gap-3 rounded-lg border p-3">
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-muted">
                      <Banknote className="size-4 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{formatPrice(payout.amount)}</span>
                        <Badge variant={payoutStatusConfig[payout.status]?.variant ?? "outline"} className="text-xs">
                          {payoutStatusConfig[payout.status]?.label ?? payout.status}
                        </Badge>
                      </div>
                      <div className="mt-0.5 text-xs text-muted-foreground">
                        {new Date(payout.requested_at).toLocaleDateString()}
                      </div>
                    </div>
                    {(payout.status === "pending") && (
                      <Button variant="ghost" size="sm" disabled={actionLoading} onClick={() => setCancelPayout(payout)} className="text-red-500">
                        Cancel
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Payout Accounts */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Payout Accounts</CardTitle>
              <Dialog open={accountOpen} onOpenChange={setAccountOpen}>
                <DialogTrigger render={<Button size="sm" variant="outline"><Plus className="size-4" /> Add Account</Button>} />
                <DialogContent className="sm:max-w-[480px]">
                  <AccountForm onSubmit={handleAddAccount} />
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            {accounts.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">No payout accounts. Add one to request payouts.</p>
            ) : (
              <div className="flex flex-col gap-3">
                {accounts.map((account) => (
                  <div key={account.id} className="flex items-center gap-3 rounded-lg border p-3">
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-muted">
                      <CreditCard className="size-4 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{account.provider}</span>
                        {account.is_default && <Badge variant="outline" className="text-xs">Default</Badge>}
                      </div>
                      <div className="mt-0.5 text-xs text-muted-foreground">
                        {account.account_type} · {account.account_number}
                      </div>
                    </div>
                    <Button variant="ghost" size="icon-sm" disabled={actionLoading} onClick={() => setDeleteAccount(account)} className="text-red-500">
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Transactions Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-1 gap-2">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input placeholder="Search transactions..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
              </div>
              <select
                value={txFilter}
                onChange={(e) => setTxFilter(e.target.value as "all" | "credit" | "debit")}
                className="h-9 rounded-md border border-input bg-background px-3 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="all">All Types</option>
                <option value="credit">Credits</option>
                <option value="debit">Debits</option>
              </select>
            </div>
            <div className="text-sm text-muted-foreground">{filteredTx.length} transactions</div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Description</TableHead>
                <TableHead>Reference</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTx.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">No transactions found.</TableCell>
                </TableRow>
              ) : (
                filteredTx.map((tx) => {
                  const isCredit = creditTypes.includes(tx.transaction_type)
                  return (
                  <TableRow key={tx.id}>
                    <TableCell className="font-medium">{tx.description ?? tx.transaction_type}</TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">{tx.reference}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {isCredit ? (
                          <TrendingUp className="size-3 text-green-600" />
                        ) : (
                          <TrendingDown className="size-3 text-red-500" />
                        )}
                        <span className="text-xs capitalize">{tx.transaction_type.replace(/_/g, " ")}</span>
                      </div>
                    </TableCell>
                    <TableCell className={isCredit ? "text-green-600 font-medium" : "text-red-500 font-medium"}>
                      {isCredit ? "+" : "-"}{formatPrice(Number(tx.amount))}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">Settled</Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs">{new Date(tx.created_at).toLocaleDateString()}</TableCell>
                  </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
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

      {/* Delete Account Dialog */}
      <Dialog open={!!deleteAccount} onOpenChange={(open) => !open && setDeleteAccount(null)}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle>Delete Account?</DialogTitle>
            <DialogDescription>
              Remove <strong>{deleteAccount?.provider}</strong> ({deleteAccount?.account_number})? This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>
            <Button variant="destructive" disabled={actionLoading} onClick={() => deleteAccount && handleDeleteAccount(deleteAccount.id)}>
              <Trash2 className="size-4" /> Delete
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
}: {
  accounts: PayoutAccount[]
  balance: number
  onSubmit: (amount: number, accountId: string) => void
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
          <Input id="amount" type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="e.g. 100000" required min="1" max={balance} />
          <FieldDescription>Maximum: {formatPrice(balance)}</FieldDescription>
        </Field>
        <Field>
          <FieldLabel htmlFor="account">Payout Account</FieldLabel>
          <select id="account" value={accountId} onChange={(e) => setAccountId(e.target.value)} className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring">
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>{a.provider} — {a.account_number.slice(-4)}</option>
            ))}
          </select>
        </Field>
      </FieldGroup>
      <DialogFooter>
        <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>
        <Button type="submit"><ArrowDownToLine className="size-4" /> Request Payout</Button>
      </DialogFooter>
    </form>
  )
}

function AccountForm({
  onSubmit,
}: {
  onSubmit: (data: { account_type: string; provider: string; account_name: string; account_number: string; is_default: boolean }) => void
}) {
  const [accountType, setAccountType] = React.useState("bank")
  const [provider, setProvider] = React.useState("")
  const [accountName, setAccountName] = React.useState("")
  const [accountNumber, setAccountNumber] = React.useState("")
  const [isDefault, setIsDefault] = React.useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!provider.trim() || !accountName.trim() || !accountNumber.trim()) return
    onSubmit({ account_type: accountType, provider: provider.trim(), account_name: accountName.trim(), account_number: accountNumber.trim(), is_default: isDefault })
  }

  return (
    <form onSubmit={handleSubmit}>
      <DialogHeader>
        <DialogTitle>Add Payout Account</DialogTitle>
        <DialogDescription>Enter your bank account details for receiving payouts.</DialogDescription>
      </DialogHeader>
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="accountType">Account Type</FieldLabel>
          <select id="accountType" value={accountType} onChange={(e) => setAccountType(e.target.value)} className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring">
            <option value="bank">Bank Account</option>
            <option value="mobile">Mobile Money</option>
          </select>
        </Field>
        <Field>
          <FieldLabel htmlFor="provider">Provider / Bank Name</FieldLabel>
          <Input id="provider" value={provider} onChange={(e) => setProvider(e.target.value)} placeholder="e.g. CRDB Bank" required />
        </Field>
        <Field>
          <FieldLabel htmlFor="accountName">Account Holder Name</FieldLabel>
          <Input id="accountName" value={accountName} onChange={(e) => setAccountName(e.target.value)} placeholder="e.g. Acme Trading Co." required />
        </Field>
        <Field>
          <FieldLabel htmlFor="accountNumber">Account Number</FieldLabel>
          <Input id="accountNumber" value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} placeholder="0150-1234-5678" required className="font-mono" />
        </Field>
        <Field>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={isDefault} onChange={(e) => setIsDefault(e.target.checked)} className="size-4 rounded border-input" />
            Set as default payout account
          </label>
        </Field>
      </FieldGroup>
      <DialogFooter>
        <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>
        <Button type="submit"><Plus className="size-4" /> Add Account</Button>
      </DialogFooter>
    </form>
  )
}
