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
  const [summary, setSummary] = React.useState<DashboardSummary | null>(null)
  const [orderStatus, setOrderStatus] = React.useState<OrderStatusBreakdown>({})
  const [customers, setCustomers] = React.useState<CustomerStats | null>(null)
  const [payments, setPayments] = React.useState<PaymentStats | null>(null)
  const [refunds, setRefunds] = React.useState<RefundStats | null>(null)
  const [delivery, setDelivery] = React.useState<DeliveryStats | null>(null)
  const [notifications, setNotifications] = React.useState<NotificationStats | null>(null)
  const [sellerStats, setSellerStats] = React.useState<SellerStats | null>(null)
  const [productStats, setProductStats] = React.useState<ProductStats | null>(null)
  const [searchStats, setSearchStats] = React.useState<SearchStats | null>(null)
  const [alerts, setAlerts] = React.useState<SystemAlert[]>([])
  const [activityLogs, setActivityLogs] = React.useState<ActivityLog[]>([])
  const [reconciliation, setReconciliation] = React.useState<Reconciliation | null>(null)
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    const days = range === "7d" ? 7 : range === "30d" ? 30 : 90
    const end = new Date()
    const start = new Date(end.getTime() - days * 24 * 60 * 60 * 1000)
    const params = `?start_at=${start.toISOString()}&end_at=${end.toISOString()}`
    const periodParam = `?period=custom&start_at=${start.toISOString()}&end_at=${end.toISOString()}`

    setLoading(true)
    Promise.allSettled([
      api.get<AnalyticsOverview>(`/analytics/admin/overview${params}`),
      api.get<AnalyticsSeriesPoint[]>(`/analytics/admin/sales${params}`),
      api.get<AnalyticsRankingRow[]>(`/analytics/admin/sellers${params}&limit=5`),
      api.get<AnalyticsRankingRow[]>(`/analytics/admin/products${params}&limit=5`),
      api.get<Reconciliation>(`/analytics/admin/reconciliation${params}`),
      api.get<DashboardSummary>(`/admin/dashboard/summary${periodParam}`),
      api.get<OrderStatusBreakdown>(`/admin/dashboard/orders${periodParam}`),
      api.get<CustomerStats>("/admin/dashboard/customers"),
      api.get<PaymentStats>("/admin/dashboard/payments"),
      api.get<RefundStats>("/admin/dashboard/refunds"),
      api.get<DeliveryStats>("/admin/dashboard/delivery"),
      api.get<NotificationStats>("/admin/dashboard/notifications"),
      api.get<SellerStats>("/admin/dashboard/sellers"),
      api.get<ProductStats>("/admin/dashboard/products"),
      api.get<SearchStats>("/admin/dashboard/search?limit=10"),
      api.get<SystemAlert[]>("/admin/dashboard/alerts?limit=10"),
      api.get<ActivityLog[]>("/admin/dashboard/activity-logs?limit=20"),
    ])
      .then(([
        oRes, sRes, tsRes, tpRes, recRes, sumRes, osRes,
        custRes, payRes, refRes, delRes, notifRes, sellRes, prodRes,
        searchRes, alertRes, logRes,
      ]) => {
        if (oRes.status === "fulfilled") setOverview(oRes.value)
        if (sRes.status === "fulfilled") setSales(sRes.value)
        if (tsRes.status === "fulfilled") setTopSellers(tsRes.value)
        if (tpRes.status === "fulfilled") setTopProducts(tpRes.value)
        if (recRes.status === "fulfilled") setReconciliation(recRes.value)
        if (sumRes.status === "fulfilled") setSummary(sumRes.value)
        if (osRes.status === "fulfilled") setOrderStatus(osRes.value)
        if (custRes.status === "fulfilled") setCustomers(custRes.value)
        if (payRes.status === "fulfilled") setPayments(payRes.value)
        if (refRes.status === "fulfilled") setRefunds(refRes.value)
        if (delRes.status === "fulfilled") setDelivery(delRes.value)
        if (notifRes.status === "fulfilled") setNotifications(notifRes.value)
        if (sellRes.status === "fulfilled") setSellerStats(sellRes.value)
        if (prodRes.status === "fulfilled") setProductStats(prodRes.value)
        if (searchRes.status === "fulfilled") setSearchStats(searchRes.value)
        if (alertRes.status === "fulfilled") setAlerts(alertRes.value)
        if (logRes.status === "fulfilled") setActivityLogs(logRes.value)
      })
      .finally(() => setLoading(false))
  }, [range])

  if (loading) {
    return (
      <PageSkeleton>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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

  const orderStatusData = Object.entries(orderStatus).map(([status, count]) => ({
    name: status,
    value: count,
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
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="opacity-0-init animate-fade-in-up">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Gross Sales</CardTitle>
            <div className="flex size-8 items-center justify-center rounded-lg bg-chart-1/10">
              <DollarSign className="size-4 text-chart-1" />
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
            <CardTitle className="text-sm font-medium text-muted-foreground">Customers</CardTitle>
            <div className="flex size-8 items-center justify-center rounded-lg bg-chart-3/10">
              <Users className="size-4 text-chart-3" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold animate-count-up">{customers?.total ?? summary?.customers ?? 0}</div>
            <div className="mt-1 flex items-center gap-1 text-xs">
              <ArrowUpRight className="size-3 text-green-500" />
              <span className="text-muted-foreground">{customers?.verified ?? 0} verified</span>
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
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Avg Order Value</CardTitle>
            <DollarSign className="size-4 text-muted-foreground" />
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

      {/* ─── Platform Health Stats ──────────────────────────────────────────── */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">Sellers</CardTitle>
            <Store className="size-3.5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold">{sellerStats?.total ?? 0}</div>
            <p className="text-xs text-muted-foreground">{sellerStats?.approved ?? 0} approved · {sellerStats?.pending ?? 0} pending</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">Products</CardTitle>
            <Package className="size-3.5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold">{productStats?.total ?? 0}</div>
            <p className="text-xs text-muted-foreground">{productStats?.approved ?? 0} approved · {productStats?.pending_review ?? 0} pending</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">Payments</CardTitle>
            <CreditCard className="size-3.5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold">{payments?.total ?? 0}</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">{payments?.successful ?? 0} ok</span> · <span className="text-red-500">{payments?.failed ?? 0} failed</span>
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">Deliveries</CardTitle>
            <Truck className="size-3.5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold">{delivery?.total ?? 0}</div>
            <p className="text-xs text-muted-foreground">{delivery?.failed ?? 0} failed</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">Notifications</CardTitle>
            <Bell className="size-3.5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold">{notifications?.total ?? 0}</div>
            <p className="text-xs text-muted-foreground">{notifications?.failed ?? 0} failed</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">Refunds</CardTitle>
            <RefreshCw className="size-3.5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold">{refunds?.total ?? 0}</div>
            <p className="text-xs text-muted-foreground">{refunds?.pending ?? 0} pending</p>
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

      {/* ─── Order Status Breakdown Donut ────────────────────────────────────── */}
      {orderStatusData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Order Status Breakdown</CardTitle>
            <CardDescription>Orders grouped by status — {rangeLabel}</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={orderStatusConfig} className="mx-auto h-[300px]">
              <PieChart>
                <Pie data={orderStatusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} innerRadius={50} paddingAngle={3}>
                  {orderStatusData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={STATUS_COLORS[index % STATUS_COLORS.length]} />
                  ))}
                </Pie>
                <ChartTooltip content={<ChartTooltipContent nameKey="name" />} />
                <ChartLegend content={<ChartLegendContent nameKey="name" />} />
              </PieChart>
            </ChartContainer>
          </CardContent>
        </Card>
      )}

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

      {/* ─── Trending Searches + Most Viewed Products ────────────────────────── */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="size-4" /> Trending Searches
            </CardTitle>
            <CardDescription>Top search terms on the platform</CardDescription>
          </CardHeader>
          <CardContent>
            {searchStats?.top_searches?.length ? (
              <div className="flex flex-col gap-2">
                {searchStats.top_searches.map((s, i) => (
                  <div key={i} className="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-muted/30">
                    <div className="flex items-center gap-3">
                      <span className="flex size-7 items-center justify-center rounded bg-primary/10 text-xs font-bold text-primary">{i + 1}</span>
                      <span className="font-medium">{s.term}</span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Search className="size-3" /> {s.search_count}
                      </span>
                      <span className="flex items-center gap-1">
                        <Eye className="size-3" /> {s.click_count}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">No search data available.</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="size-4" /> Most Viewed Products
            </CardTitle>
            <CardDescription>Products with the most views</CardDescription>
          </CardHeader>
          <CardContent>
            {searchStats?.most_viewed_products?.length ? (
              <div className="flex flex-col gap-2">
                {searchStats.most_viewed_products.map((p, i) => (
                  <div key={i} className="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-muted/30">
                    <div className="flex items-center gap-3">
                      <span className="flex size-7 items-center justify-center rounded bg-primary/10 text-xs font-bold text-primary">{i + 1}</span>
                      <span className="font-mono text-xs text-muted-foreground">#{p.product_id.slice(0, 8)}</span>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Eye className="size-3" /> {p.views} views
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">No view data available.</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ─── System Alerts + Admin Activity Feed ─────────────────────────────── */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="size-4" /> System Alerts
            </CardTitle>
            <CardDescription>Recent system alerts and warnings</CardDescription>
          </CardHeader>
          <CardContent>
            {alerts.length > 0 ? (
              <div className="flex flex-col gap-2">
                {alerts.map((a) => (
                  <div key={a.id} className="flex items-start gap-3 rounded-lg border p-3">
                    <div className={`mt-0.5 flex size-6 shrink-0 items-center justify-center rounded ${
                      a.severity === "critical" ? "bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-300"
                      : a.severity === "high" ? "bg-orange-100 text-orange-600 dark:bg-orange-900 dark:text-orange-300"
                      : "bg-amber-100 text-amber-600 dark:bg-amber-900 dark:text-amber-300"
                    }`}>
                      <AlertTriangle className="size-3.5" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{a.title}</span>
                        {a.resolved ? (
                          <Badge className="gap-1 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                            <CheckCircle className="size-3" /> Resolved
                          </Badge>
                        ) : (
                          <Badge variant="destructive" className="gap-1">
                            <XCircle className="size-3" /> Open
                          </Badge>
                        )}
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">{a.message}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{new Date(a.created_at).toLocaleString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">
                <CheckCircle className="mr-2 size-5 text-green-500" /> No active alerts.
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="size-4" /> Admin Activity Feed
            </CardTitle>
            <CardDescription>Recent admin actions and operations</CardDescription>
          </CardHeader>
          <CardContent>
            {activityLogs.length > 0 ? (
              <div className="flex flex-col gap-2">
                {activityLogs.slice(0, 10).map((log) => (
                  <div key={log.id} className="flex items-start gap-3 rounded-lg border p-3">
                    <div className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded bg-primary/10">
                      <Activity className="size-3.5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{log.action.replace(/_/g, " ")}</span>
                        <span className="text-xs text-muted-foreground">{new Date(log.created_at).toLocaleString()}</span>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {log.resource_type} {log.resource_id && `· #${log.resource_id.slice(0, 8)}`}
                      </p>
                      {log.details && <p className="mt-1 text-xs text-muted-foreground">{log.details}</p>}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">No activity logs.</div>
            )}
          </CardContent>
        </Card>
      </div>

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
