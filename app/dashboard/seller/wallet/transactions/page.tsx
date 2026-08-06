"use client"

import * as React from "react"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
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
  TrendingUp,
  TrendingDown,
  Search,
  ArrowUpDown,
} from "lucide-react"
import { api, type ApiError } from "@/lib/api"
import { StatsCardSkeleton, TableSkeleton, PageSkeleton } from "@/components/skeletons"
import { Skeleton } from "@/components/ui/skeleton"

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

const creditTypes = ["sale_credit", "funds_release", "adjustment", "refund_credit"]

const txTypeConfig: Record<string, { label: string; color: string }> = {
  sale_credit: { label: "Sale Credit", color: "text-green-600" },
  funds_release: { label: "Funds Released", color: "text-green-600" },
  payout_hold: { label: "Payout Hold", color: "text-blue-600" },
  payout_completed: { label: "Payout Completed", color: "text-purple-600" },
  payout_released: { label: "Payout Released", color: "text-blue-600" },
  refund_debit: { label: "Refund Debit", color: "text-red-500" },
  refund_credit: { label: "Refund Credit", color: "text-green-600" },
  adjustment: { label: "Adjustment", color: "text-muted-foreground" },
}

function formatPrice(price: number): string {
  return `TSh ${Number(price).toLocaleString()}`
}

function getApiError(err: unknown): string {
  const e = err as ApiError
  return e?.detail || "Something went wrong. Please try again."
}

export default function SellerTransactionsPage() {
  const [transactions, setTransactions] = React.useState<WalletTransaction[]>([])
  const [loading, setLoading] = React.useState(true)
  const [search, setSearch] = React.useState("")
  const [txFilter, setTxFilter] = React.useState<"all" | "credit" | "debit">("all")
  const [sortBy, setSortBy] = React.useState<"date" | "amount">("date")
  const [sortOrder, setSortOrder] = React.useState<"asc" | "desc">("desc")

  React.useEffect(() => {
    api.get<WalletTransaction[]>("/wallet/me/transactions")
      .then(setTransactions)
      .finally(() => setLoading(false))
  }, [])

  const filteredTx = React.useMemo(() => {
    let result = transactions
    if (search) {
      const term = search.toLowerCase()
      result = result.filter((t) =>
        (t.description ?? "").toLowerCase().includes(term) ||
        t.reference.toLowerCase().includes(term) ||
        t.transaction_type.toLowerCase().includes(term)
      )
    }
    if (txFilter !== "all") {
      const isCredit = txFilter === "credit"
      result = result.filter((t) => creditTypes.includes(t.transaction_type) === isCredit)
    }
    result = [...result].sort((a, b) => {
      if (sortBy === "amount") {
        const diff = Number(a.amount) - Number(b.amount)
        return sortOrder === "asc" ? diff : -diff
      }
      const dateA = new Date(a.created_at).getTime()
      const dateB = new Date(b.created_at).getTime()
      return sortOrder === "asc" ? dateA - dateB : dateB - dateA
    })
    return result
  }, [transactions, search, txFilter, sortBy, sortOrder])

  const totalIn = transactions.filter((t) => creditTypes.includes(t.transaction_type)).reduce((sum, t) => sum + Number(t.amount), 0)
  const totalOut = transactions.filter((t) => !creditTypes.includes(t.transaction_type)).reduce((sum, t) => sum + Number(t.amount), 0)

  if (loading) {
    return (
      <PageSkeleton>
        <div className="grid gap-4 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => <StatsCardSkeleton key={i} />)}
        </div>
        <Card><TableSkeleton rows={8} cols={5} /></Card>
      </PageSkeleton>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="animate-fade-in-up">
        <h2 className="text-2xl font-bold tracking-tight">Transactions</h2>
        <p className="text-sm text-muted-foreground">Full history of your wallet transactions.</p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="bg-green-500/5 border-green-500/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Credits</CardTitle>
            <TrendingUp className="size-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatPrice(totalIn)}</div>
          </CardContent>
        </Card>
        <Card className="bg-red-500/5 border-red-500/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Debits</CardTitle>
            <TrendingDown className="size-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">{formatPrice(totalOut)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Net Flow</CardTitle>
            <ArrowUpDown className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${totalIn - totalOut >= 0 ? "text-green-600" : "text-red-500"}`}>
              {formatPrice(totalIn - totalOut)}
            </div>
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
                <option value="credit">Credits Only</option>
                <option value="debit">Debits Only</option>
              </select>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as "date" | "amount")}
                className="h-9 rounded-md border border-input bg-background px-3 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="date">Sort by Date</option>
                <option value="amount">Sort by Amount</option>
              </select>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"))}
                title={sortOrder === "asc" ? "Ascending" : "Descending"}
              >
                <ArrowUpDown className="size-4" />
              </Button>
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
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTx.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">No transactions found.</TableCell>
                </TableRow>
              ) : (
                filteredTx.map((tx) => {
                  const isCredit = creditTypes.includes(tx.transaction_type)
                  const cfg = txTypeConfig[tx.transaction_type]
                  return (
                    <TableRow key={tx.id}>
                      <TableCell className="font-medium">{tx.description ?? tx.transaction_type.replace(/_/g, " ")}</TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">{tx.reference}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {isCredit ? (
                            <TrendingUp className="size-3 text-green-600" />
                          ) : (
                            <TrendingDown className="size-3 text-red-500" />
                          )}
                          <span className="text-xs">{cfg?.label ?? tx.transaction_type.replace(/_/g, " ")}</span>
                        </div>
                      </TableCell>
                      <TableCell className={`text-right font-medium ${isCredit ? "text-green-600" : "text-red-500"}`}>
                        {isCredit ? "+" : "-"}{formatPrice(Number(tx.amount))}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-xs">
                        {new Date(tx.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
