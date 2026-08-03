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
import { api, type ApiError } from "@/lib/api"
import { Skeleton } from "@/components/ui/skeleton"
import { PageSkeleton } from "@/components/skeletons"
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  Plus,
  Search,
  Gift,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
} from "lucide-react"

type TxType = "credit" | "debit"
type TxStatus = "completed" | "pending" | "failed"

type WalletData = {
  id: string
  balance: number
  pending_balance: number
  currency: string
}

type Transaction = {
  id: string
  type: TxType
  description: string
  amount: number
  status: TxStatus
  reference: string
  created_at: string
}

const statusConfig: Record<TxStatus, { label: string; variant: "default" | "secondary" | "destructive" }> = {
  completed: { label: "Completed", variant: "default" },
  pending: { label: "Pending", variant: "secondary" },
  failed: { label: "Failed", variant: "destructive" },
}

function formatPrice(price: number): string {
  return `TSh ${price.toLocaleString()}`
}

function getApiError(err: unknown): string {
  const e = err as ApiError
  return e?.detail || "Something went wrong. Please try again."
}

export default function UserWalletPage() {
  const [wallet, setWallet] = React.useState<WalletData | null>(null)
  const [transactions, setTransactions] = React.useState<Transaction[]>([])
  const [loading, setLoading] = React.useState(true)
  const [refreshing, setRefreshing] = React.useState(false)
  const [search, setSearch] = React.useState("")
  const [txFilter, setTxFilter] = React.useState<"all" | "credit" | "debit">("all")
  const [topupOpen, setTopupOpen] = React.useState(false)
  const [topupLoading, setTopupLoading] = React.useState(false)

  const fetchData = React.useCallback(async () => {
    try {
      const [walletData, txData] = await Promise.all([
        api.get<WalletData>("/wallet/me"),
        api.get<Transaction[]>("/wallet/me/transactions"),
      ])
      setWallet(walletData)
      setTransactions(txData)
    } catch (err) {
      toast.add({ title: "Failed to load wallet", description: getApiError(err), type: "error" })
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  React.useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleRefresh = () => {
    setRefreshing(true)
    fetchData()
  }

  const balance = wallet?.balance ?? 0

  const totalCashback = React.useMemo(() => {
    return transactions.filter((t) => t.description?.toLowerCase().includes("cashback") && t.status === "completed").reduce((s, t) => s + t.amount, 0)
  }, [transactions])

  const filteredTx = React.useMemo(() => {
    let result = transactions
    if (search) {
      const term = search.toLowerCase()
      result = result.filter((t) => t.description.toLowerCase().includes(term) || t.reference.toLowerCase().includes(term))
    }
    if (txFilter !== "all") {
      result = result.filter((t) => t.type === txFilter)
    }
    return result
  }, [transactions, search, txFilter])

  const handleTopup = async (amount: number, method: string) => {
    setTopupLoading(true)
    try {
      await api.post("/payments/initiate", {
        amount,
        currency: "TZS",
        provider: method,
        payment_type: "wallet_topup",
      })
      setTopupOpen(false)
      toast.add({ title: "Top-up initiated!", description: `${formatPrice(amount)} top-up via ${method} is being processed.`, type: "success" })
      fetchData()
    } catch (err) {
      toast.add({ title: "Top-up failed", description: getApiError(err), type: "error" })
    } finally {
      setTopupLoading(false)
    }
  }

  if (loading) {
    return (
      <PageSkeleton>
        <div className="grid gap-4 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="size-4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-28" />
                <Skeleton className="mt-2 h-3 w-20" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Skeleton className="h-96 w-full" />
      </PageSkeleton>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">My Wallet</h2>
          <p className="text-sm text-muted-foreground">Manage your wallet balance, top-up, and track cashback rewards.</p>
        </div>
        <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing}>
          <RefreshCw className={`size-4 ${refreshing ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Balance Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="bg-primary text-primary-foreground">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-primary-foreground/80">Wallet Balance</CardTitle>
            <Wallet className="size-4 text-primary-foreground/80" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{formatPrice(balance)}</div>
            <p className="mt-1 text-xs text-primary-foreground/70">Available to spend</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Cashback</CardTitle>
            <Gift className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{formatPrice(totalCashback)}</div>
            <p className="mt-1 text-xs text-muted-foreground">Earned from orders</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{transactions.length}</div>
            <p className="mt-1 text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>
      </div>

      {/* Top-up Button */}
      <div className="flex justify-end">
        <Dialog open={topupOpen} onOpenChange={setTopupOpen}>
          <DialogTrigger render={<Button><Plus className="size-4" /> Top Up Wallet</Button>} />
          <DialogContent className="sm:max-w-[440px]">
            <TopupForm balance={balance} onSubmit={handleTopup} loading={topupLoading} />
          </DialogContent>
        </Dialog>
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
              <select value={txFilter} onChange={(e) => setTxFilter(e.target.value as "all" | "credit" | "debit")} className="h-9 rounded-md border border-input bg-background px-3 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring">
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
                <TableRow><TableCell colSpan={6} className="h-24 text-center text-muted-foreground">No transactions found.</TableCell></TableRow>
              ) : (
                filteredTx.map((tx) => (
                  <TableRow key={tx.id}>
                    <TableCell className="font-medium">{tx.description}</TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">{tx.reference}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {tx.type === "credit" ? <ArrowDownRight className="size-3 text-green-600" /> : <ArrowUpRight className="size-3 text-red-500" />}
                        <span className="text-xs capitalize">{tx.type}</span>
                      </div>
                    </TableCell>
                    <TableCell className={tx.type === "credit" ? "text-green-600 font-medium" : "text-red-500 font-medium"}>
                      {tx.type === "credit" ? "+" : "-"}{formatPrice(tx.amount)}
                    </TableCell>
                    <TableCell><Badge variant={statusConfig[tx.status]?.variant ?? "outline"}>{statusConfig[tx.status]?.label ?? tx.status}</Badge></TableCell>
                    <TableCell className="text-muted-foreground text-xs">{new Date(tx.created_at).toLocaleDateString()}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

function TopupForm({
  balance,
  onSubmit,
  loading,
}: {
  balance: number
  onSubmit: (amount: number, method: string) => void
  loading: boolean
}) {
  const [amount, setAmount] = React.useState("")
  const [method, setMethod] = React.useState("M-Pesa")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const n = parseFloat(amount)
    if (!n || n <= 0) return
    onSubmit(n, method)
  }

  return (
    <form onSubmit={handleSubmit}>
      <DialogHeader>
        <DialogTitle>Top Up Wallet</DialogTitle>
        <DialogDescription>Current balance: {formatPrice(balance)}. Add funds via mobile money.</DialogDescription>
      </DialogHeader>
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="amount">Amount (TSh)</FieldLabel>
          <Input id="amount" type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="e.g. 50000" required min="1" />
          <FieldDescription>Minimum top-up: TSh 1,000</FieldDescription>
        </Field>
        <Field>
          <FieldLabel htmlFor="method">Payment Method</FieldLabel>
          <select id="method" value={method} onChange={(e) => setMethod(e.target.value)} className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring">
            <option value="M-Pesa">M-Pesa</option>
            <option value="Tigo Pesa">Tigo Pesa</option>
            <option value="Airtel Money">Airtel Money</option>
            <option value="Halopesa">Halopesa</option>
          </select>
        </Field>
      </FieldGroup>
      <DialogFooter>
        <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>
        <Button type="submit" disabled={loading}>
          {loading ? (
            <><RefreshCw className="size-4 animate-spin" /> Processing...</>
          ) : (
            <><Plus className="size-4" /> Top Up</>
          )}
        </Button>
      </DialogFooter>
    </form>
  )
}
