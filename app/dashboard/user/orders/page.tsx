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
import { Skeleton } from "@/components/ui/skeleton"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog"
import { toast } from "@/components/ui/toast"
import {
  Search,
  Package,
  Truck,
  CheckCircle2,
  Clock,
  XCircle,
  Eye,
  MapPin,
  RotateCcw,
  ShoppingBag,
} from "lucide-react"
import { api, type ApiError } from "@/lib/api"
import { formatPrice } from "@/lib/store-types"

function getApiError(err: unknown): string {
  const e = err as ApiError
  return e?.detail || "Something went wrong. Please try again."
}

type OrderItem = {
  id: string
  product_id: string
  product_name: string
  quantity: number
  unit_price: number
  total_price: number
}

type Order = {
  id: string
  order_number: string
  status: string
  total_amount: number
  currency: string
  created_at: string
  shipping_address: string | null
  tracking_number: string | null
  items: OrderItem[]
}

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: React.ReactNode }> = {
  pending: { label: "Pending", variant: "outline", icon: <Clock className="size-3" /> },
  confirmed: { label: "Confirmed", variant: "secondary", icon: <CheckCircle2 className="size-3" /> },
  processing: { label: "Processing", variant: "secondary", icon: <Clock className="size-3" /> },
  shipped: { label: "Shipped", variant: "secondary", icon: <Truck className="size-3" /> },
  delivered: { label: "Delivered", variant: "default", icon: <CheckCircle2 className="size-3" /> },
  cancelled: { label: "Cancelled", variant: "destructive", icon: <XCircle className="size-3" /> },
  refunded: { label: "Refunded", variant: "destructive", icon: <XCircle className="size-3" /> },
}

export default function UserOrdersPage() {
  const [orders, setOrders] = React.useState<Order[]>([])
  const [loading, setLoading] = React.useState(true)
  const [search, setSearch] = React.useState("")
  const [statusFilter, setStatusFilter] = React.useState<string>("all")
  const [viewOrder, setViewOrder] = React.useState<Order | null>(null)

  React.useEffect(() => {
    api.get<Order[]>("/orders/my-orders?limit=50")
      .then(setOrders)
      .catch((err) => {
        toast.add({ title: "Failed to load orders", description: getApiError(err), type: "error" })
      })
      .finally(() => setLoading(false))
  }, [])

  const filtered = React.useMemo(() => {
    let result = orders
    if (search) {
      const term = search.toLowerCase()
      result = result.filter((o) =>
        (o.order_number ?? o.id).toLowerCase().includes(term) ||
        o.items.some((i) => i.product_name?.toLowerCase().includes(term))
      )
    }
    if (statusFilter !== "all") {
      result = result.filter((o) => o.status === statusFilter)
    }
    return result
  }, [orders, search, statusFilter])

  const summary = React.useMemo(() => {
    const counts: Record<string, number> = {}
    let total = 0
    for (const o of orders) {
      counts[o.status] = (counts[o.status] || 0) + 1
      if (o.status !== "cancelled" && o.status !== "refunded") total += Number(o.total_amount)
    }
    return {
      total: orders.length,
      active: (counts.pending || 0) + (counts.confirmed || 0) + (counts.processing || 0) + (counts.shipped || 0),
      delivered: counts.delivered || 0,
      spent: total,
    }
  }, [orders])

  const handleReorder = async (order: Order) => {
    try {
      for (const item of order.items) {
        await api.post("/cart/items", { product_id: item.product_id, quantity: item.quantity })
      }
      toast.add({ title: "Items added to cart!", description: `${order.items.length} item(s) from ${order.order_number ?? order.id.slice(0, 8)} added.`, type: "success" })
    } catch (err) {
      toast.add({ title: "Failed to re-order", description: getApiError(err), type: "error" })
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">My Orders</h2>
        <p className="text-sm text-muted-foreground">Track your orders, view details, and re-order past purchases.</p>
      </div>

      {/* Summary */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}><CardHeader className="flex flex-row items-center justify-between pb-2"><Skeleton className="h-4 w-24" /><Skeleton className="size-4" /></CardHeader><CardContent><Skeleton className="h-8 w-20" /></CardContent></Card>
          ))
        ) : (
          <>
            <Card><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Total Orders</CardTitle><ShoppingBag className="size-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{summary.total}</div></CardContent></Card>
            <Card><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Active</CardTitle><Clock className="size-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold text-blue-600">{summary.active}</div></CardContent></Card>
            <Card><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Delivered</CardTitle><CheckCircle2 className="size-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold text-green-600">{summary.delivered}</div></CardContent></Card>
            <Card><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Total Spent</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{formatPrice(summary.spent)}</div></CardContent></Card>
          </>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 gap-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search by order # or product..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          </div>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="h-9 rounded-md border border-input bg-background px-3 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring">
            <option value="all">All Status</option>
            {Object.entries(statusConfig).map(([key, cfg]) => (
              <option key={key} value={key}>{cfg.label}</option>
            ))}
          </select>
        </div>
        <div className="text-sm text-muted-foreground">{filtered.length} orders</div>
      </div>

      {/* Order Cards */}
      <div className="flex flex-col gap-4">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-40 w-full rounded-lg" />)
        ) : filtered.length === 0 ? (
          <Card><CardContent className="py-12 text-center text-muted-foreground">No orders found.</CardContent></Card>
        ) : (
          filtered.map((order) => {
            const cfg = statusConfig[order.status] ?? { label: order.status, variant: "outline" as const, icon: <Clock className="size-3" /> }
            return (
              <Card key={order.id}>
                <CardContent className="pt-6">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{order.order_number ?? order.id.slice(0, 8)}</span>
                        <Badge variant={cfg.variant} className="flex items-center gap-1">
                          {cfg.icon}
                          {cfg.label}
                        </Badge>
                      </div>
                      <div className="mt-1 text-sm text-muted-foreground">{new Date(order.created_at).toLocaleDateString()}</div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {order.items.map((item) => (
                          <div key={item.id} className="flex items-center gap-2 rounded-lg border p-2">
                            <div className="flex size-10 items-center justify-center rounded bg-muted">
                              <Package className="size-5 text-muted-foreground" />
                            </div>
                            <div>
                              <div className="text-xs font-medium">{item.product_name ?? "Product"}</div>
                              <div className="text-xs text-muted-foreground">×{item.quantity} · {formatPrice(Number(item.unit_price))}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <div className="text-lg font-bold">{formatPrice(Number(order.total_amount))}</div>
                      <div className="flex gap-1">
                        <Button variant="outline" size="sm" onClick={() => setViewOrder(order)}>
                          <Eye className="size-4" /> Details
                        </Button>
                        {order.status === "delivered" && (
                          <Button variant="ghost" size="sm" onClick={() => handleReorder(order)}>
                            <RotateCcw className="size-4" /> Re-order
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })
        )}
      </div>

      {/* Order Detail Dialog */}
      <Dialog open={!!viewOrder} onOpenChange={(open) => !open && setViewOrder(null)}>
        <DialogContent className="sm:max-w-[520px]">
          {viewOrder && (
            <>
              <DialogHeader>
                <DialogTitle>Order Details — {viewOrder.order_number ?? viewOrder.id.slice(0, 8)}</DialogTitle>
                <DialogDescription>Placed on {new Date(viewOrder.created_at).toLocaleString()}</DialogDescription>
              </DialogHeader>
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Status</span>
                  <Badge variant={statusConfig[viewOrder.status]?.variant ?? "outline"} className="flex items-center gap-1">
                    {statusConfig[viewOrder.status]?.icon ?? <Clock className="size-3" />}
                    {statusConfig[viewOrder.status]?.label ?? viewOrder.status}
                  </Badge>
                </div>
                {viewOrder.shipping_address && (
                  <div className="rounded-lg border p-3">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground"><MapPin className="size-3" /> Shipping Address</div>
                    <div className="mt-1 text-sm">{viewOrder.shipping_address}</div>
                  </div>
                )}
                {viewOrder.tracking_number && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Tracking Number</span>
                    <span className="font-mono">{viewOrder.tracking_number}</span>
                  </div>
                )}
                <div className="rounded-lg border">
                  <div className="border-b px-3 py-2 text-sm font-medium">Items</div>
                  {viewOrder.items.map((item) => (
                    <div key={item.id} className="flex items-center justify-between px-3 py-2 text-sm border-b last:border-0">
                      <span>{item.product_name ?? "Product"} × {item.quantity}</span>
                      <span className="font-medium">{formatPrice(Number(item.total_price))}</span>
                    </div>
                  ))}
                  <div className="flex items-center justify-between px-3 py-2 bg-muted/50">
                    <span className="font-medium">Total</span>
                    <span className="font-bold">{formatPrice(Number(viewOrder.total_amount))}</span>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <DialogClose render={<Button variant="outline" />}>Close</DialogClose>
                {viewOrder.status === "delivered" && (
                  <Button onClick={() => { handleReorder(viewOrder); setViewOrder(null) }}>
                    <RotateCcw className="size-4" /> Re-order
                  </Button>
                )}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
