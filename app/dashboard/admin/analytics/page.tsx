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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  TrendingUp,
  DollarSign,
  ShoppingBag,
  Store,
  Package,
  RefreshCw,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react"
import { api, type ApiError } from "@/lib/api"
import { StatsCardSkeleton, TableSkeleton, PageSkeleton } from "@/components/skeletons"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "@/components/ui/toast"
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

type AnalyticsMoneySummary = {
  currency: string
  gross_sales: number
  commission_revenue: number
  seller_net_earnings: number
  refunds_completed: number
  payouts_completed: number
}

type AnalyticsCountSummary = {
  orders: number
  paid_orders: number
  refunded_orders: number
  active_sellers: number
  products: number
  units_sold: number
}

type AnalyticsOverview = {
  start_at: string
  end_at: string
  money: AnalyticsMoneySummary
  counts: AnalyticsCountSummary
  average_order_value: number
  refund_rate_percent: number
  pending_wallet_balance: number
  available_wallet_balance: number
  pending_payout_amount: number
}

type AnalyticsSeriesPoint = {
  period: string
  amount: number
  order_count: number
  units: number
}

type AnalyticsRankingRow = {
  id: string
  name: string
  gross_sales: number
  net_earnings: number
  commission: number
  refunds: number
  order_count: number
  units: number
}

function formatPrice(price: number): string {
  return `TSh ${Number(price).toLocaleString()}`
}

function getApiError(err: unknown): string {
  const e = err as ApiError
  return e?.detail || "Something went wrong. Please try again."
}

const salesChartConfig = {
  amount: { label: "Revenue", color: "hsl(var(--chart-1))" },
  orders: { label: "Orders", color: "hsl(var(--chart-2))" },
} satisfies ChartConfig

const pieConfig = {
  value: { label: "Orders" },
  paid: { label: "Paid Orders", color: "hsl(var(--chart-2))" },
  refunded: { label: "Refunded", color: "hsl(var(--destructive))" },
  pending: { label: "Pending", color: "hsl(var(--chart-4))" },
} satisfies ChartConfig

const PIE_COLORS = ["hsl(var(--chart-2))", "hsl(var(--chart-4))", "hsl(var(--destructive))"]

export default function AdminAnalyticsPage() {
  const [range, setRange] = React.useState<"7d" | "30d" | "90d">("30d")
  const [overview, setOverview] = React.useState<AnalyticsOverview | null>(null)
  const [sales, setSales] = React.useState<AnalyticsSeriesPoint[]>([])
  const [topSellers, setTopSellers] = React.useState<AnalyticsRankingRow[]>([])
  const [topProducts, setTopProducts] = React.useState<AnalyticsRankingRow[]>([])
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    const days = range === "7d" ? 7 : range === "30d" ? 30 : 90
    const end = new Date()
    const start = new Date(end.getTime() - days * 24 * 60 * 60 * 1000)
    const params = `?start_at=${start.toISOString()}&end_at=${end.toISOString()}`
    setLoading(true)
    Promise.all([
      api.get<AnalyticsOverview>(`/analytics/admin/overview${params}`),
      api.get<AnalyticsSeriesPoint[]>(`/analytics/admin/sales${params}`),
      api.get<AnalyticsRankingRow[]>(`/analytics/admin/sellers${params}`),
      api.get<AnalyticsRankingRow[]>(`/analytics/admin/products${params}`),
    ])
      .then(([o, s, sellers, products]) => {
        setOverview(o)
        setSales(s)
        setTopSellers(sellers)
        setTopProducts(products)
      })
      .catch((err) => {
        toast.add({ title: "Failed to load analytics", description: getApiError(err), type: "error" })
      })
      .finally(() => setLoading(false))
  }, [range])

  if (loading) {
    return (
      <PageSkeleton>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => <StatsCardSkeleton key={i} />)}
        </div>
        <Skeleton className="h-64 w-full" />
        <Card><TableSkeleton rows={5} cols={4} /></Card>
      </PageSkeleton>
    )
  }

  const chartData = sales.map((s) => ({
    period: s.period,
    amount: Number(s.amount),
    orders: s.order_count,
    units: s.units,
  }))

  const orderDistribution = [
    { name: "Paid", value: overview?.counts.paid_orders ?? 0, key: "paid" },
    { name: "Pending", value: Math.max(0, (overview?.counts.orders ?? 0) - (overview?.counts.paid_orders ?? 0) - (overview?.counts.refunded_orders ?? 0)), key: "pending" },
    { name: "Refunded", value: overview?.counts.refunded_orders ?? 0, key: "refunded" },
  ].filter((d) => d.value > 0)

  const sellerBarData = topSellers.slice(0, 5).map((s) => ({
    name: s.name.length > 12 ? s.name.slice(0, 12) + "…" : s.name,
    sales: Number(s.gross_sales),
    orders: s.order_count,
  }))

  const stats = [
    {
      title: "Gross Sales",
      value: formatPrice(Number(overview?.money.gross_sales ?? 0)),
      sub: "Total platform sales",
      icon: DollarSign,
      trend: "up" as const,
      color: "text-chart-1",
      bg: "bg-chart-1/10",
    },
    {
      title: "Total Orders",
      value: (overview?.counts.orders ?? 0).toLocaleString(),
      sub: `${overview?.counts.paid_orders ?? 0} paid`,
      icon: ShoppingBag,
      trend: "up" as const,
      color: "text-chart-2",
      bg: "bg-chart-2/10",
    },
    {
      title: "Active Sellers",
      value: (overview?.counts.active_sellers ?? 0).toLocaleString(),
      sub: `${overview?.counts.products ?? 0} products`,
      icon: Store,
      trend: "up" as const,
      color: "text-chart-3",
      bg: "bg-chart-3/10",
    },
    {
      title: "Commission",
      value: formatPrice(Number(overview?.money.commission_revenue ?? 0)),
      sub: "Platform earnings",
      icon: TrendingUp,
      trend: "up" as const,
      color: "text-green-600",
      bg: "bg-green-500/10",
    },
  ]

  const secondaryStats = [
    { title: "Avg Order Value", value: formatPrice(Number(overview?.average_order_value ?? 0)), icon: DollarSign },
    { title: "Units Sold", value: (overview?.counts.units_sold ?? 0).toLocaleString(), icon: Package },
    { title: "Refund Rate", value: `${Number(overview?.refund_rate_percent ?? 0).toFixed(1)}%`, icon: RefreshCw },
    { title: "Pending Payouts", value: formatPrice(Number(overview?.pending_payout_amount ?? 0)), icon: Wallet },
  ]

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="animate-fade-in-up">
          <h2 className="text-2xl font-bold tracking-tight">Analytics</h2>
          <p className="text-sm text-muted-foreground">Platform-wide analytics and insights.</p>
        </div>
        <div className="flex gap-1 rounded-lg border p-1 animate-fade-in-scale">
          {(["7d", "30d", "90d"] as const).map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition-all duration-200 ${
                range === r
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              }`}
            >
              {r === "7d" ? "7 Days" : r === "30d" ? "30 Days" : "90 Days"}
            </button>
          ))}
        </div>
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

      {/* Secondary Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {secondaryStats.map((stat, i) => (
          <Card
            key={stat.title}
            className={`opacity-0-init animate-fade-in-up animation-delay-${i * 100 + 400}`}
          >
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <stat.icon className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Sales Area Chart + Order Distribution Pie */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="lg:col-span-4 opacity-0-init animate-fade-in-scale animation-delay-500">
          <CardHeader>
            <CardTitle>Sales & Orders Trend</CardTitle>
            <CardDescription>Revenue and order count over time</CardDescription>
          </CardHeader>
          <CardContent>
            {chartData.length === 0 ? (
              <div className="flex h-[300px] items-center justify-center text-sm text-muted-foreground">
                No sales data available.
              </div>
            ) : (
              <ChartContainer config={salesChartConfig} className="h-[300px] w-full">
                <AreaChart data={chartData} margin={{ left: 12, right: 12, top: 8, bottom: 8 }}>
                  <defs>
                    <linearGradient id="fillAmount" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--color-amount)" stopOpacity={0.5} />
                      <stop offset="100%" stopColor="var(--color-amount)" stopOpacity={0.05} />
                    </linearGradient>
                    <linearGradient id="fillOrders" x1="0" y1="0" x2="0" y2="1">
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
                    minTickGap={24}
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
                    fill="url(#fillAmount)"
                    name="Revenue"
                  />
                  <Area
                    yAxisId="right"
                    type="monotone"
                    dataKey="orders"
                    stroke="var(--color-orders)"
                    strokeWidth={2}
                    fill="url(#fillOrders)"
                    name="Orders"
                  />
                </AreaChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-3 opacity-0-init animate-fade-in-scale animation-delay-700">
          <CardHeader>
            <CardTitle>Order Distribution</CardTitle>
            <CardDescription>Paid vs pending vs refunded</CardDescription>
          </CardHeader>
          <CardContent>
            {orderDistribution.length === 0 ? (
              <div className="flex h-[300px] items-center justify-center text-sm text-muted-foreground">
                No order data available.
              </div>
            ) : (
              <ChartContainer config={pieConfig} className="mx-auto h-[300px]">
                <PieChart>
                  <Pie
                    data={orderDistribution}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={90}
                    innerRadius={50}
                    paddingAngle={4}
                  >
                    {orderDistribution.map((entry, index) => (
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

      {/* Top Sellers Bar Chart */}
      {sellerBarData.length > 0 && (
        <Card className="opacity-0-init animate-fade-in-up animation-delay-500">
          <CardHeader>
            <CardTitle>Top Sellers by Revenue</CardTitle>
            <CardDescription>Gross sales comparison</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={salesChartConfig} className="h-[250px] w-full">
              <BarChart data={sellerBarData} margin={{ left: 12, right: 12, top: 8, bottom: 8 }}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis dataKey="name" tickLine={false} axisLine={false} fontSize={11} />
                <YAxis tickLine={false} axisLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} fontSize={11} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="sales" fill="var(--color-amount)" radius={[4, 4, 0, 0]} name="Gross Sales" />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      )}

      {/* Top Sellers Table */}
      <Card className="opacity-0-init animate-fade-in-up animation-delay-500">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Store className="size-4" /> Top Sellers
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Seller</TableHead>
                <TableHead>Gross Sales</TableHead>
                <TableHead>Net Earnings</TableHead>
                <TableHead>Orders</TableHead>
                <TableHead>Units</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {topSellers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">No seller data for this period.</TableCell>
                </TableRow>
              ) : (
                topSellers.map((s, idx) => (
                  <TableRow key={s.id} className="transition-colors hover:bg-muted/30">
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <span className="flex size-6 items-center justify-center rounded bg-primary/10 text-xs font-bold text-primary">{idx + 1}</span>
                        {s.name}
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">{formatPrice(Number(s.gross_sales))}</TableCell>
                    <TableCell>{formatPrice(Number(s.net_earnings))}</TableCell>
                    <TableCell>{s.order_count}</TableCell>
                    <TableCell>{s.units}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Top Products Table */}
      <Card className="opacity-0-init animate-fade-in-up animation-delay-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="size-4" /> Top Products
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Gross Sales</TableHead>
                <TableHead>Commission</TableHead>
                <TableHead>Orders</TableHead>
                <TableHead>Units</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {topProducts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">No product data for this period.</TableCell>
                </TableRow>
              ) : (
                topProducts.map((p, idx) => (
                  <TableRow key={p.id} className="transition-colors hover:bg-muted/30">
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <span className="flex size-6 items-center justify-center rounded bg-primary/10 text-xs font-bold text-primary">{idx + 1}</span>
                        {p.name}
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">{formatPrice(Number(p.gross_sales))}</TableCell>
                    <TableCell>{formatPrice(Number(p.commission))}</TableCell>
                    <TableCell>{p.order_count}</TableCell>
                    <TableCell>{p.units}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
