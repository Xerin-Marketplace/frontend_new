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
  ShoppingCart,
  Package,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  Wallet,
} from "lucide-react"
import { TShIcon } from "@/components/tsh-icon"
import { api, type ApiError } from "@/lib/api"
import { StatsCardSkeleton, TableSkeleton, PageSkeleton } from "@/components/skeletons"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "@/components/ui/toast"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
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

const unitsChartConfig = {
  units: { label: "Units Sold", color: "hsl(var(--chart-3))" },
} satisfies ChartConfig

export default function SellerAnalyticsPage() {
  const [range, setRange] = React.useState<"7d" | "30d" | "90d">("7d")
  const [overview, setOverview] = React.useState<AnalyticsOverview | null>(null)
  const [sales, setSales] = React.useState<AnalyticsSeriesPoint[]>([])
  const [products, setProducts] = React.useState<AnalyticsRankingRow[]>([])
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    const days = range === "7d" ? 7 : range === "30d" ? 30 : 90
    const params = `?days=${days}`
    setLoading(true)
    Promise.all([
      api.get<AnalyticsOverview>(`/analytics/seller/me/overview${params}`),
      api.get<AnalyticsSeriesPoint[]>(`/analytics/seller/me/sales${params}`),
      api.get<AnalyticsRankingRow[]>(`/analytics/seller/me/products${params}`),
    ])
      .then(([o, s, p]) => {
        setOverview(o)
        setSales(s)
        setProducts(p)
      })
      .catch((err) => {
        toast.add({
          title: "Failed to load analytics",
          description: getApiError(err),
          type: "error",
        })
      })
      .finally(() => setLoading(false))
  }, [range])

  if (loading) {
    return (
      <PageSkeleton>
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => <StatsCardSkeleton key={i} />)}
        </div>
        <Skeleton className="h-64 w-full" />
        <Card><TableSkeleton rows={5} cols={6} /></Card>
      </PageSkeleton>
    )
  }

  const totalRevenue = Number(overview?.money.gross_sales ?? 0)
  const totalOrders = overview?.counts.orders ?? 0
  const avgOrderValue = Number(overview?.average_order_value ?? 0)
  const totalUnits = overview?.counts.units_sold ?? 0
  const netEarnings = Number(overview?.money.seller_net_earnings ?? 0)
  const commissionPaid = Number(overview?.money.commission_revenue ?? 0)
  const refundRate = Number(overview?.refund_rate_percent ?? 0)
  const refundedOrders = overview?.counts.refunded_orders ?? 0

  const chartData = sales.map((s) => ({
    period: s.period,
    amount: Number(s.amount),
    orders: s.order_count,
    units: s.units,
  }))

  const productBarData = products.slice(0, 5).map((p) => ({
    name: p.name.length > 15 ? p.name.slice(0, 15) + "…" : p.name,
    sales: Number(p.gross_sales),
    units: p.units,
  }))

  const stats = [
    {
      title: "Total Revenue",
      value: formatPrice(totalRevenue),
      sub: "Gross sales",
      icon: TrendingUp,
      trend: "up" as const,
      color: "text-chart-1",
      bg: "bg-chart-1/10",
    },
    {
      title: "Total Orders",
      value: totalOrders.toLocaleString(),
      sub: `${overview?.counts.paid_orders ?? 0} paid`,
      icon: ShoppingCart,
      trend: "up" as const,
      color: "text-chart-2",
      bg: "bg-chart-2/10",
    },
    {
      title: "Avg Order Value",
      value: formatPrice(Math.round(avgOrderValue)),
      sub: "Per order",
      icon: TShIcon,
      trend: "up" as const,
      color: "text-chart-3",
      bg: "bg-chart-3/10",
    },
    {
      title: "Units Sold",
      value: totalUnits.toLocaleString(),
      sub: "Total units",
      icon: Package,
      trend: "up" as const,
      color: "text-chart-4",
      bg: "bg-chart-4/10",
    },
  ]

  const secondaryStats = [
    { title: "Net Earnings", value: formatPrice(netEarnings), icon: TrendingUp, color: "text-green-600" },
    { title: "Commission Paid", value: formatPrice(commissionPaid), icon: TShIcon, color: "text-muted-foreground" },
    { title: "Refund Rate", value: `${refundRate.toFixed(1)}%`, icon: RefreshCw, color: "text-muted-foreground" },
    { title: "Wallet Available", value: formatPrice(Number(overview?.available_wallet_balance ?? 0)), icon: Wallet, color: "text-muted-foreground" },
  ]

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="animate-fade-in-up">
          <h2 className="text-2xl font-bold tracking-tight">Analytics</h2>
          <p className="text-sm text-muted-foreground">Track your store performance, sales, and product insights.</p>
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
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
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
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {secondaryStats.map((stat, i) => (
          <Card
            key={stat.title}
            className={`opacity-0-init animate-fade-in-up animation-delay-${i * 100 + 400}`}
          >
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <stat.icon className={`size-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Sales Area Chart + Units Bar Chart */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="lg:col-span-4 opacity-0-init animate-fade-in-scale animation-delay-500">
          <CardHeader>
            <CardTitle>Sales & Orders Trend</CardTitle>
            <CardDescription>Revenue and order count over time</CardDescription>
          </CardHeader>
          <CardContent>
            {chartData.length === 0 ? (
              <div className="flex h-[300px] items-center justify-center text-sm text-muted-foreground">
                No sales data for this period.
              </div>
            ) : (
              <ChartContainer config={salesChartConfig} className="h-[300px] w-full">
                <AreaChart data={chartData} margin={{ left: 12, right: 12, top: 8, bottom: 8 }}>
                  <defs>
                    <linearGradient id="sellerFillAmount" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--color-amount)" stopOpacity={0.5} />
                      <stop offset="100%" stopColor="var(--color-amount)" stopOpacity={0.05} />
                    </linearGradient>
                    <linearGradient id="sellerFillOrders" x1="0" y1="0" x2="0" y2="1">
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
                    fill="url(#sellerFillAmount)"
                    name="Revenue"
                  />
                  <Area
                    yAxisId="right"
                    type="monotone"
                    dataKey="orders"
                    stroke="var(--color-orders)"
                    strokeWidth={2}
                    fill="url(#sellerFillOrders)"
                    name="Orders"
                  />
                </AreaChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-3 opacity-0-init animate-fade-in-scale animation-delay-700">
          <CardHeader>
            <CardTitle>Units Sold</CardTitle>
            <CardDescription>Daily units sold over time</CardDescription>
          </CardHeader>
          <CardContent>
            {chartData.length === 0 ? (
              <div className="flex h-[300px] items-center justify-center text-sm text-muted-foreground">
                No units data for this period.
              </div>
            ) : (
              <ChartContainer config={unitsChartConfig} className="h-[300px] w-full">
                <BarChart data={chartData} margin={{ left: 12, right: 12, top: 8, bottom: 8 }}>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" />
                  <XAxis
                    dataKey="period"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    minTickGap={24}
                    fontSize={11}
                  />
                  <YAxis tickLine={false} axisLine={false} allowDecimals={false} fontSize={11} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="units" fill="var(--color-units)" radius={[4, 4, 0, 0]} name="Units" />
                </BarChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Top Products Bar Chart */}
      {productBarData.length > 0 && (
        <Card className="opacity-0-init animate-fade-in-up animation-delay-500">
          <CardHeader>
            <CardTitle>Top Products by Revenue</CardTitle>
            <CardDescription>Best performing products this period</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={salesChartConfig} className="h-[250px] w-full">
              <BarChart data={productBarData} margin={{ left: 12, right: 12, top: 8, bottom: 8 }}>
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

      {/* Top Products Table */}
      <Card className="opacity-0-init animate-fade-in-up animation-delay-500">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="size-4" /> Top Performing Products
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Units Sold</TableHead>
                <TableHead>Revenue</TableHead>
                <TableHead>Orders</TableHead>
                <TableHead>Net Earnings</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">No product data for this period.</TableCell>
                </TableRow>
              ) : (
                products.map((p, idx) => (
                  <TableRow key={p.id} className="transition-colors hover:bg-muted/30">
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <span className="flex size-6 items-center justify-center rounded bg-primary/10 text-xs font-bold text-primary">
                          {idx + 1}
                        </span>
                        {p.name}
                      </div>
                    </TableCell>
                    <TableCell>{p.units}</TableCell>
                    <TableCell className="font-medium">{formatPrice(Number(p.gross_sales))}</TableCell>
                    <TableCell>{p.order_count}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-green-600">{formatPrice(Number(p.net_earnings))}</Badge>
                    </TableCell>
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
