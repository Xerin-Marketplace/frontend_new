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
  ShoppingBag,
  Users,
  Package,
  Store,
  RefreshCw,
  Wallet,
  AlertCircle,
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
  Legend,
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

type SellerResponse = {
  id: string
  user_id: string
  business_name: string
  status: string
  created_at: string
}

type PaginatedSellers = {
  total: number
  page: number
  page_size: number
  results: SellerResponse[]
}

type AnalyticsRankingRow = {
  id: string
  name: string
  amount: number
  order_count: number
  units: number
}

type ReconciliationResponse = {
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

function formatPrice(price: number): string {
  const n = Number(price)
  return `TSh ${Number.isNaN(n) ? 0 : n.toLocaleString()}`
}

function getApiError(err: unknown): string {
  const e = err as ApiError
  return e?.detail || "Something went wrong. Please try again."
}

export default function AdminOverviewPage() {
  const [overview, setOverview] = React.useState<AnalyticsOverview | null>(null)
  const [sales, setSales] = React.useState<AnalyticsSeriesPoint[]>([])
  const [pendingSellers, setPendingSellers] = React.useState<SellerResponse[]>([])
  const [topSellers, setTopSellers] = React.useState<AnalyticsRankingRow[]>([])
  const [topProducts, setTopProducts] = React.useState<AnalyticsRankingRow[]>([])
  const [analyticsError, setAnalyticsError] = React.useState<string | null>(null)
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    Promise.allSettled([
      api.get<AnalyticsOverview>("/analytics/admin/overview"),
      api.get<AnalyticsSeriesPoint[]>("/analytics/admin/sales"),
      api.get<PaginatedSellers>("/sellers/admin/pending?page=1&page_size=5"),
      api.get<AnalyticsRankingRow[]>("/analytics/admin/sellers?limit=5"),
      api.get<AnalyticsRankingRow[]>("/analytics/admin/products?limit=5"),
    ])
      .then(([oRes, sRes, psRes, tsRes, tpRes]) => {
        if (oRes.status === "fulfilled") {
          setOverview(oRes.value)
        } else {
          setAnalyticsError(getApiError(oRes.reason))
        }
        if (sRes.status === "fulfilled") {
          setSales(sRes.value)
        }
        if (psRes.status === "fulfilled") {
          setPendingSellers(psRes.value.results)
        } else if (oRes.status === "rejected" && sRes.status === "rejected") {
          toast.add({
            title: "Failed to load admin overview",
            description: getApiError(psRes.reason),
            type: "error",
          })
        }
        if (tsRes.status === "fulfilled") {
          setTopSellers(tsRes.value)
        }
        if (tpRes.status === "fulfilled") {
          setTopProducts(tpRes.value)
        }
      })
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <PageSkeleton>
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
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

  const chartConfig = {
    amount: { label: "Revenue", color: "hsl(var(--chart-1))" },
    orders: { label: "Orders", color: "hsl(var(--chart-2))" },
    units: { label: "Units", color: "hsl(var(--chart-3))" },
  } satisfies ChartConfig

  // Order breakdown for donut chart
  const orderBreakdown = [
    { name: "Paid", value: overview?.counts.paid_orders ?? 0, color: "hsl(var(--chart-1))" },
    { name: "Refunded", value: overview?.counts.refunded_orders ?? 0, color: "#ef4444" },
    { name: "Pending", value: Math.max(0, (overview?.counts.orders ?? 0) - (overview?.counts.paid_orders ?? 0) - (overview?.counts.refunded_orders ?? 0)), color: "hsl(var(--chart-3))" },
  ]

  // Revenue breakdown for donut chart
  const revenueBreakdown = [
    { name: "Commission Revenue", value: Number(overview?.money.commission_revenue ?? 0), color: "hsl(var(--chart-1))" },
    { name: "Seller Earnings", value: Number(overview?.money.seller_net_earnings ?? 0), color: "hsl(var(--chart-2))" },
    { name: "Refunds", value: Number(overview?.money.refunds_completed ?? 0), color: "#ef4444" },
  ]

  // Top sellers bar chart data
  const topSellersData = topSellers.map((s) => ({
    name: s.name.length > 15 ? s.name.slice(0, 12) + "..." : s.name,
    fullName: s.name,
    revenue: Number(s.amount),
    orders: s.order_count,
  }))

  // Top products bar chart data
  const topProductsData = topProducts.map((p) => ({
    name: p.name.length > 15 ? p.name.slice(0, 12) + "..." : p.name,
    fullName: p.name,
    revenue: Number(p.amount),
    units: p.units,
  }))

  const donutConfig = {
    value: { label: "Count" },
  } satisfies ChartConfig

  const barConfig = {
    revenue: { label: "Revenue", color: "hsl(var(--chart-1))" },
    orders: { label: "Orders", color: "hsl(var(--chart-2))" },
    units: { label: "Units", color: "hsl(var(--chart-3))" },
  } satisfies ChartConfig

  return (
    <div className="flex flex-col gap-6">
      <div className="animate-fade-in-up">
        <h2 className="text-2xl font-bold tracking-tight">Admin Overview</h2>
        <p className="text-sm text-muted-foreground">Platform-wide metrics and pending actions.</p>
      </div>

      {/* Analytics Permission Error */}
      {analyticsError && (
        <div className="flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-900 dark:bg-amber-950/50">
          <AlertCircle className="size-5 shrink-0 text-amber-600" />
          <div className="flex flex-col">
            <span className="font-semibold text-amber-800 dark:text-amber-200">Analytics unavailable</span>
            <span className="text-sm text-amber-700 dark:text-amber-300">{analyticsError}</span>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <Card className="opacity-0-init animate-fade-in-up">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Gross Sales</CardTitle>
            <TShIcon className="text-xs text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold animate-count-up">{formatPrice(Number(overview?.money.gross_sales ?? 0))}</div>
            <p className="mt-1 text-xs text-muted-foreground">Total platform sales</p>
          </CardContent>
        </Card>
        <Card className="opacity-0-init animate-fade-in-up animation-delay-100">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Orders</CardTitle>
            <ShoppingBag className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold animate-count-up">{overview?.counts.orders ?? 0}</div>
            <p className="mt-1 text-xs text-muted-foreground">{overview?.counts.paid_orders ?? 0} paid</p>
          </CardContent>
        </Card>
        <Card className="opacity-0-init animate-fade-in-up animation-delay-200">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Sellers</CardTitle>
            <Store className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold animate-count-up">{overview?.counts.active_sellers ?? 0}</div>
            <p className="mt-1 text-xs text-muted-foreground">{overview?.counts.products ?? 0} products</p>
          </CardContent>
        </Card>
        <Card className="opacity-0-init animate-fade-in-up animation-delay-300">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Commission Revenue</CardTitle>
            <TrendingUp className="size-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600 animate-count-up">{formatPrice(Number(overview?.money.commission_revenue ?? 0))}</div>
            <p className="mt-1 text-xs text-muted-foreground">Platform earnings</p>
          </CardContent>
        </Card>
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Avg Order Value</CardTitle>
            <TShIcon className="text-xs text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatPrice(Number(overview?.average_order_value ?? 0))}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Units Sold</CardTitle>
            <Package className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview?.counts.units_sold ?? 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Refund Rate</CardTitle>
            <RefreshCw className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Number(overview?.refund_rate_percent ?? 0).toFixed(1)}%</div>
            <p className="mt-1 text-xs text-muted-foreground">{overview?.counts.refunded_orders ?? 0} refunded</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending Payouts</CardTitle>
            <Wallet className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatPrice(Number(overview?.pending_payout_amount ?? 0))}</div>
          </CardContent>
        </Card>
      </div>

      {/* Sales Trend — Area Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Sales Trend</CardTitle>
          <CardDescription>Revenue, orders and units over time</CardDescription>
        </CardHeader>
        <CardContent>
          {chartData.length === 0 ? (
            <div className="flex h-[250px] items-center justify-center text-sm text-muted-foreground">No sales data available.</div>
          ) : (
            <ChartContainer config={chartConfig} className="h-[250px] w-full">
              <AreaChart data={chartData} margin={{ left: 12, right: 12, top: 8, bottom: 8 }}>
                <defs>
                  <linearGradient id="adminFillAmount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--color-amount)" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="var(--color-amount)" stopOpacity={0.05} />
                  </linearGradient>
                  <linearGradient id="adminFillOrders" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--color-orders)" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="var(--color-orders)" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis dataKey="period" tickLine={false} axisLine={false} tickMargin={8} minTickGap={24} fontSize={11} />
                <YAxis yAxisId="left" tickLine={false} axisLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} fontSize={11} />
                <YAxis yAxisId="right" orientation="right" tickLine={false} axisLine={false} fontSize={11} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Area yAxisId="left" type="monotone" dataKey="amount" stroke="var(--color-amount)" strokeWidth={2} fill="url(#adminFillAmount)" name="Revenue" />
                <Area yAxisId="right" type="monotone" dataKey="orders" stroke="var(--color-orders)" strokeWidth={2} fill="url(#adminFillOrders)" name="Orders" />
              </AreaChart>
            </ChartContainer>
          )}
        </CardContent>
      </Card>

      {/* Orders Bar Chart + Order Breakdown Donut */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Orders & Units Over Time</CardTitle>
            <CardDescription>Order count and units sold per period</CardDescription>
          </CardHeader>
          <CardContent>
            {chartData.length === 0 ? (
              <div className="flex h-[250px] items-center justify-center text-sm text-muted-foreground">No data available.</div>
            ) : (
              <ChartContainer config={chartConfig} className="h-[250px] w-full">
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
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Order Breakdown</CardTitle>
            <CardDescription>Paid vs refunded vs pending</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={donutConfig} className="h-[250px] w-full">
              <PieChart>
                <ChartTooltip content={<ChartTooltipContent nameKey="name" />} />
                <Pie
                  data={orderBreakdown}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={3}
                  stroke="none"
                >
                  {orderBreakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Legend
                  verticalAlign="bottom"
                  height={36}
                  iconType="circle"
                  formatter={(value) => <span className="text-xs">{value}</span>}
                />
              </PieChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Breakdown Donut + Top Sellers Bar */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Revenue Distribution</CardTitle>
            <CardDescription>Commission vs seller earnings vs refunds</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={donutConfig} className="h-[250px] w-full">
              <PieChart>
                <ChartTooltip content={<ChartTooltipContent nameKey="name" />} />
                <Pie
                  data={revenueBreakdown}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={3}
                  stroke="none"
                >
                  {revenueBreakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Legend
                  verticalAlign="bottom"
                  height={36}
                  iconType="circle"
                  formatter={(value) => <span className="text-xs">{value}</span>}
                />
              </PieChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Store className="size-4" /> Top Sellers by Revenue
            </CardTitle>
            <CardDescription>Highest grossing sellers</CardDescription>
          </CardHeader>
          <CardContent>
            {topSellersData.length === 0 ? (
              <div className="flex h-[250px] items-center justify-center text-sm text-muted-foreground">No seller data available.</div>
            ) : (
              <ChartContainer config={barConfig} className="h-[250px] w-full">
                <BarChart data={topSellersData} layout="vertical" margin={{ left: 20, right: 12, top: 8, bottom: 8 }}>
                  <CartesianGrid horizontal={false} strokeDasharray="3 3" />
                  <XAxis type="number" tickLine={false} axisLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} fontSize={11} />
                  <YAxis type="category" dataKey="name" tickLine={false} axisLine={false} width={100} fontSize={11} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="revenue" fill="var(--color-revenue)" radius={[0, 4, 4, 0]} name="Revenue" />
                </BarChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Top Products Bar Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Package className="size-4" /> Top Products by Revenue
          </CardTitle>
          <CardDescription>Best performing products</CardDescription>
        </CardHeader>
        <CardContent>
          {topProductsData.length === 0 ? (
            <div className="flex h-[250px] items-center justify-center text-sm text-muted-foreground">No product data available.</div>
          ) : (
            <ChartContainer config={barConfig} className="h-[250px] w-full">
              <BarChart data={topProductsData} margin={{ left: 12, right: 12, top: 8, bottom: 8 }}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis dataKey="name" tickLine={false} axisLine={false} tickMargin={8} fontSize={11} />
                <YAxis tickLine={false} axisLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} fontSize={11} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="revenue" fill="var(--color-revenue)" radius={[4, 4, 0, 0]} name="Revenue" />
                <Bar dataKey="units" fill="var(--color-units)" radius={[4, 4, 0, 0]} name="Units Sold" />
              </BarChart>
            </ChartContainer>
          )}
        </CardContent>
      </Card>

      {/* Pending Seller Approvals */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="size-4" /> Pending Seller Approvals
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Business Name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pendingSellers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="h-24 text-center text-muted-foreground">No pending sellers.</TableCell>
                </TableRow>
              ) : (
                pendingSellers.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium">{s.business_name}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{s.status}</Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs">{new Date(s.created_at).toLocaleDateString()}</TableCell>
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
