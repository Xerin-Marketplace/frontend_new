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
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { toast } from "@/components/ui/toast"
import {
  CreditCard,
  Search,
  Eye,
} from "lucide-react"
import { api, type ApiError } from "@/lib/api"
import { PageSkeleton, TableSkeleton } from "@/components/skeletons"

type PaymentTransaction = {
  id: string
  transaction_type: string
  status: string
  amount: string | null
  provider_response: Record<string, unknown> | null
  created_at: string
}

type Payment = {
  id: string
  order_id: string
  user_id: string
  amount: string
  currency: string
  method: string
  provider: string | null
  status: string
  provider_transaction_id: string | null
  paid_at: string | null
  transactions: PaymentTransaction[]
  created_at: string
  updated_at: string | null
}

const paymentStatusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  pending: { label: "Pending", variant: "outline" },
  processing: { label: "Processing", variant: "secondary" },
  completed: { label: "Completed", variant: "default" },
  failed: { label: "Failed", variant: "destructive" },
  cancelled: { label: "Cancelled", variant: "destructive" },
  refunded: { label: "Refunded", variant: "destructive" },
}

function formatPrice(price: string, currency: string): string {
  return `${currency} ${Number(price).toLocaleString()}`
}

function getApiError(err: unknown): string {
  const e = err as ApiError
  return e?.detail || "Something went wrong. Please try again."
}

export default function AdminPaymentsPage() {
  const [payments, setPayments] = React.useState<Payment[]>([])
  const [loading, setLoading] = React.useState(true)
  const [search, setSearch] = React.useState("")
  const [searchInput, setSearchInput] = React.useState("")
  const [status, setStatus] = React.useState("all")
  const [viewPayment, setViewPayment] = React.useState<Payment | null>(null)
  const [detailLoading, setDetailLoading] = React.useState(false)

  React.useEffect(() => {
    const query = status === "all" ? "" : `?payment_status=${status}`
    api.get<Payment[]>(`/payments/admin/all${query}`)
      .then(setPayments)
      .catch((err) => {
        toast.add({ title: "Failed to load payments", description: getApiError(err), type: "error" })
      })
      .finally(() => setLoading(false))
  }, [status])

  const openPayment = async (payment: Payment) => {
    setViewPayment(payment)
    setDetailLoading(true)
    try {
      setViewPayment(await api.get<Payment>(`/payments/${payment.id}`))
    } catch (err) {
      toast.add({ title: "Failed to load payment details", description: getApiError(err), type: "error" })
    } finally {
      setDetailLoading(false)
    }
  }

  const handleSearch = () => {
    setSearch(searchInput)
  }

  const filteredPayments = React.useMemo(() => {
    if (!search) return payments
    const term = search.toLowerCase()
    return payments.filter(
      (payment) =>
        payment.id.toLowerCase().includes(term) ||
        payment.order_id.toLowerCase().includes(term) ||
        payment.user_id.toLowerCase().includes(term) ||
        payment.provider_transaction_id?.toLowerCase().includes(term) ||
        payment.provider?.toLowerCase().includes(term)
    )
  }, [payments, search])

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
        <h2 className="text-2xl font-bold tracking-tight">Payments</h2>
        <p className="text-sm text-muted-foreground">View and reconcile payment transactions ({payments.length} total).</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <CreditCard className="size-4" /> All Payments
            </CardTitle>
            <div className="flex gap-2">
              <Input
                placeholder="Search payment, order or provider..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                className="w-64"
              />
              <Button variant="outline" size="sm" onClick={handleSearch}>
                <Search className="size-4" />
              </Button>
              <select
                value={status}
                onChange={(event) => {
                  setLoading(true)
                  setStatus(event.target.value)
                }}
                className="h-8 rounded-md border bg-background px-3 text-sm"
                aria-label="Filter payment status"
              >
                <option value="all">All statuses</option>
                {Object.entries(paymentStatusConfig).map(([value, config]) => (
                  <option key={value} value={value}>{config.label}</option>
                ))}
              </select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Reference</TableHead>
                <TableHead>Order</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Method</TableHead>
                <TableHead>Provider</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPayments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">No payment transactions found.</TableCell>
                </TableRow>
              ) : (
                filteredPayments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell className="font-mono text-xs">{payment.id.slice(0, 8)}</TableCell>
                    <TableCell className="font-mono text-xs">{payment.order_id.slice(0, 8)}</TableCell>
                    <TableCell className="font-medium">{formatPrice(payment.amount, payment.currency)}</TableCell>
                    <TableCell>{payment.method.replaceAll("_", " ")}</TableCell>
                    <TableCell>{payment.provider ?? "—"}</TableCell>
                    <TableCell>
                      <Badge variant={paymentStatusConfig[payment.status]?.variant ?? "outline"}>
                        {paymentStatusConfig[payment.status]?.label ?? payment.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs">{new Date(payment.created_at).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon-sm" title="View Details" onClick={() => void openPayment(payment)}>
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

      <Dialog open={!!viewPayment} onOpenChange={(open) => !open && setViewPayment(null)}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Payment Details</DialogTitle>
            <DialogDescription>Reference: {viewPayment?.id}</DialogDescription>
          </DialogHeader>
          {viewPayment && (
            <div className="flex flex-col gap-4">
              {detailLoading && <p className="text-sm text-muted-foreground">Refreshing payment details...</p>}
              <div className="grid gap-2 text-sm">
                <div className="flex justify-between gap-4"><span className="text-muted-foreground">Order:</span> <span className="font-mono text-xs">{viewPayment.order_id}</span></div>
                <div className="flex justify-between gap-4"><span className="text-muted-foreground">Customer:</span> <span className="font-mono text-xs">{viewPayment.user_id}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Amount:</span> <span className="font-medium">{formatPrice(viewPayment.amount, viewPayment.currency)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Method:</span> {viewPayment.method.replaceAll("_", " ")}</div>
                <div className="flex justify-between"><span className="text-muted-foreground">Provider:</span> {viewPayment.provider ?? "—"}</div>
                <div className="flex justify-between gap-4"><span className="text-muted-foreground">Provider reference:</span> <span className="break-all text-right font-mono text-xs">{viewPayment.provider_transaction_id ?? "—"}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Status:</span> <Badge variant={paymentStatusConfig[viewPayment.status]?.variant ?? "outline"}>{viewPayment.status}</Badge></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Paid:</span> {viewPayment.paid_at ? new Date(viewPayment.paid_at).toLocaleString() : "—"}</div>
                <div className="flex justify-between"><span className="text-muted-foreground">Created:</span> {new Date(viewPayment.created_at).toLocaleString()}</div>
              </div>

              {viewPayment.transactions.length > 0 && (
                <div>
                  <h4 className="mb-2 text-sm font-medium">Provider Transactions</h4>
                  <div className="flex flex-col gap-1">
                    {viewPayment.transactions.map((transaction) => (
                      <div key={transaction.id} className="flex items-center justify-between rounded-md border p-2 text-xs">
                        <div>
                          <div className="font-medium">{transaction.transaction_type.replaceAll("_", " ")}</div>
                          <div className="text-muted-foreground">{new Date(transaction.created_at).toLocaleString()}</div>
                        </div>
                        <Badge variant={transaction.status === "failed" ? "destructive" : "outline"}>{transaction.status}</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
