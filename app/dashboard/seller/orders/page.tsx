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
  DialogClose,
} from "@/components/ui/dialog"
import {
  Field,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { toast } from "@/components/ui/toast"
import {
  Search,
  ShoppingBag,
  CheckCircle2,
  Clock,
  Package,
  Truck,
  XCircle,
  Eye,
  MapPin,
  Phone,
  ArrowRight,
} from "lucide-react"
import { api, type ApiError } from "@/lib/api"
import { StatsCardSkeleton, TableSkeleton, PageSkeleton } from "@/components/skeletons"

type OrderStatus = "new" | "accepted" | "processing" | "ready_to_ship" | "shipped" | "delivered" | "cancellation_requested" | "cancelled"

type OrderItem = {
  id: string
  product_id: string
  variant_id: string | null
  product_name: string
  variant_name: string | null
  quantity: number
  unit_price: number
  total_price: number
}

type Order = {
  id: string
  order_id: string
  seller_id: string
  order_status: string
  seller_status: OrderStatus
  currency: string
  seller_subtotal: number
  item_count: number
  customer_name: string
  customer_phone: string | null
  shipping_address: Record<string, unknown> | null
  shipping_method_name: string | null
  shipping_carrier: string | null
  estimated_delivery_from: string | null
  estimated_delivery_to: string | null
  seller_notes: string | null
  cancellation_reason: string | null
  items: OrderItem[]
  shipment: unknown | null
  created_at: string
  updated_at: string | null
}

type OrderListResponse = {
  total: number
  page: number
  page_size: number
  results: Order[]
}

type OrderSummary = {
  total_orders: number
  new_orders: number
  accepted_orders: number
  processing_orders: number
  ready_to_ship_orders: number
  shipped_orders: number
  delivered_orders: number
  cancellation_requests: number
  gross_sales: number
  units_sold: number
}

const statusConfig: Record<OrderStatus, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: React.ReactNode }> = {
  new: { label: "New", variant: "default", icon: <Clock className="size-3" /> },
  accepted: { label: "Accepted", variant: "secondary", icon: <CheckCircle2 className="size-3" /> },
  processing: { label: "Processing", variant: "secondary", icon: <Package className="size-3" /> },
  ready_to_ship: { label: "Ready to Ship", variant: "outline", icon: <Package className="size-3" /> },
  shipped: { label: "Shipped", variant: "secondary", icon: <Truck className="size-3" /> },
  delivered: { label: "Delivered", variant: "default", icon: <CheckCircle2 className="size-3" /> },
  cancellation_requested: { label: "Cancel Requested", variant: "destructive", icon: <XCircle className="size-3" /> },
  cancelled: { label: "Cancelled", variant: "destructive", icon: <XCircle className="size-3" /> },
}

const statusFlow: Record<OrderStatus, OrderStatus | null> = {
  new: "accepted",
  accepted: "processing",
  processing: "ready_to_ship",
  ready_to_ship: "shipped",
  shipped: "delivered",
  delivered: null,
  cancellation_requested: null,
  cancelled: null,
}

const statusActionLabel: Record<OrderStatus, string | null> = {
  new: "Accept Order",
  accepted: "Start Processing",
  processing: "Mark Ready to Ship",
  ready_to_ship: "Dispatch Order",
  shipped: "Mark Delivered",
  delivered: null,
  cancellation_requested: null,
  cancelled: null,
}

function formatPrice(price: number): string {
  return `TSh ${Number(price).toLocaleString()}`
}

function getApiError(err: unknown): string {
  const e = err as ApiError
  return e?.detail || "Something went wrong. Please try again."
}

function formatAddress(addr: Record<string, unknown> | null): string {
  if (!addr) return "—"
  const parts = [addr.street, addr.city, addr.region, addr.country].filter(Boolean)
  return parts.join(", ") || "—"
}

export default function SellerOrdersPage() {
  const [orders, setOrders] = React.useState<Order[]>([])
  const [summary, setSummary] = React.useState<OrderSummary | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [search, setSearch] = React.useState("")
  const [statusFilter, setStatusFilter] = React.useState<OrderStatus | "all">("all")
  const [viewOrder, setViewOrder] = React.useState<Order | null>(null)
  const [dispatchOrder, setDispatchOrder] = React.useState<Order | null>(null)
  const [actionLoading, setActionLoading] = React.useState(false)

  React.useEffect(() => {
    Promise.all([
      api.get<OrderListResponse>("/seller/orders"),
      api.get<OrderSummary>("/seller/orders/summary"),
    ])
      .then(([listRes, sumRes]) => {
        setOrders(listRes.results)
        setSummary(sumRes)
      })
      .catch((err) => {
        toast.add({
          title: "Failed to load orders",
          description: getApiError(err),
          type: "error",
        })
      })
      .finally(() => setLoading(false))
  }, [])

  const filtered = React.useMemo(() => {
    let result = orders
    if (search) {
      const term = search.toLowerCase()
      result = result.filter(
        (o) =>
          o.id.toLowerCase().includes(term) ||
          o.customer_name.toLowerCase().includes(term)
      )
    }
    if (statusFilter !== "all") {
      result = result.filter((o) => o.seller_status === statusFilter)
    }
    return result
  }, [orders, search, statusFilter])

  const advanceStatus = async (order: Order) => {
    const next = statusFlow[order.seller_status]
    if (!next) return
    setActionLoading(true)
    try {
      let endpoint = ""
      if (order.seller_status === "new") endpoint = `/seller/orders/${order.id}/accept`
      else if (order.seller_status === "accepted") endpoint = `/seller/orders/${order.id}/start-processing`
      else if (order.seller_status === "processing") endpoint = `/seller/orders/${order.id}/ready-to-ship`
      else if (order.seller_status === "shipped") endpoint = `/seller/orders/${order.id}/deliver`

      if (endpoint) {
        const updated = await api.post<Order>(endpoint, {})
        setOrders((prev) => prev.map((o) => (o.id === order.id ? updated : o)))
        toast.add({
          title: "Order updated!",
          description: `Order is now ${statusConfig[updated.seller_status]?.label}.`,
          type: "success",
        })
      }
    } catch (err) {
      toast.add({
        title: "Failed to update order",
        description: getApiError(err),
        type: "error",
      })
    } finally {
      setActionLoading(false)
    }
  }

  const handleDispatch = async (id: string, data: { carrier: string; tracking: string }) => {
    setActionLoading(true)
    try {
      const updated = await api.post<Order>(`/seller/orders/${id}/dispatch`, {
        carrier_name: data.carrier,
        tracking_number: data.tracking,
      })
      setOrders((prev) => prev.map((o) => (o.id === id ? updated : o)))
      setDispatchOrder(null)
      setViewOrder(null)
      toast.add({
        title: "Order dispatched!",
        description: `Order has been shipped via ${data.carrier}.`,
        type: "success",
      })
    } catch (err) {
      toast.add({
        title: "Failed to dispatch",
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
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => <StatsCardSkeleton key={i} />)}
        </div>
        <Card>
          <TableSkeleton rows={6} cols={7} />
        </Card>
      </PageSkeleton>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Orders</h2>
        <p className="text-sm text-muted-foreground">
          Manage incoming orders, accept, process, and ship to customers.
        </p>
      </div>

      {/* Summary Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Orders</CardTitle>
            <ShoppingBag className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary?.total_orders ?? 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">New</CardTitle>
            <Badge variant="default" className="text-xs">{summary?.new_orders ?? 0}</Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary?.new_orders ?? 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">In Process</CardTitle>
            <Badge variant="secondary" className="text-xs">{(summary?.accepted_orders ?? 0) + (summary?.processing_orders ?? 0)}</Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(summary?.accepted_orders ?? 0) + (summary?.processing_orders ?? 0)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Gross Sales</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatPrice(summary?.gross_sales ?? 0)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Units Sold</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary?.units_sold ?? 0}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters + Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-1 gap-2">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search by order # or customer..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as OrderStatus | "all")}
                className="h-9 rounded-md border border-input bg-background px-3 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="all">All Status</option>
                <option value="new">New</option>
                <option value="accepted">Accepted</option>
                <option value="processing">Processing</option>
                <option value="ready_to_ship">Ready to Ship</option>
                <option value="shipped">Shipped</option>
                <option value="delivered">Delivered</option>
                <option value="cancellation_requested">Cancel Requested</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            <div className="text-sm text-muted-foreground">
              {filtered.length} of {orders.length} orders
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order #</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Items</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                    No orders found.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium font-mono text-xs">#{order.order_id.slice(0, 8)}</TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span>{order.customer_name}</span>
                        <span className="text-xs text-muted-foreground">{order.customer_phone ?? "—"}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {order.item_count} items
                    </TableCell>
                    <TableCell className="font-medium">{formatPrice(order.seller_subtotal)}</TableCell>
                    <TableCell>
                      <Badge variant={statusConfig[order.seller_status]?.variant ?? "outline"} className="flex items-center gap-1 w-fit">
                        {statusConfig[order.seller_status]?.icon}
                        {statusConfig[order.seller_status]?.label ?? order.seller_status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs">{new Date(order.created_at).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => setViewOrder(order)}
                          title="View Details"
                        >
                          <Eye className="size-4" />
                        </Button>
                        {statusActionLabel[order.seller_status] && (
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={actionLoading}
                            onClick={() => {
                              if (order.seller_status === "ready_to_ship") {
                                setDispatchOrder(order)
                              } else {
                                advanceStatus(order)
                              }
                            }}
                          >
                            <ArrowRight className="size-3" />
                            {statusActionLabel[order.seller_status]}
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Order Detail Dialog */}
      <Dialog open={!!viewOrder} onOpenChange={(open) => !open && setViewOrder(null)}>
        <DialogContent className="sm:max-w-[520px]">
          {viewOrder && (
            <>
              <DialogHeader>
                <DialogTitle>Order Details — #{viewOrder.order_id.slice(0, 8)}</DialogTitle>
                <DialogDescription>
                  Placed on {new Date(viewOrder.created_at).toLocaleString()}
                </DialogDescription>
              </DialogHeader>

              <div className="flex flex-col gap-4">
                {/* Status */}
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Status</span>
                  <Badge variant={statusConfig[viewOrder.seller_status]?.variant ?? "outline"} className="flex items-center gap-1">
                    {statusConfig[viewOrder.seller_status]?.icon}
                    {statusConfig[viewOrder.seller_status]?.label ?? viewOrder.seller_status}
                  </Badge>
                </div>

                {/* Customer */}
                <div className="rounded-lg border p-3">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    {viewOrder.customer_name}
                  </div>
                  <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                    <Phone className="size-3" />
                    {viewOrder.customer_phone ?? "—"}
                  </div>
                  <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                    <MapPin className="size-3" />
                    {formatAddress(viewOrder.shipping_address)}
                  </div>
                </div>

                {/* Items */}
                <div className="rounded-lg border">
                  <div className="border-b px-3 py-2 text-sm font-medium">Items</div>
                  {viewOrder.items.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between px-3 py-2 text-sm border-b last:border-0">
                      <span>{item.product_name} × {item.quantity}</span>
                      <span className="font-medium">{formatPrice(Number(item.total_price))}</span>
                    </div>
                  ))}
                  <div className="flex items-center justify-between px-3 py-2 bg-muted/50">
                    <span className="font-medium">Total</span>
                    <span className="font-bold">{formatPrice(Number(viewOrder.seller_subtotal))}</span>
                  </div>
                </div>

                {/* Shipping */}
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Shipping Method</span>
                  <span>{viewOrder.shipping_method_name ?? "—"}</span>
                </div>

                {viewOrder.seller_notes && (
                  <div className="rounded-lg bg-muted/50 p-3 text-sm">
                    <span className="font-medium">Notes: </span>
                    {viewOrder.seller_notes}
                  </div>
                )}

                {viewOrder.cancellation_reason && (
                  <div className="rounded-lg bg-destructive/10 p-3 text-sm">
                    <span className="font-medium text-destructive">Cancellation Reason: </span>
                    {viewOrder.cancellation_reason}
                  </div>
                )}
              </div>

              <DialogFooter>
                <DialogClose render={<Button variant="outline" />}>
                  Close
                </DialogClose>
                {statusActionLabel[viewOrder.seller_status] && (
                  <Button
                    disabled={actionLoading}
                    onClick={() => {
                      if (viewOrder.seller_status === "ready_to_ship") {
                        setDispatchOrder(viewOrder)
                      } else {
                        advanceStatus(viewOrder)
                        setViewOrder(null)
                      }
                    }}
                  >
                    <ArrowRight className="size-4" />
                    {statusActionLabel[viewOrder.seller_status]}
                  </Button>
                )}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Dispatch Dialog */}
      <Dialog open={!!dispatchOrder} onOpenChange={(open) => !open && setDispatchOrder(null)}>
        <DialogContent className="sm:max-w-[440px]">
          {dispatchOrder && (
            <DispatchForm
              order={dispatchOrder}
              onSubmit={(data) => handleDispatch(dispatchOrder.id, data)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

function DispatchForm({
  order,
  onSubmit,
}: {
  order: Order
  onSubmit: (data: { carrier: string; tracking: string }) => void
}) {
  const orderNumber = `#${order.order_id.slice(0, 8)}`
  const [carrier, setCarrier] = React.useState("")
  const [tracking, setTracking] = React.useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!carrier.trim() || !tracking.trim()) return
    onSubmit({ carrier: carrier.trim(), tracking: tracking.trim() })
  }

  return (
    <form onSubmit={handleSubmit}>
      <DialogHeader>
        <DialogTitle>Dispatch Order — {orderNumber}</DialogTitle>
        <DialogDescription>
          Enter carrier and tracking details to ship this order.
        </DialogDescription>
      </DialogHeader>

      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="carrier">Carrier Name</FieldLabel>
          <Input
            id="carrier"
            value={carrier}
            onChange={(e) => setCarrier(e.target.value)}
            placeholder="e.g. DHL, G4S, FastCo"
            required
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="tracking">Tracking Number</FieldLabel>
          <Input
            id="tracking"
            value={tracking}
            onChange={(e) => setTracking(e.target.value)}
            placeholder="e.g. TRK123456789"
            required
            className="font-mono"
          />
        </Field>
      </FieldGroup>

      <DialogFooter>
        <DialogClose render={<Button variant="outline" />}>
          Cancel
        </DialogClose>
        <Button type="submit">
          <Truck className="size-4" />
          Dispatch
        </Button>
      </DialogFooter>
    </form>
  )
}
