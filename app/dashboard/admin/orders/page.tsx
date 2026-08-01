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
  DialogClose,
  DialogFooter,
} from "@/components/ui/dialog"
import { toast } from "@/components/ui/toast"
import {
  ShoppingBag,
  Search,
  Eye,
} from "lucide-react"
import { api, type ApiError } from "@/lib/api"
import { PageSkeleton, TableSkeleton } from "@/components/skeletons"

type OrderItem = {
  id: string
  product_id: string
  product_name: string
  quantity: number
  unit_price: number
  total_price: number
}

type OrderStatusHistory = {
  id: string
  status: string
  note: string | null
  created_at: string
}

type Order = {
  id: string
  user_id: string
  status: string
  currency: string
  subtotal: number
  discount_amount: number
  shipping_amount: number
  tax_amount: number
  total: number
  coupon_code: string | null
  notes: string | null
  items: OrderItem[]
  status_history: OrderStatusHistory[]
  created_at: string
  updated_at: string | null
}

type PaginatedOrders = {
  total: number
  page: number
  page_size: number
  results: Order[]
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

export default function AdminOrdersPage() {
  const [orders, setOrders] = React.useState<Order[]>([])
  const [total, setTotal] = React.useState(0)
  const [page, setPage] = React.useState(1)
  const [loading, setLoading] = React.useState(true)
  const [search, setSearch] = React.useState("")
  const [searchInput, setSearchInput] = React.useState("")
  const [viewOrder, setViewOrder] = React.useState<Order | null>(null)
  const [newStatus, setNewStatus] = React.useState("")
  const [actionLoading, setActionLoading] = React.useState(false)
  const pageSize = 10

  const fetchOrders = React.useCallback(() => {
    setLoading(true)
    const params = new URLSearchParams({ page: String(page), page_size: String(pageSize) })
    api.get<PaginatedOrders>(`/orders/admin/all?${params}`)
      .then((data) => {
        setOrders(data.results)
        setTotal(data.total)
      })
      .catch((err) => {
        toast.add({ title: "Failed to load orders", description: getApiError(err), type: "error" })
      })
      .finally(() => setLoading(false))
  }, [page])

  React.useEffect(() => { fetchOrders() }, [fetchOrders])

  const handleSearch = () => {
    setSearch(searchInput)
  }

  const handleStatusUpdate = async () => {
    if (!viewOrder || !newStatus) return
    setActionLoading(true)
    try {
      await api.patch(`/orders/${viewOrder.id}/status`, { status: newStatus })
      toast.add({ title: "Order status updated!", description: `Order is now ${newStatus}.`, type: "success" })
      fetchOrders()
      setViewOrder(null)
      setNewStatus("")
    } catch (err) {
      toast.add({ title: "Failed to update status", description: getApiError(err), type: "error" })
    } finally {
      setActionLoading(false)
    }
  }

  const filteredOrders = React.useMemo(() => {
    if (!search) return orders
    const term = search.toLowerCase()
    return orders.filter((o) => o.id.toLowerCase().includes(term) || o.user_id.toLowerCase().includes(term))
  }, [orders, search])

  const totalPages = Math.ceil(total / pageSize)

  if (loading && orders.length === 0) {
    return (
      <PageSkeleton>
        <Card><TableSkeleton rows={10} cols={5} /></Card>
      </PageSkeleton>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Orders</h2>
        <p className="text-sm text-muted-foreground">View and manage all platform orders ({total} total).</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <ShoppingBag className="size-4" /> All Orders
            </CardTitle>
            <div className="flex gap-2">
              <Input
                placeholder="Search by order ID..."
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
                <TableHead>Order ID</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">No orders found.</TableCell>
                </TableRow>
              ) : (
                filteredOrders.map((o) => (
                  <TableRow key={o.id}>
                    <TableCell className="font-mono text-xs">{o.id.slice(0, 8)}</TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">{o.user_id.slice(0, 8)}</TableCell>
                    <TableCell className="font-medium">{formatPrice(Number(o.total))}</TableCell>
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

          {totalPages > 1 && (
            <div className="mt-4 flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Page {page} of {totalPages}</p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={page === 1 || loading} onClick={() => setPage(page - 1)}>Previous</Button>
                <Button variant="outline" size="sm" disabled={page === totalPages || loading} onClick={() => setPage(page + 1)}>Next</Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* View Order Dialog */}
      <Dialog open={!!viewOrder} onOpenChange={(open) => !open && setViewOrder(null)}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Order Details</DialogTitle>
            <DialogDescription>Order ID: {viewOrder?.id.slice(0, 8)}</DialogDescription>
          </DialogHeader>
          {viewOrder && (
            <div className="flex flex-col gap-4">
              <div className="grid gap-2 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Status:</span> <Badge variant={orderStatusConfig[viewOrder.status]?.variant ?? "outline"}>{viewOrder.status}</Badge></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Subtotal:</span> {formatPrice(Number(viewOrder.subtotal))}</div>
                <div className="flex justify-between"><span className="text-muted-foreground">Discount:</span> -{formatPrice(Number(viewOrder.discount_amount))}</div>
                <div className="flex justify-between"><span className="text-muted-foreground">Shipping:</span> {formatPrice(Number(viewOrder.shipping_amount))}</div>
                <div className="flex justify-between"><span className="text-muted-foreground">Tax:</span> {formatPrice(Number(viewOrder.tax_amount))}</div>
                <div className="flex justify-between font-medium"><span>Total:</span> {formatPrice(Number(viewOrder.total))}</div>
              </div>

              <div>
                <h4 className="mb-2 text-sm font-medium">Items</h4>
                <div className="flex flex-col gap-2">
                  {viewOrder.items.map((item) => (
                    <div key={item.id} className="flex items-center justify-between rounded-lg border p-3 text-sm">
                      <div>
                        <div className="font-medium">{item.product_name}</div>
                        <div className="text-xs text-muted-foreground">Qty: {item.quantity} x {formatPrice(Number(item.unit_price))}</div>
                      </div>
                      <div className="font-medium">{formatPrice(Number(item.total_price))}</div>
                    </div>
                  ))}
                </div>
              </div>

              {viewOrder.status_history.length > 0 && (
                <div>
                  <h4 className="mb-2 text-sm font-medium">Status History</h4>
                  <div className="flex flex-col gap-1">
                    {viewOrder.status_history.map((h) => (
                      <div key={h.id} className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Badge variant="outline">{h.status}</Badge>
                        <span>{new Date(h.created_at).toLocaleString()}</span>
                        {h.note && <span>— {h.note}</span>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <h4 className="mb-2 text-sm font-medium">Update Status</h4>
                <div className="flex gap-2">
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                    className="h-9 flex-1 rounded-md border border-input bg-background px-3 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="">Select new status...</option>
                    {Object.entries(orderStatusConfig).map(([key, cfg]) => (
                      <option key={key} value={key}>{cfg.label}</option>
                    ))}
                  </select>
                  <Button disabled={actionLoading || !newStatus} onClick={handleStatusUpdate}>
                    Update
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
