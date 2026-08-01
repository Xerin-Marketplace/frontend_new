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

type OrderStatus = "pending" | "confirmed" | "shipped" | "delivered" | "cancelled"

type Order = {
  id: string
  order_number: string
  seller_name: string
  items: { name: string; qty: number; price: number; image: string | null }[]
  total: number
  status: OrderStatus
  shipping_address: string
  tracking_number: string | null
  created_at: string
}

const statusConfig: Record<OrderStatus, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: React.ReactNode }> = {
  pending: { label: "Pending", variant: "outline", icon: <Clock className="size-3" /> },
  confirmed: { label: "Confirmed", variant: "secondary", icon: <CheckCircle2 className="size-3" /> },
  shipped: { label: "Shipped", variant: "secondary", icon: <Truck className="size-3" /> },
  delivered: { label: "Delivered", variant: "default", icon: <CheckCircle2 className="size-3" /> },
  cancelled: { label: "Cancelled", variant: "destructive", icon: <XCircle className="size-3" /> },
}

const mockOrders: Order[] = [
  { id: "1", order_number: "#ORD-3921", seller_name: "Acme Trading Co.", items: [{ name: "Wireless Headphones", qty: 1, price: 85000, image: null }, { name: "Phone Case Pro", qty: 2, price: 15000, image: null }], total: 115000, status: "shipped", shipping_address: "123 Mlimani St, Dar es Salaam", tracking_number: "G4S-789456", created_at: "2025-08-01 14:30" },
  { id: "2", order_number: "#ORD-3918", seller_name: "TechWorld TZ", items: [{ name: "Smart Watch Pro", qty: 1, price: 120000, image: null }], total: 120000, status: "delivered", shipping_address: "123 Mlimani St, Dar es Salaam", tracking_number: "FC-123789", created_at: "2025-07-28 10:15" },
  { id: "3", order_number: "#ORD-3915", seller_name: "Acme Trading Co.", items: [{ name: "USB Cable Set", qty: 3, price: 12000, image: null }], total: 36000, status: "pending", shipping_address: "123 Mlimani St, Dar es Salaam", tracking_number: null, created_at: "2025-08-01 09:00" },
  { id: "4", order_number: "#ORD-3910", seller_name: "Gadget Hub", items: [{ name: "Gaming Mouse", qty: 1, price: 45000, image: null }], total: 45000, status: "cancelled", shipping_address: "123 Mlimani St, Dar es Salaam", tracking_number: null, created_at: "2025-07-25 16:20" },
  { id: "5", order_number: "#ORD-3905", seller_name: "TechWorld TZ", items: [{ name: "Bluetooth Speaker", qty: 1, price: 65000, image: null }], total: 65000, status: "delivered", shipping_address: "123 Mlimani St, Dar es Salaam", tracking_number: "INT-456123", created_at: "2025-07-20 11:00" },
]

function formatPrice(price: number): string {
  return `TSh ${price.toLocaleString()}`
}

export default function UserOrdersPage() {
  const [orders] = React.useState<Order[]>(mockOrders)
  const [search, setSearch] = React.useState("")
  const [statusFilter, setStatusFilter] = React.useState<OrderStatus | "all">("all")
  const [viewOrder, setViewOrder] = React.useState<Order | null>(null)

  const filtered = React.useMemo(() => {
    let result = orders
    if (search) {
      const term = search.toLowerCase()
      result = result.filter((o) => o.order_number.toLowerCase().includes(term) || o.seller_name.toLowerCase().includes(term))
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
      if (o.status !== "cancelled") total += o.total
    }
    return { total: orders.length, active: (counts.pending || 0) + (counts.confirmed || 0) + (counts.shipped || 0), delivered: counts.delivered || 0, cancelled: counts.cancelled || 0, spent: total }
  }, [orders])

  const handleReorder = (order: Order) => {
    toast.add({ title: "Items added to cart!", description: `${order.items.length} item(s) from ${order.order_number} added.`, type: "success" })
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">My Orders</h2>
        <p className="text-sm text-muted-foreground">Track your orders, view details, and re-order past purchases.</p>
      </div>

      {/* Summary */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Total Orders</CardTitle><ShoppingBag className="size-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{summary.total}</div></CardContent></Card>
        <Card><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Active</CardTitle><Clock className="size-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold text-blue-600">{summary.active}</div></CardContent></Card>
        <Card><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Delivered</CardTitle><CheckCircle2 className="size-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold text-green-600">{summary.delivered}</div></CardContent></Card>
        <Card><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Total Spent</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{formatPrice(summary.spent)}</div></CardContent></Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 gap-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search by order # or seller..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          </div>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as OrderStatus | "all")} className="h-9 rounded-md border border-input bg-background px-3 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring">
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="shipped">Shipped</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
        <div className="text-sm text-muted-foreground">{filtered.length} orders</div>
      </div>

      {/* Order Cards */}
      <div className="flex flex-col gap-4">
        {filtered.length === 0 ? (
          <Card><CardContent className="py-12 text-center text-muted-foreground">No orders found.</CardContent></Card>
        ) : (
          filtered.map((order) => (
            <Card key={order.id}>
              <CardContent className="pt-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{order.order_number}</span>
                      <Badge variant={statusConfig[order.status].variant} className="flex items-center gap-1">
                        {statusConfig[order.status].icon}
                        {statusConfig[order.status].label}
                      </Badge>
                    </div>
                    <div className="mt-1 text-sm text-muted-foreground">from {order.seller_name} · {order.created_at}</div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {order.items.map((item, idx) => (
                        <div key={idx} className="flex items-center gap-2 rounded-lg border p-2">
                          <div className="flex size-10 items-center justify-center rounded bg-muted">
                            <Package className="size-5 text-muted-foreground" />
                          </div>
                          <div>
                            <div className="text-xs font-medium">{item.name}</div>
                            <div className="text-xs text-muted-foreground">×{item.qty} · {formatPrice(item.price)}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <div className="text-lg font-bold">{formatPrice(order.total)}</div>
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
          ))
        )}
      </div>

      {/* Order Detail Dialog */}
      <Dialog open={!!viewOrder} onOpenChange={(open) => !open && setViewOrder(null)}>
        <DialogContent className="sm:max-w-[520px]">
          {viewOrder && (
            <>
              <DialogHeader>
                <DialogTitle>Order Details — {viewOrder.order_number}</DialogTitle>
                <DialogDescription>Placed on {viewOrder.created_at} from {viewOrder.seller_name}</DialogDescription>
              </DialogHeader>
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Status</span>
                  <Badge variant={statusConfig[viewOrder.status].variant} className="flex items-center gap-1">
                    {statusConfig[viewOrder.status].icon}
                    {statusConfig[viewOrder.status].label}
                  </Badge>
                </div>
                <div className="rounded-lg border p-3">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground"><MapPin className="size-3" /> Shipping Address</div>
                  <div className="mt-1 text-sm">{viewOrder.shipping_address}</div>
                </div>
                {viewOrder.tracking_number && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Tracking Number</span>
                    <span className="font-mono">{viewOrder.tracking_number}</span>
                  </div>
                )}
                <div className="rounded-lg border">
                  <div className="border-b px-3 py-2 text-sm font-medium">Items</div>
                  {viewOrder.items.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between px-3 py-2 text-sm border-b last:border-0">
                      <span>{item.name} × {item.qty}</span>
                      <span className="font-medium">{formatPrice(item.price * item.qty)}</span>
                    </div>
                  ))}
                  <div className="flex items-center justify-between px-3 py-2 bg-muted/50">
                    <span className="font-medium">Total</span>
                    <span className="font-bold">{formatPrice(viewOrder.total)}</span>
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
