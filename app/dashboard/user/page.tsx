"use client"

import * as React from "react"
import Link from "next/link"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  ShoppingBag,
  Heart,
  DollarSign,
  Package,
  ArrowUpRight,
  ArrowDownRight,
  Truck,
  CheckCircle2,
  Clock,
  MapPin,
} from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { api, type ApiError } from "@/lib/api"
import { toast } from "@/components/ui/toast"
import { useAuth } from "@/lib/auth-context"
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
  items: OrderItem[]
}

const statusConfig: Record<string, { variant: "default" | "secondary" | "outline" | "destructive"; icon: React.ReactNode; label: string }> = {
  pending: { variant: "outline", icon: <Clock className="size-3" />, label: "Pending" },
  confirmed: { variant: "secondary", icon: <CheckCircle2 className="size-3" />, label: "Confirmed" },
  processing: { variant: "secondary", icon: <Clock className="size-3" />, label: "Processing" },
  shipped: { variant: "secondary", icon: <Truck className="size-3" />, label: "Shipped" },
  delivered: { variant: "default", icon: <CheckCircle2 className="size-3" />, label: "Delivered" },
  cancelled: { variant: "destructive", icon: <Clock className="size-3" />, label: "Cancelled" },
  refunded: { variant: "destructive", icon: <Clock className="size-3" />, label: "Refunded" },
}

export default function UserDashboardPage() {
  const { user } = useAuth()
  const [orders, setOrders] = React.useState<Order[]>([])
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    api.get<Order[]>("/orders/my-orders?limit=10")
      .then(setOrders)
      .catch((err) => {
        toast.add({ title: "Failed to load orders", description: getApiError(err), type: "error" })
      })
      .finally(() => setLoading(false))
  }, [])

  const totalOrders = orders.length
  const pendingDeliveries = orders.filter((o) => o.status === "shipped" || o.status === "processing").length
  const totalSpent = orders.reduce((sum, o) => sum + Number(o.total_amount), 0)
  const deliveredCount = orders.filter((o) => o.status === "delivered").length

  const stats = [
    { title: "Total Orders", value: loading ? "..." : String(totalOrders), change: "", trend: "up" as const, icon: ShoppingBag, description: "all time" },
    { title: "Pending Deliveries", value: loading ? "..." : String(pendingDeliveries), change: "", trend: "up" as const, icon: Truck, description: "in transit" },
    { title: "Delivered", value: loading ? "..." : String(deliveredCount), change: "", trend: "up" as const, icon: CheckCircle2, description: "completed" },
    { title: "Total Spent", value: loading ? "..." : formatPrice(totalSpent), change: "", trend: "up" as const, icon: DollarSign, description: "all time" },
  ]

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            Welcome back, {user?.first_name ?? "User"}!
          </h2>
          <p className="text-sm text-muted-foreground">
            Track your orders, manage your profile, and view your activity.
          </p>
        </div>
        <Link href="/products">
          <Button>
            <ShoppingBag className="size-4" />
            Continue Shopping
          </Button>
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="size-4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-20" />
                <Skeleton className="mt-2 h-3 w-16" />
              </CardContent>
            </Card>
          ))
        ) : (
          stats.map((stat) => (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <stat.icon className="size-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <div className="flex items-center gap-1 text-xs">
                  <span className="text-muted-foreground">{stat.description}</span>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Recent Orders Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Recent Orders</CardTitle>
              <CardDescription>Your latest purchases</CardDescription>
            </div>
            <Link href="/dashboard/user/orders">
              <Button variant="outline" size="sm">View All</Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex flex-col gap-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : orders.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-4 py-12 text-center">
              <Package className="size-10 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">No orders yet. Start shopping to see your orders here.</p>
              <Link href="/products"><Button variant="outline" size="sm">Browse Products</Button></Link>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order #</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.slice(0, 5).map((order) => {
                  const config = statusConfig[order.status] ?? { variant: "outline" as const, icon: <Clock className="size-3" />, label: order.status }
                  return (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium">{order.order_number ?? order.id.slice(0, 8)}</TableCell>
                      <TableCell>{order.items?.length ?? 0} item(s)</TableCell>
                      <TableCell className="font-medium">{formatPrice(Number(order.total_amount))}</TableCell>
                      <TableCell>
                        <Badge variant={config.variant} className="flex items-center gap-1 w-fit">
                          {config.icon}
                          {config.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-xs">
                        {new Date(order.created_at).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Quick Links */}
      <div className="grid gap-4 md:grid-cols-3">
        <Link href="/dashboard/user/orders">
          <Card className="cursor-pointer transition-all hover:shadow-md">
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex size-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <ShoppingBag className="size-6" />
              </div>
              <div>
                <p className="text-sm font-medium">My Orders</p>
                <p className="text-xs text-muted-foreground">Track and manage orders</p>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link href="/dashboard/user/addresses">
          <Card className="cursor-pointer transition-all hover:shadow-md">
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex size-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <MapPin className="size-6" />
              </div>
              <div>
                <p className="text-sm font-medium">Addresses</p>
                <p className="text-xs text-muted-foreground">Manage delivery addresses</p>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link href="/dashboard/user/settings">
          <Card className="cursor-pointer transition-all hover:shadow-md">
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex size-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Heart className="size-6" />
              </div>
              <div>
                <p className="text-sm font-medium">Settings</p>
                <p className="text-xs text-muted-foreground">Profile and preferences</p>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  )
}
