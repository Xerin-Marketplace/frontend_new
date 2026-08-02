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

type Order = {
  id: string
  order_number: string
  user_id: string
  status: string
  total_amount: number
  currency: string
  payment_method: string | null
  payment_status: string | null
  created_at: string
  items: { id: string; product_name: string; quantity: number; unit_price: number; total_price: number }[]
}

const paymentStatusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  pending: { label: "Pending", variant: "outline" },
  initiated: { label: "Initiated", variant: "secondary" },
  completed: { label: "Completed", variant: "default" },
  paid: { label: "Paid", variant: "default" },
  failed: { label: "Failed", variant: "destructive" },
  cancelled: { label: "Cancelled", variant: "destructive" },
  refunded: { label: "Refunded", variant: "destructive" },
  unpaid: { label: "Unpaid", variant: "outline" },
}

const orderStatusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  pending: { label: "Pending", variant: "outline" },
  confirmed: { label: "Confirmed", variant: "secondary" },
  processing: { label: "Processing", variant: "secondary" },
  shipped: { label: "Shipped", variant: "secondary" },
  delivered: { label: "Delivered", variant: "default" },
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
  const [orders, setOrders] = React.useState<Order[]>([])
  const [loading, setLoading] = React.useState(true)
  const [search, setSearch] = React.useState("")
  const [searchInput, setSearchInput] = React.useState("")
  const [viewOrder, setViewOrder] = React.useState<Order | null>(null)

  React.useEffect(() => {
    api.get<Order[]>("/orders/admin/all")
      .then(setOrders)
      .catch((err) => {
        toast.add({ title: "Failed to load orders", description: getApiError(err), type: "error" })
      })
      .finally(() => setLoading(false))
  }, [])

  const handleSearch = () => {
    setSearch(searchInput)
  }

  const filteredPayments = React.useMemo(() => {
    if (!search) return orders
    const term = search.toLowerCase()
    return orders.filter(
      (o) => (o.order_number ?? o.id).toLowerCase().includes(term) || o.status.toLowerCase().includes(term)
    )
  }, [orders, search])

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
        <p className="text-sm text-muted-foreground">View all platform order payments ({orders.length} total).</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <CreditCard className="size-4" /> All Orders
            </CardTitle>
            <div className="flex gap-2">
              <Input
                placeholder="Search orders..."
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
                <TableHead>Order #</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Payment Method</TableHead>
                <TableHead>Payment Status</TableHead>
                <TableHead>Order Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPayments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">No orders found.</TableCell>
                </TableRow>
              ) : (
                filteredPayments.map((o) => (
                  <TableRow key={o.id}>
                    <TableCell className="font-mono text-xs">{o.order_number ?? o.id.slice(0, 8)}</TableCell>
                    <TableCell className="font-medium">{formatPrice(Number(o.total_amount))}</TableCell>
                    <TableCell>{o.payment_method ?? "—"}</TableCell>
                    <TableCell>
                      <Badge variant={paymentStatusConfig[o.payment_status ?? o.status]?.variant ?? "outline"}>
                        {paymentStatusConfig[o.payment_status ?? o.status]?.label ?? (o.payment_status ?? o.status)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={orderStatusConfig[o.status]?.variant ?? "outline"}>
                        {orderStatusConfig[o.status]?.label ?? o.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs">{new Date(o.created_at).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon-sm" title="View Details" onClick={() => setViewOrder(o)}>
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

      {/* View Order Dialog */}
      <Dialog open={!!viewOrder} onOpenChange={(open) => !open && setViewOrder(null)}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Order Details</DialogTitle>
            <DialogDescription>Order #: {viewOrder?.order_number ?? viewOrder?.id.slice(0, 8)}</DialogDescription>
          </DialogHeader>
          {viewOrder && (
            <div className="flex flex-col gap-4">
              <div className="grid gap-2 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Order #:</span> <span className="font-mono text-xs">{viewOrder.order_number ?? viewOrder.id.slice(0, 8)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Amount:</span> <span className="font-medium">{formatPrice(Number(viewOrder.total_amount))}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Currency:</span> {viewOrder.currency}</div>
                <div className="flex justify-between"><span className="text-muted-foreground">Payment Method:</span> {viewOrder.payment_method ?? "—"}</div>
                <div className="flex justify-between"><span className="text-muted-foreground">Payment Status:</span> <Badge variant={paymentStatusConfig[viewOrder.payment_status ?? viewOrder.status]?.variant ?? "outline"}>{viewOrder.payment_status ?? viewOrder.status}</Badge></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Order Status:</span> <Badge variant={orderStatusConfig[viewOrder.status]?.variant ?? "outline"}>{viewOrder.status}</Badge></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Created:</span> {new Date(viewOrder.created_at).toLocaleString()}</div>
              </div>

              {viewOrder.items && viewOrder.items.length > 0 && (
                <div>
                  <h4 className="mb-2 text-sm font-medium">Order Items</h4>
                  <div className="flex flex-col gap-1">
                    {viewOrder.items.map((item) => (
                      <div key={item.id} className="flex items-center justify-between rounded-md border p-2 text-xs">
                        <div>
                          <div className="font-medium">{item.product_name}</div>
                          <div className="text-muted-foreground">Qty: {item.quantity} × {formatPrice(Number(item.unit_price))}</div>
                        </div>
                        <span className="font-medium">{formatPrice(Number(item.total_price))}</span>
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
