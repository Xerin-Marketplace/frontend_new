"use client"

import * as React from "react"
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
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import {
  TrendingUp,
  Package,
  ShoppingBag,
  DollarSign,
  Users,
  ArrowUpRight,
  Plus,
  Clock,
} from "lucide-react"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Area, AreaChart } from "recharts"
import { api, type ApiError } from "@/lib/api"
import { StatsCardSkeleton, TableSkeleton } from "@/components/skeletons"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "@/components/ui/toast"
import Link from "next/link"

// ─── Types ───
type AnalyticsOverview = {
  start_at: string
  end_at: string
  money: {
    currency: string
    gross_sales: number
    commission_revenue: number
    seller_net_earnings: number
    refunds_completed: number
    payouts_completed: number
  }
  counts: {
    orders: number
    paid_orders: number
    refunded_orders: number
    active_sellers: number
    products: number
    units_sold: number
  }
  average_order_value: number
  refund_rate_percent: number
  pending_wallet_balance: number
  available_wallet_balance: number
  pending_payout_amount: number
}

type SalesPoint = {
  period: string
  amount: number
  order_count: number
  units: number
}

type ProductRanking = {
  id: string
  name: string
  gross_sales: number
  net_earnings: number
  commission: number
  refunds: number
  order_count: number
  units: number
}

type SellerOrderSummary = {
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

type SellerOrder = {
  id: string
  order_id: string
  seller_id: string
  order_status: string
  seller_status: string
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
  items: unknown[]
  shipment: unknown
  created_at: string
  updated_at: string | null
}

type SellerOrderList = {
  total: number
  page: number
  page_size: number
  results: SellerOrder[]
}

// ─── Helpers ───
function formatPrice(price: number): string {
  return `TSh ${Number(price).toLocaleString()}`
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr)
  const now = new Date()
  const diff = now.getTime() - d.getTime()
  const hours = Math.floor(diff / (1000 * 60 * 60))
  const days = Math.floor(hours / 24)
  if (hours < 1) return "Just now"
  if (hours < 24) return `${hours}h ago`
  if (days < 7) return `${days}d ago`
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" })
}

function getApiError(err: unknown): string {
  const e = err as ApiError
  return e?.detail || "Something went wrong. Please try again."
}

const statusBadgeVariant: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  new: "default",
  accepted: "secondary",
  processing: "secondary",
  ready_to_ship: "secondary",
  shipped: "default",
  delivered: "default",
  cancellation_requested: "destructive",
  cancelled: "destructive",
}

const chartConfig = {
  amount: { label: "Revenue", color: "hsl(var(--primary))" },
  orders: { label: "Orders", color: "hsl(var(--chart-2))" },
} satisfies ChartConfig

// ─── Component ───
export default function SellerDashboardPage() {
  const [overview, setOverview] = React.useState<AnalyticsOverview | null>(null)
  const [sales, setSales] = React.useState<SalesPoint[]>([])
  const [products, setProducts] = React.useState<ProductRanking[]>([])
  const [orderSummary, setOrderSummary] = React.useState<SellerOrderSummary | null>(null)
  const [recentOrders, setRecentOrders] = React.useState<SellerOrder[]>([])
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    setLoading(true)
    Promise.all([
      api.get<AnalyticsOverview>("/analytics/seller/me/overview?days=30"),
      api.get<SalesPoint[]>("/analytics/seller/me/sales?days=30"),
      api.get<ProductRanking[]>("/analytics/seller/me/products?days=30&limit=5"),
      api.get<SellerOrderSummary>("/seller/orders/summary"),
      api.get<SellerOrderList>("/seller/orders?page=1&page_size=5"),
    ])
      .then(([ov, sl, pr, sum, orders]) => {
        setOverview(ov)
        setSales(sl)
        setProducts(pr)
        setOrderSummary(sum)
        setRecentOrders(orders.results)
      })
      .catch((err) => {
        toast.add({
          title: "Failed to load dashboard",
          description: getApiError(err),
          type: "error",
        })
      })
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-64" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => <StatsCardSkeleton key={i} />)}
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
          <Skeleton className="h-[340px] lg:col-span-4" />
          <Skeleton className="h-[340px] lg:col-span-3" />
        </div>
        <Card><TableSkeleton rows={5} cols={6} /></Card>
      </div>
    )
  }

  const totalRevenue = Number(overview?.money.gross_sales ?? 0)
  const totalOrders = orderSummary?.total_orders ?? overview?.counts.orders ?? 0
  const totalProducts = overview?.counts.products ?? 0
  const totalUnits = orderSummary?.units_sold ?? overview?.counts.units_sold ?? 0
  const newOrders = orderSummary?.new_orders ?? 0
  const avgOrderValue = Number(overview?.average_order_value ?? 0)
  const netEarnings = Number(overview?.money.seller_net_earnings ?? 0)

  const stats = [
    {
      title: "Total Revenue",
      value: formatPrice(totalRevenue),
      change: `${newOrders} new orders`,
      trend: "up" as const,
      icon: DollarSign,
      description: "Gross sales (30d)",
    },
    {
      title: "Orders",
      value: totalOrders.toLocaleString(),
      change: `${orderSummary?.delivered_orders ?? 0} delivered`,
      trend: "up" as const,
      icon: ShoppingBag,
      description: `${orderSummary?.processing_orders ?? 0} processing`,
    },
    {
      title: "Products",
      value: totalProducts.toLocaleString(),
      change: `${orderSummary?.ready_to_ship_orders ?? 0} ready to ship`,
      trend: "up" as const,
      icon: Package,
      description: "Active listings",
    },
    {
      title: "Units Sold",
      value: totalUnits.toLocaleString(),
      change: formatPrice(avgOrderValue),
      trend: "up" as const,
      icon: Users,
      description: "Avg order value",
    },
  ]

  const chartData = sales.map((s) => ({
    period: s.period,
    amount: Number(s.amount),
    orders: s.order_count,
  }))

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Dashboard</h2>
          <p className="text-sm text-muted-foreground">
            Welcome back! Here&apos;s what&apos;s happening with your store today.
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/seller/products/new">
            <Plus className="size-4" />
            Add Product
          </Link>
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
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
                {stat.trend === "up" ? (
                  <ArrowUpRight className="size-3 text-green-500" />
                ) : (
                  <ArrowUpRight className="size-3 text-green-500" />
                )}
                <span className={stat.trend === "up" ? "text-green-500" : "text-red-500"}>
                  {stat.change}
                </span>
                <span className="text-muted-foreground">{stat.description}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Revenue Area Chart + Top Products */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle>Revenue Overview</CardTitle>
            <CardDescription>Daily revenue for the last 30 days</CardDescription>
          </CardHeader>
          <CardContent>
            {chartData.length === 0 ? (
              <div className="flex h-[300px] items-center justify-center text-sm text-muted-foreground">
                No sales data for this period yet.
              </div>
            ) : (
              <ChartContainer config={chartConfig} className="h-[300px] w-full">
                <AreaChart data={chartData} margin={{ left: 12, right: 12, top: 8, bottom: 8 }}>
                  <defs>
                    <linearGradient id="fillAmount" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--color-amount)" stopOpacity={0.5} />
                      <stop offset="100%" stopColor="var(--color-amount)" stopOpacity={0.05} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" />
                  <XAxis
                    dataKey="period"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    minTickGap={24}
                    fontSize={11}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                    fontSize={11}
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Area
                    type="monotone"
                    dataKey="amount"
                    stroke="var(--color-amount)"
                    strokeWidth={2}
                    fill="url(#fillAmount)"
                    name="Revenue"
                  />
                </AreaChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Top Products</CardTitle>
            <CardDescription>Best performing products (30d)</CardDescription>
          </CardHeader>
          <CardContent>
            {products.length === 0 ? (
              <div className="flex h-[300px] items-center justify-center text-sm text-muted-foreground">
                No product sales yet.
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {products.map((product, idx) => (
                  <Link
                    key={product.id}
                    href="/dashboard/seller/products"
                    className="flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-muted/50"
                  >
                    <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-sm font-medium text-primary">
                      {idx + 1}
                    </div>
                    <div className="flex min-w-0 flex-1 flex-col">
                      <span className="truncate text-sm font-medium">{product.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {product.units} sold · {product.order_count} orders
                      </span>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium">{formatPrice(Number(product.gross_sales))}</div>
                      <div className="text-xs text-green-600">
                        {formatPrice(Number(product.net_earnings))} net
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Order Status Bar Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Orders by Status</CardTitle>
          <CardDescription>Current order distribution</CardDescription>
        </CardHeader>
        <CardContent>
          {orderSummary && orderSummary.total_orders > 0 ? (
            <ChartContainer config={chartConfig} className="h-[200px] w-full">
              <BarChart
                data={[
                  { name: "New", count: orderSummary.new_orders },
                  { name: "Accepted", count: orderSummary.accepted_orders },
                  { name: "Processing", count: orderSummary.processing_orders },
                  { name: "Ready", count: orderSummary.ready_to_ship_orders },
                  { name: "Shipped", count: orderSummary.shipped_orders },
                  { name: "Delivered", count: orderSummary.delivered_orders },
                ]}
                margin={{ left: 12, right: 12, top: 8, bottom: 8 }}
              >
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis dataKey="name" tickLine={false} axisLine={false} fontSize={11} />
                <YAxis tickLine={false} axisLine={false} allowDecimals={false} fontSize={11} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="count" fill="var(--color-amount)" radius={[4, 4, 0, 0]} name="Orders" />
              </BarChart>
            </ChartContainer>
          ) : (
            <div className="flex h-[200px] items-center justify-center text-sm text-muted-foreground">
              No orders yet.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Orders */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Recent Orders</CardTitle>
              <CardDescription>Latest orders from your store</CardDescription>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href="/dashboard/seller/orders">View All</Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {recentOrders.length === 0 ? (
            <div className="flex h-24 items-center justify-center text-sm text-muted-foreground">
              No orders yet. Orders will appear here once customers start buying.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentOrders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">
                      <Link href="/dashboard/seller/orders" className="hover:underline">
                        #{order.order_id.slice(0, 8)}
                      </Link>
                    </TableCell>
                    <TableCell>{order.customer_name}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {order.item_count} {order.item_count === 1 ? "item" : "items"}
                    </TableCell>
                    <TableCell className="font-medium">{formatPrice(Number(order.seller_subtotal))}</TableCell>
                    <TableCell>
                      <Badge variant={statusBadgeVariant[order.seller_status] ?? "outline"}>
                        {order.seller_status.replace(/_/g, " ")}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Clock className="size-3" />
                        {formatDate(order.created_at)}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Net Earnings Summary */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Net Earnings</CardTitle>
            <TrendingUp className="size-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatPrice(netEarnings)}</div>
            <p className="mt-1 text-xs text-muted-foreground">After platform commission</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Commission Paid</CardTitle>
            <DollarSign className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatPrice(Number(overview?.money.commission_revenue ?? 0))}</div>
            <p className="mt-1 text-xs text-muted-foreground">Platform commission (30d)</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Wallet Balance</CardTitle>
            <DollarSign className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatPrice(Number(overview?.available_wallet_balance ?? 0))}</div>
            <p className="mt-1 text-xs text-muted-foreground">
              {formatPrice(Number(overview?.pending_wallet_balance ?? 0))} pending
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
