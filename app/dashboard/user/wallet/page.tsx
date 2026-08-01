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
  Plus,
  Search,
  Gift,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react"

type TxType = "credit" | "debit"
type TxStatus = "completed" | "pending" | "failed"

type Transaction = {
  id: string
  type: TxType
  description: string
  amount: number
  status: TxStatus
  reference: string
  created_at: string
}

const mockTransactions: Transaction[] = [
  { id: "1", type: "credit", description: "Cashback from order #ORD-3918", amount: 1200, status: "completed", reference: "CB-001", created_at: "2025-07-28 10:30" },
  { id: "2", type: "debit", description: "Used for order #ORD-3921", amount: 5000, status: "completed", reference: "WP-001", created_at: "2025-08-01 14:35" },
  { id: "3", type: "credit", description: "Top-up via M-Pesa", amount: 50000, status: "completed", reference: "TP-001", created_at: "2025-07-25 09:00" },
  { id: "4", type: "credit", description: "Cashback from order #ORD-3905", amount: 650, status: "completed", reference: "CB-002", created_at: "2025-07-20 11:10" },
  { id: "5", type: "debit", description: "Used for order #ORD-3915", amount: 3000, status: "pending", reference: "WP-002", created_at: "2025-08-01 09:05" },
  { id: "6", type: "credit", description: "Refund from order #ORD-3910", amount: 45000, status: "completed", reference: "RF-001", created_at: "2025-07-25 16:30" },
]

const statusConfig: Record<TxStatus, { label: string; variant: "default" | "secondary" | "destructive" }> = {
  completed: { label: "Completed", variant: "default" },
  pending: { label: "Pending", variant: "secondary" },
  failed: { label: "Failed", variant: "destructive" },
}

function formatPrice(price: number): string {
  return `TSh ${price.toLocaleString()}`
}

export default function UserWalletPage() {
  const [transactions, setTransactions] = React.useState<Transaction[]>(mockTransactions)
  const [search, setSearch] = React.useState("")
  const [txFilter, setTxFilter] = React.useState<"all" | "credit" | "debit">("all")
  const [topupOpen, setTopupOpen] = React.useState(false)

  const balance = React.useMemo(() => {
    const credits = transactions.filter((t) => t.type === "credit" && t.status === "completed").reduce((s, t) => s + t.amount, 0)
    const debits = transactions.filter((t) => t.type === "debit" && t.status === "completed").reduce((s, t) => s + t.amount, 0)
    return credits - debits
  }, [transactions])

  const totalCashback = React.useMemo(() => {
    return transactions.filter((t) => t.description.includes("Cashback") && t.status === "completed").reduce((s, t) => s + t.amount, 0)
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

  const handleTopup = (amount: number, method: string) => {
    const newTx: Transaction = {
      id: crypto.randomUUID(),
      type: "credit",
      description: `Top-up via ${method}`,
      amount,
      status: "completed",
      reference: `TP-${String(transactions.length + 1).padStart(3, "0")}`,
      created_at: new Date().toISOString().split("T")[0] + " " + new Date().toTimeString().slice(0, 5),
    }
    setTransactions((prev) => [newTx, ...prev])
    setTopupOpen(false)
    toast.add({ title: "Top-up successful!", description: `${formatPrice(amount)} added to your wallet via ${method}.`, type: "success" })
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">My Wallet</h2>
        <p className="text-sm text-muted-foreground">Manage your wallet balance, top-up, and track cashback rewards.</p>
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
            <TopupForm balance={balance} onSubmit={handleTopup} />
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
                    <TableCell><Badge variant={statusConfig[tx.status].variant}>{statusConfig[tx.status].label}</Badge></TableCell>
                    <TableCell className="text-muted-foreground text-xs">{tx.created_at}</TableCell>
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
}: {
  balance: number
  onSubmit: (amount: number, method: string) => void
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
        <Button type="submit"><Plus className="size-4" /> Top Up</Button>
      </DialogFooter>
    </form>
  )
}
