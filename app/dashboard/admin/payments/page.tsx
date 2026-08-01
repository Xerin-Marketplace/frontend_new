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
  amount: number
  status: string
  provider_transaction_id: string | null
  created_at: string
}

type Payment = {
  id: string
  order_id: string
  user_id: string
  amount: number
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
  initiated: { label: "Initiated", variant: "secondary" },
  completed: { label: "Completed", variant: "default" },
  failed: { label: "Failed", variant: "destructive" },
  cancelled: { label: "Cancelled", variant: "destructive" },
  refunded: { label: "Refunded", variant: "destructive" },
}

function formatPrice(price: number): string {
  return `TSh ${Number(price).toLocaleString()}`
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
  const [viewPayment, setViewPayment] = React.useState<Payment | null>(null)

  React.useEffect(() => {
    api.get<Payment[]>("/payments/admin/all")
      .then(setPayments)
      .catch((err) => {
        toast.add({ title: "Failed to load payments", description: getApiError(err), type: "error" })
      })
      .finally(() => setLoading(false))
  }, [])

  const handleSearch = () => {
    setSearch(searchInput)
  }

  const filteredPayments = React.useMemo(() => {
    if (!search) return payments
    const term = search.toLowerCase()
    return payments.filter(
      (p) => p.id.toLowerCase().includes(term) || p.order_id.toLowerCase().includes(term) || (p.provider ?? "").toLowerCase().includes(term)
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
        <p className="text-sm text-muted-foreground">View all platform payments ({payments.length} total).</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <CreditCard className="size-4" /> All Payments
            </CardTitle>
            <div className="flex gap-2">
              <Input
                placeholder="Search payments..."
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
                <TableHead>Payment ID</TableHead>
                <TableHead>Order ID</TableHead>
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
                  <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">No payments found.</TableCell>
                </TableRow>
              ) : (
                filteredPayments.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-mono text-xs">{p.id.slice(0, 8)}</TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">{p.order_id.slice(0, 8)}</TableCell>
                    <TableCell className="font-medium">{formatPrice(Number(p.amount))}</TableCell>
                    <TableCell>{p.method}</TableCell>
                    <TableCell>{p.provider ?? "—"}</TableCell>
                    <TableCell>
                      <Badge variant={paymentStatusConfig[p.status]?.variant ?? "outline"}>
                        {paymentStatusConfig[p.status]?.label ?? p.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs">{new Date(p.created_at).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon-sm" title="View Details" onClick={() => setViewPayment(p)}>
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

      {/* View Payment Dialog */}
      <Dialog open={!!viewPayment} onOpenChange={(open) => !open && setViewPayment(null)}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Payment Details</DialogTitle>
            <DialogDescription>Payment ID: {viewPayment?.id.slice(0, 8)}</DialogDescription>
          </DialogHeader>
          {viewPayment && (
            <div className="flex flex-col gap-4">
              <div className="grid gap-2 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Order ID:</span> <span className="font-mono text-xs">{viewPayment.order_id.slice(0, 8)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Amount:</span> <span className="font-medium">{formatPrice(Number(viewPayment.amount))}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Currency:</span> {viewPayment.currency}</div>
                <div className="flex justify-between"><span className="text-muted-foreground">Method:</span> {viewPayment.method}</div>
                <div className="flex justify-between"><span className="text-muted-foreground">Provider:</span> {viewPayment.provider ?? "—"}</div>
                <div className="flex justify-between"><span className="text-muted-foreground">Status:</span> <Badge variant={paymentStatusConfig[viewPayment.status]?.variant ?? "outline"}>{viewPayment.status}</Badge></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Provider Transaction ID:</span> <span className="font-mono text-xs">{viewPayment.provider_transaction_id ?? "—"}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Paid At:</span> {viewPayment.paid_at ? new Date(viewPayment.paid_at).toLocaleString() : "—"}</div>
                <div className="flex justify-between"><span className="text-muted-foreground">Created:</span> {new Date(viewPayment.created_at).toLocaleString()}</div>
              </div>

              {viewPayment.transactions.length > 0 && (
                <div>
                  <h4 className="mb-2 text-sm font-medium">Transaction History</h4>
                  <div className="flex flex-col gap-1">
                    {viewPayment.transactions.map((t) => (
                      <div key={t.id} className="flex items-center justify-between rounded-md border p-2 text-xs">
                        <div>
                          <div className="font-medium">{t.transaction_type}</div>
                          <div className="text-muted-foreground">{new Date(t.created_at).toLocaleString()}</div>
                        </div>
                        <Badge variant="outline">{t.status}</Badge>
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
