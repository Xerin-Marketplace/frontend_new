"use client"

import * as React from "react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ShoppingBag,
  DollarSign,
  Package,
  ArrowUpRight,
  ArrowDownRight,
  TrendingUp,
} from "lucide-react"
import { api, type ApiError } from "@/lib/api"
import { StatsCardSkeleton, PageSkeleton } from "@/components/skeletons"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "@/components/ui/toast"
import { formatPrice } from "@/lib/store-types"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from "@/components/ui/chart"
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
  XAxis,
  YAxis,
} from "recharts"

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

function getApiError(err: unknown): string {
  const e = err as ApiError
  return e?.detail || "Something went wrong. Please try again."
}

const spendingChartConfig = {
  amount: { label: "Spending", color: "hsl(var(--chart-1))" },
  orders: { label: "Orders", color: "hsl(var(--chart-2))" },
} satisfies ChartConfig

const pieConfig = {
  value: { label: "Orders" },
  delivered: { label: "Delivered", color: "hsl(var(--chart-2))" },
  shipped: { label: "Shipped", color: "hsl(var(--chart-3))" },
  processing: { label: "Processing", color: "hsl(var(--chart-4))" },
  pending: { label: "Pending", color: "hsl(var(--chart-5))" },
  cancelled: { label: "Cancelled", color: "hsl(var(--destructive))" },
} satisfies ChartConfig

const PIE_COLORS = [
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
  "hsl(var(--destructive))",
]

export default function UserAnalyticsPage() {
  const [orders, setOrders] = React.useState<Order[]>([])
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    api.get<{ results: Order[]; total: number }>("/orders/my-orders?page=1&page_size=100")
      .then((data) => {
        setOrders(Array.isArray(data?.results) ? data.results : Array.isArray(data) ? data : [])
      })
      .catch((err) => {
        toast.add({ title: "Failed to load analytics", description: getApiError(err), type: "error" })
      })
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <PageSkeleton>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => <StatsCardSkeleton key={i} />)}
        </div>
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-64 w-full" />
      </PageSkeleton>
    )
  }

  const totalOrders = orders.length
  const totalSpent = orders.reduce((sum, o) => sum + Number(o.total_amount), 0)
  const deliveredCount = orders.filter((o) => o.status === "delivered").length
  const pendingDeliveries = orders.filter((o) => o.status === "shipped" || o.status === "processing" || o.status === "confirmed").length
  const avgOrderValue = totalOrders > 0 ? totalSpent / totalOrders : 0

  // Group orders by month for spending trend
  const monthlyData = React.useMemo(() => {
    const map = new Map<string, { amount: number; orders: number }>()
    orders.forEach((o) => {
      const d = new Date(o.created_at)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
      const existing = map.get(key) ?? { amount: 0, orders: 0 }
      existing.amount += Number(o.total_amount)
      existing.orders += 1
      map.set(key, existing)
    })
    return Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-6)
      .map(([period, data]) => ({
        period: new Date(period + "-01").toLocaleDateString("en", { month: "short", year: "2-digit" }),
        amount: data.amount,
        orders: data.orders,
      }))
  }, [orders])

  // Order status distribution
  const statusDistribution = React.useMemo(() => {
    const map = new Map<string, number>()
    orders.forEach((o) => {
      map.set(o.status, (map.get(o.status) ?? 0) + 1)
    })
    return Array.from(map.entries())
      .map(([status, count]) => ({ name: status.charAt(0).toUpperCase() + status.slice(1), value: count, key: status }))
      .filter((d) => d.value > 0)
  }, [orders])

  // Top purchased products
  const topProducts = React.useMemo(() => {
    const map = new Map<string, { name: string; units: number; total: number }>()
    orders.forEach((o) => {
      o.items?.forEach((item) => {
        const existing = map.get(item.product_id) ?? { name: item.product_name, units: 0, total: 0 }
        existing.units += item.quantity
        existing.total += Number(item.total_price)
        map.set(item.product_id, existing)
      })
    })
    return Array.from(map.values())
      .sort((a, b) => b.units - a.units)
      .slice(0, 5)
  }, [orders])

  const stats = [
    {
      title: "Total Orders",
      value: totalOrders.toLocaleString(),
      sub: "All time",
      icon: ShoppingBag,
      trend: "up" as const,
      color: "text-chart-1",
      bg: "bg-chart-1/10",
    },
    {
      title: "Total Spent",
      value: formatPrice(totalSpent),
      sub: "All time",
      icon: DollarSign,
      trend: "up" as const,
      color: "text-chart-2",
      bg: "bg-chart-2/10",
    },
    {
      title: "Avg Order Value",
      value: formatPrice(Math.round(avgOrderValue)),
      sub: "Per order",
      icon: TrendingUp,
      trend: "up" as const,
      color: "text-chart-3",
      bg: "bg-chart-3/10",
    },
    {
      title: "Delivered",
      value: deliveredCount.toLocaleString(),
      sub: `${pendingDeliveries} in transit`,
      icon: Package,
      trend: "up" as const,
      color: "text-chart-4",
      bg: "bg-chart-4/10",
    },
  ]

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="animate-fade-in-up">
        <h2 className="text-2xl font-bold tracking-tight">Spending Analytics</h2>
        <p className="text-sm text-muted-foreground">Track your shopping activity, spending patterns, and order insights.</p>
      </div>

      {/* Primary Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, i) => (
          <Card
            key={stat.title}
            className={`opacity-0-init animate-fade-in-up animation-delay-${i * 100}`}
          >
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <div className={`flex size-8 items-center justify-center rounded-lg ${stat.bg}`}>
                <stat.icon className={`size-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold animate-count-up">{stat.value}</div>
              <div className="mt-1 flex items-center gap-1 text-xs">
                {stat.trend === "up" ? (
                  <ArrowUpRight className="size-3 text-green-500" />
                ) : (
                  <ArrowDownRight className="size-3 text-red-500" />
                )}
                <span className="text-muted-foreground">{stat.sub}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Spending Trend + Order Status Pie */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="lg:col-span-4 opacity-0-init animate-fade-in-scale animation-delay-500">
          <CardHeader>
            <CardTitle>Spending Trend</CardTitle>
            <CardDescription>Monthly spending and order count (last 6 months)</CardDescription>
          </CardHeader>
          <CardContent>
            {monthlyData.length === 0 ? (
              <div className="flex h-[300px] items-center justify-center text-sm text-muted-foreground">
                No spending data yet.
              </div>
            ) : (
              <ChartContainer config={spendingChartConfig} className="h-[300px] w-full">
                <AreaChart data={monthlyData} margin={{ left: 12, right: 12, top: 8, bottom: 8 }}>
                  <defs>
                    <linearGradient id="userFillAmount" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--color-amount)" stopOpacity={0.5} />
                      <stop offset="100%" stopColor="var(--color-amount)" stopOpacity={0.05} />
                    </linearGradient>
                    <linearGradient id="userFillOrders" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--color-orders)" stopOpacity={0.4} />
                      <stop offset="100%" stopColor="var(--color-orders)" stopOpacity={0.05} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" />
                  <XAxis
                    dataKey="period"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    fontSize={11}
                  />
                  <YAxis
                    yAxisId="left"
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                    fontSize={11}
                  />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    tickLine={false}
                    axisLine={false}
                    allowDecimals={false}
                    fontSize={11}
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Area
                    yAxisId="left"
                    type="monotone"
                    dataKey="amount"
                    stroke="var(--color-amount)"
                    strokeWidth={2}
                    fill="url(#userFillAmount)"
                    name="Spending"
                  />
                  <Area
                    yAxisId="right"
                    type="monotone"
                    dataKey="orders"
                    stroke="var(--color-orders)"
                    strokeWidth={2}
                    fill="url(#userFillOrders)"
                    name="Orders"
                  />
                </AreaChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-3 opacity-0-init animate-fade-in-scale animation-delay-700">
          <CardHeader>
            <CardTitle>Order Status</CardTitle>
            <CardDescription>Distribution of your orders by status</CardDescription>
          </CardHeader>
          <CardContent>
            {statusDistribution.length === 0 ? (
              <div className="flex h-[300px] items-center justify-center text-sm text-muted-foreground">
                No orders yet.
              </div>
            ) : (
              <ChartContainer config={pieConfig} className="mx-auto h-[300px]">
                <PieChart>
                  <Pie
                    data={statusDistribution}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={90}
                    innerRadius={50}
                    paddingAngle={4}
                  >
                    {statusDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <ChartTooltip content={<ChartTooltipContent nameKey="name" />} />
                  <ChartLegend content={<ChartLegendContent nameKey="name" />} />
                </PieChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Top Products Bar Chart */}
      {topProducts.length > 0 && (
        <Card className="opacity-0-init animate-fade-in-up animation-delay-500">
          <CardHeader>
            <CardTitle>Most Purchased Products</CardTitle>
            <CardDescription>Products you buy the most (by units)</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={spendingChartConfig} className="h-[250px] w-full">
              <BarChart
                data={topProducts.map((p) => ({
                  name: p.name.length > 15 ? p.name.slice(0, 15) + "…" : p.name,
                  units: p.units,
                }))}
                margin={{ left: 12, right: 12, top: 8, bottom: 8 }}
              >
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis dataKey="name" tickLine={false} axisLine={false} fontSize={11} />
                <YAxis tickLine={false} axisLine={false} allowDecimals={false} fontSize={11} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="units" fill="var(--color-amount)" radius={[4, 4, 0, 0]} name="Units" />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      )}

      {/* Top Products Table */}
      {topProducts.length > 0 && (
        <Card className="opacity-0-init animate-fade-in-up animation-delay-700">
          <CardHeader>
            <CardTitle>Purchase History Summary</CardTitle>
            <CardDescription>Your most purchased products</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-3">
              {topProducts.map((p, idx) => (
                <div key={idx} className="flex items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/30">
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-sm font-medium text-primary">
                    {idx + 1}
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate text-sm font-medium">{p.name}</span>
                    <span className="text-xs text-muted-foreground">{p.units} units purchased</span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium">{formatPrice(p.total)}</div>
                    <div className="text-xs text-muted-foreground">total spent</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
