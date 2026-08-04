"use client"

import * as React from "react"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
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
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  TrendingUp,
  ShoppingBag,
  Store,
  Package,
  RefreshCw,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  Users,
  CreditCard,
  Truck,
  Bell,
  Search,
  Eye,
  AlertTriangle,
  Activity,
  Smartphone,
  CheckCircle,
  XCircle,
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
  LabelList,
} from "recharts"

// ─── Types ──────────────────────────────────────────────────────────────────

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

type DashboardSummary = {
  period: { start: string; end: string }
  gmv: string
  orders: number
  customers: number
  active_sellers: number
  pending_sellers: number
  approved_products: number
  pending_products: number
  failed_payments: number
  pending_refunds: number
  unresolved_question_reports: number
  failed_notifications: number
  open_alerts: number
}

type OrderStatusBreakdown = Record<string, number>

type CustomerStats = { total: number; verified: number }
type PaymentStats = { total: number; failed: number; successful: number }
type RefundStats = { total: number; pending: number }
type DeliveryStats = { total: number; failed: number }
type NotificationStats = { total: number; failed: number }
type SellerStats = { total: number; approved: number; pending: number }
type ProductStats = { total: number; approved: number; pending_review: number }

type SearchStats = {
  top_searches: { term: string; search_count: number; click_count: number }[]
  most_viewed_products: { product_id: string; views: number }[]
}

type SystemAlert = {
  id: string
  type: string
  severity: string
  title: string
  message: string
  resolved: boolean
  created_at: string
}

type ActivityLog = {
  id: string
  admin_user_id: string | null
  action: string
  resource_type: string
  resource_id: string | null
  details: string | null
  created_at: string
}

type Reconciliation = {
  currency: string
  gross_sales: number
  commission_revenue: number
  seller_net_earnings: number
  refunds_completed: number
  payouts_completed: number
  pending_wallet_balance: number
  available_wallet_balance: number
  pending_payout_amount: number
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatPrice(price: number): string {
  return `TSh ${Number(price).toLocaleString()}`
}

function getApiError(err: unknown): string {
  const e = err as ApiError
  return e?.detail || "Something went wrong."
}

// ─── Chart Configs ────────────────────────────────────────────────────────────

const salesChartConfig = {
  amount: { label: "Revenue", color: "hsl(var(--chart-1))" },
  orders: { label: "Orders", color: "hsl(var(--chart-2))" },
  units: { label: "Units", color: "hsl(var(--chart-3))" },
} satisfies ChartConfig

const pieConfig = {
  value: { label: "Orders" },
  paid: { label: "Paid", color: "hsl(var(--chart-2))" },
  refunded: { label: "Refunded", color: "hsl(var(--destructive))" },
  pending: { label: "Pending", color: "hsl(var(--chart-4))" },
} satisfies ChartConfig

const sellerBarConfig = {
  sales: { label: "Gross Sales", color: "hsl(var(--chart-1))" },
  label: { color: "var(--background)" },
} satisfies ChartConfig

const productBarConfig = {
  sales: { label: "Gross Sales", color: "hsl(var(--chart-2))" },
  units: { label: "Units", color: "hsl(var(--chart-3))" },
  label: { color: "var(--background)" },
} satisfies ChartConfig

const orderStatusConfig = {
  value: { label: "Orders" },
} satisfies ChartConfig

const PIE_COLORS = ["hsl(var(--chart-2))", "hsl(var(--chart-4))", "hsl(var(--destructive))"]
const STATUS_COLORS = ["hsl(var(--chart-1))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))", "hsl(var(--chart-5))", "#ef4444"]

// ─── Component ───────────────────────────────────────────────────────────────

export default function AdminAnalyticsPage() {
  const [range, setRange] = React.useState<"7d" | "30d" | "90d">("30d")
  const [overview, setOverview] = React.useState<AnalyticsOverview | null>(null)
  const [sales, setSales] = React.useState<AnalyticsSeriesPoint[]>([])
  const [topSellers, setTopSellers] = React.useState<AnalyticsRankingRow[]>([])
  const [topProducts, setTopProducts] = React.useState<AnalyticsRankingRow[]>([])
  const [reconciliation, setReconciliation] = React.useState<Reconciliation | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [refreshKey, setRefreshKey] = React.useState(0)

  React.useEffect(() => {
    const days = range === "7d" ? 7 : range === "30d" ? 30 : 90
    const end = new Date()
    const start = new Date(end.getTime() - days * 24 * 60 * 60 * 1000)
    const params = `?start_at=${start.toISOString()}&end_at=${end.toISOString()}`
    setLoading(true)
    setError(null)
    Promise.allSettled([
      api.get<AnalyticsOverview>(`/analytics/admin/overview${params}`),
      api.get<AnalyticsSeriesPoint[]>(`/analytics/admin/sales${params}`),
      api.get<AnalyticsRankingRow[]>(`/analytics/admin/sellers${params}&limit=5`),
      api.get<AnalyticsRankingRow[]>(`/analytics/admin/products${params}&limit=5`),
      api.get<Reconciliation>(`/analytics/admin/reconciliation${params}`),
    ])
      .then(([oRes, sRes, tsRes, tpRes, recRes]) => {
        if (oRes.status === "fulfilled") setOverview(oRes.value)
        else setError("Analytics data is currently unavailable from Xerin-Gateway.")
        if (sRes.status === "fulfilled") setSales(sRes.value)
        if (tsRes.status === "fulfilled") setTopSellers(tsRes.value)
        if (tpRes.status === "fulfilled") setTopProducts(tpRes.value)
        if (recRes.status === "fulfilled") setReconciliation(recRes.value)
      })
      .finally(() => setLoading(false))
  }, [range, refreshKey])

  if (loading) {
    return (
      <PageSkeleton>
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => <StatsCardSkeleton key={i} />)}
        </div>
        <Skeleton className="h-64 w-full" />
        <div className="grid gap-4 lg:grid-cols-2">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
        <Card><TableSkeleton rows={5} cols={4} /></Card>
      </PageSkeleton>
    )
  }

  if (!overview) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center py-14 text-center">
          <h2 className="font-semibold">Unable to load analytics</h2>
          <p className="mt-2 max-w-lg text-sm text-muted-foreground">
            {error || "The analytics service did not return platform metrics."}
          </p>
          <Button className="mt-5" variant="outline" onClick={() => setRefreshKey((value) => value + 1)}>
            <RefreshCw className="size-4" /> Try again
          </Button>
        </CardContent>
      </Card>
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

  const revenueBreakdown = [
    { name: "Commission", value: Number(overview?.money.commission_revenue ?? 0), color: "hsl(var(--chart-1))" },
    { name: "Seller Earnings", value: Number(overview?.money.seller_net_earnings ?? 0), color: "hsl(var(--chart-2))" },
    { name: "Refunds", value: Number(overview?.money.refunds_completed ?? 0), color: "#ef4444" },
  ].filter((d) => d.value > 0)

  const sellerBarData = topSellers.slice(0, 5).map((s) => ({
    name: s.name.length > 12 ? s.name.slice(0, 12) + "…" : s.name,
    sales: Number(s.gross_sales),
    orders: s.order_count,
  }))

  const productBarData = topProducts.slice(0, 5).map((p) => ({
    name: p.name.length > 15 ? p.name.slice(0, 12) + "…" : p.name,
    sales: Number(p.gross_sales),
    units: p.units,
  }))

  const rangeLabel = range === "7d" ? "last 7 days" : range === "30d" ? "last 30 days" : "last 90 days"

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="animate-fade-in-up">
          <h2 className="text-2xl font-bold tracking-tight">Analytics</h2>
          <p className="text-sm text-muted-foreground">Platform-wide analytics, trends & insights.</p>
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

      {/* ─── Primary Stats ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <Card className="opacity-0-init animate-fade-in-up">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Gross Sales</CardTitle>
            <div className="flex size-8 items-center justify-center rounded-lg bg-chart-1/10">
              <TShIcon className="text-xs text-chart-1" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold animate-count-up">{formatPrice(Number(overview?.money.gross_sales ?? 0))}</div>
            <div className="mt-1 flex items-center gap-1 text-xs">
              <ArrowUpRight className="size-3 text-green-500" />
              <span className="text-muted-foreground">Total platform sales</span>
            </div>
          </CardContent>
        </Card>

        <Card className="opacity-0-init animate-fade-in-up animation-delay-100">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Orders</CardTitle>
            <div className="flex size-8 items-center justify-center rounded-lg bg-chart-2/10">
              <ShoppingBag className="size-4 text-chart-2" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold animate-count-up">{overview?.counts.orders ?? 0}</div>
            <div className="mt-1 flex items-center gap-1 text-xs">
              <ArrowUpRight className="size-3 text-green-500" />
              <span className="text-muted-foreground">{overview?.counts.paid_orders ?? 0} paid</span>
            </div>
          </CardContent>
        </Card>

        <Card className="opacity-0-init animate-fade-in-up animation-delay-200">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Sellers</CardTitle>
            <div className="flex size-8 items-center justify-center rounded-lg bg-chart-3/10">
              <Store className="size-4 text-chart-3" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold animate-count-up">{overview?.counts.active_sellers ?? 0}</div>
            <div className="mt-1 flex items-center gap-1 text-xs">
              <ArrowUpRight className="size-3 text-green-500" />
              <span className="text-muted-foreground">Selling on the platform</span>
            </div>
          </CardContent>
        </Card>

        <Card className="opacity-0-init animate-fade-in-up animation-delay-300">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Commission</CardTitle>
            <div className="flex size-8 items-center justify-center rounded-lg bg-green-500/10">
              <TrendingUp className="size-4 text-green-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600 animate-count-up">{formatPrice(Number(overview?.money.commission_revenue ?? 0))}</div>
            <div className="mt-1 flex items-center gap-1 text-xs">
              <ArrowUpRight className="size-3 text-green-500" />
              <span className="text-muted-foreground">Platform earnings</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ─── Secondary Stats ────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Avg Order Value</CardTitle>
            <TShIcon className="text-xs text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">{formatPrice(Number(overview?.average_order_value ?? 0))}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Units Sold</CardTitle>
            <Package className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">{overview?.counts.units_sold ?? 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Refund Rate</CardTitle>
            <RefreshCw className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">{Number(overview?.refund_rate_percent ?? 0).toFixed(1)}%</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending Payouts</CardTitle>
            <Wallet className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">{formatPrice(Number(overview?.pending_payout_amount ?? 0))}</div>
          </CardContent>
        </Card>
      </div>

      {/* ─── Sales & Orders Area Chart + Order Distribution Donut ─────────────── */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="lg:col-span-4 opacity-0-init animate-fade-in-scale animation-delay-500">
          <CardHeader>
            <CardTitle>Sales & Orders Trend</CardTitle>
            <CardDescription>Revenue and order count over time — {rangeLabel}</CardDescription>
          </CardHeader>
          <CardContent>
            {chartData.length === 0 ? (
              <div className="flex h-[300px] items-center justify-center text-sm text-muted-foreground">No sales data available.</div>
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
                  <XAxis dataKey="period" tickLine={false} axisLine={false} tickMargin={8} minTickGap={24} fontSize={11} />
                  <YAxis yAxisId="left" tickLine={false} axisLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} fontSize={11} />
                  <YAxis yAxisId="right" orientation="right" tickLine={false} axisLine={false} allowDecimals={false} fontSize={11} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Area yAxisId="left" type="monotone" dataKey="amount" stroke="var(--color-amount)" strokeWidth={2} fill="url(#fillAmount)" name="Revenue" />
                  <Area yAxisId="right" type="monotone" dataKey="orders" stroke="var(--color-orders)" strokeWidth={2} fill="url(#fillOrders)" name="Orders" />
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
              <div className="flex h-[300px] items-center justify-center text-sm text-muted-foreground">No order data available.</div>
            ) : (
              <ChartContainer config={pieConfig} className="mx-auto h-[300px]">
                <PieChart>
                  <Pie data={orderDistribution} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} innerRadius={50} paddingAngle={4}>
                    {orderDistribution.map((_, index) => (
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

      {/* ─── Orders & Units Bar + Revenue Distribution Donut ─────────────────── */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Orders & Units Over Time</CardTitle>
            <CardDescription>Order count and units sold per period</CardDescription>
          </CardHeader>
          <CardContent>
            {chartData.length === 0 ? (
              <div className="flex h-[250px] items-center justify-center text-sm text-muted-foreground">No data available.</div>
            ) : (
              <ChartContainer config={salesChartConfig} className="h-[250px] w-full">
                <BarChart data={chartData} margin={{ left: 12, right: 12, top: 8, bottom: 8 }}>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" />
                  <XAxis dataKey="period" tickLine={false} axisLine={false} tickMargin={8} minTickGap={24} fontSize={11} />
                  <YAxis tickLine={false} axisLine={false} fontSize={11} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="orders" fill="var(--color-orders)" radius={[4, 4, 0, 0]} name="Orders" />
                  <Bar dataKey="units" fill="var(--color-units)" radius={[4, 4, 0, 0]} name="Units" />
                </BarChart>
              </ChartContainer>
            )}
          </CardContent>
          <CardFooter className="flex-col items-start gap-2 text-sm">
            <div className="flex gap-2 leading-none font-medium">
              {overview && <>{overview.counts.orders} total orders <TrendingUp className="h-4 w-4" /></>}
            </div>
            <div className="leading-none text-muted-foreground">Order and unit volume per period</div>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Revenue Distribution</CardTitle>
            <CardDescription>Commission vs seller earnings vs refunds</CardDescription>
          </CardHeader>
          <CardContent>
            {revenueBreakdown.length === 0 ? (
              <div className="flex h-[250px] items-center justify-center text-sm text-muted-foreground">No revenue data available.</div>
            ) : (
              <ChartContainer config={pieConfig} className="mx-auto h-[250px]">
                <PieChart>
                  <Pie data={revenueBreakdown} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} innerRadius={45} paddingAngle={4}>
                    {revenueBreakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <ChartTooltip content={<ChartTooltipContent nameKey="name" />} />
                  <ChartLegend content={<ChartLegendContent nameKey="name" />} />
                </PieChart>
              </ChartContainer>
            )}
          </CardContent>
          <CardFooter className="flex-col items-start gap-2 text-sm">
            <div className="flex gap-2 leading-none font-medium">
              {overview && <>{formatPrice(Number(overview.money.gross_sales))} total <TrendingUp className="h-4 w-4" /></>}
            </div>
            <div className="leading-none text-muted-foreground">Revenue breakdown across the platform</div>
          </CardFooter>
        </Card>
      </div>

      {/* ─── Top Sellers Horizontal Bar with Custom Labels ──────────────────── */}
      {sellerBarData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Store className="size-4" /> Top Sellers by Revenue
            </CardTitle>
            <CardDescription>Gross sales comparison — {rangeLabel}</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={sellerBarConfig} className="h-[300px] w-full">
              <BarChart accessibilityLayer data={sellerBarData} layout="vertical" margin={{ right: 16, left: 16, top: 8, bottom: 8 }}>
                <CartesianGrid horizontal={false} />
                <YAxis dataKey="name" type="category" tickLine={false} tickMargin={10} axisLine={false} tickFormatter={(value) => value.slice(0, 12)} hide />
                <XAxis dataKey="sales" type="number" hide />
                <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="line" />} />
                <Bar dataKey="sales" fill="var(--color-sales)" radius={4}>
                  <LabelList dataKey="name" position="insideLeft" offset={8} className="fill-(--color-label)" fontSize={12} />
                  <LabelList dataKey="sales" position="right" offset={8} className="fill-foreground" fontSize={12} formatter={(value) => `${(Number(value) / 1000).toFixed(1)}k`} />
                </Bar>
              </BarChart>
            </ChartContainer>
          </CardContent>
          <CardFooter className="flex-col items-start gap-2 text-sm">
            <div className="flex gap-2 leading-none font-medium">
              {topSellers[0] && <>Top seller: {topSellers[0].name} <TrendingUp className="h-4 w-4" /></>}
            </div>
            <div className="leading-none text-muted-foreground">Showing top {sellerBarData.length} sellers by gross sales</div>
          </CardFooter>
        </Card>
      )}

      {/* ─── Top Products Horizontal Bar with Custom Labels ──────────────────── */}
      {productBarData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="size-4" /> Top Products by Revenue
            </CardTitle>
            <CardDescription>Best performing products — {rangeLabel}</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={productBarConfig} className="h-[300px] w-full">
              <BarChart accessibilityLayer data={productBarData} layout="vertical" margin={{ right: 16, left: 16, top: 8, bottom: 8 }}>
                <CartesianGrid horizontal={false} />
                <YAxis dataKey="name" type="category" tickLine={false} tickMargin={10} axisLine={false} tickFormatter={(value) => value.slice(0, 12)} hide />
                <XAxis dataKey="sales" type="number" hide />
                <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="line" />} />
                <Bar dataKey="sales" fill="var(--color-sales)" radius={4}>
                  <LabelList dataKey="name" position="insideLeft" offset={8} className="fill-(--color-label)" fontSize={12} />
                  <LabelList dataKey="sales" position="right" offset={8} className="fill-foreground" fontSize={12} formatter={(value) => `${(Number(value) / 1000).toFixed(1)}k`} />
                </Bar>
              </BarChart>
            </ChartContainer>
          </CardContent>
          <CardFooter className="flex-col items-start gap-2 text-sm">
            <div className="flex gap-2 leading-none font-medium">
              {topProducts[0] && <>Top product: {topProducts[0].name} <TrendingUp className="h-4 w-4" /></>}
            </div>
            <div className="leading-none text-muted-foreground">Showing top {productBarData.length} products by gross sales</div>
          </CardFooter>
        </Card>
      )}

      {/* ─── Reconciliation ─────────────────────────────────────────────────── */}
      {reconciliation && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wallet className="size-4" /> Financial Reconciliation
            </CardTitle>
            <CardDescription>Platform financial breakdown — {rangeLabel}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-lg border p-4">
                <p className="text-xs text-muted-foreground">Gross Sales</p>
                <p className="mt-1 text-lg font-bold">{formatPrice(Number(reconciliation.gross_sales))}</p>
              </div>
              <div className="rounded-lg border p-4">
                <p className="text-xs text-muted-foreground">Commission Revenue</p>
                <p className="mt-1 text-lg font-bold text-green-600">{formatPrice(Number(reconciliation.commission_revenue))}</p>
              </div>
              <div className="rounded-lg border p-4">
                <p className="text-xs text-muted-foreground">Seller Net Earnings</p>
                <p className="mt-1 text-lg font-bold">{formatPrice(Number(reconciliation.seller_net_earnings))}</p>
              </div>
              <div className="rounded-lg border p-4">
                <p className="text-xs text-muted-foreground">Refunds Completed</p>
                <p className="mt-1 text-lg font-bold text-red-500">{formatPrice(Number(reconciliation.refunds_completed))}</p>
              </div>
              <div className="rounded-lg border p-4">
                <p className="text-xs text-muted-foreground">Payouts Completed</p>
                <p className="mt-1 text-lg font-bold">{formatPrice(Number(reconciliation.payouts_completed))}</p>
              </div>
              <div className="rounded-lg border p-4">
                <p className="text-xs text-muted-foreground">Pending Wallet Balance</p>
                <p className="mt-1 text-lg font-bold text-amber-600">{formatPrice(Number(reconciliation.pending_wallet_balance))}</p>
              </div>
              <div className="rounded-lg border p-4">
                <p className="text-xs text-muted-foreground">Available Wallet Balance</p>
                <p className="mt-1 text-lg font-bold">{formatPrice(Number(reconciliation.available_wallet_balance))}</p>
              </div>
              <div className="rounded-lg border p-4">
                <p className="text-xs text-muted-foreground">Pending Payout Amount</p>
                <p className="mt-1 text-lg font-bold text-amber-600">{formatPrice(Number(reconciliation.pending_payout_amount))}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ─── Top Sellers Table ─────────────────────────────────────────────── */}
      <Card>
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
                <TableHead>Commission</TableHead>
                <TableHead>Orders</TableHead>
                <TableHead>Units</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {topSellers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">No seller data for this period.</TableCell>
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
                    <TableCell>{formatPrice(Number(s.commission))}</TableCell>
                    <TableCell>{s.order_count}</TableCell>
                    <TableCell>{s.units}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* ─── Top Products Table ─────────────────────────────────────────────── */}
      <Card>
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
