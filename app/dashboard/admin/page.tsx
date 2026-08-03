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
  DollarSign,
  Store,
  RefreshCw,
  Wallet,
  AlertCircle,
} from "lucide-react"
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

function formatPrice(price: number): string {
  return `TSh ${Number(price).toLocaleString()}`
}

function getApiError(err: unknown): string {
  const e = err as ApiError
  return e?.detail || "Something went wrong. Please try again."
}

export default function AdminOverviewPage() {
  const [overview, setOverview] = React.useState<AnalyticsOverview | null>(null)
  const [sales, setSales] = React.useState<AnalyticsSeriesPoint[]>([])
  const [pendingSellers, setPendingSellers] = React.useState<SellerResponse[]>([])
  const [analyticsError, setAnalyticsError] = React.useState<string | null>(null)
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    Promise.allSettled([
      api.get<AnalyticsOverview>("/analytics/admin/overview"),
      api.get<AnalyticsSeriesPoint[]>("/analytics/admin/sales"),
      api.get<PaginatedSellers>("/sellers/admin/pending?page=1&page_size=5"),
    ])
      .then(([oRes, sRes, psRes]) => {
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
        <Card><TableSkeleton rows={5} cols={4} /></Card>
      </PageSkeleton>
    )
  }

  const chartData = sales.map((s) => ({
    period: s.period,
    amount: Number(s.amount),
    orders: s.order_count,
  }))

  const chartConfig = {
    amount: { label: "Revenue", color: "hsl(var(--chart-1))" },
    orders: { label: "Orders", color: "hsl(var(--chart-2))" },
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
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="opacity-0-init animate-fade-in-up">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Gross Sales</CardTitle>
            <DollarSign className="size-4 text-muted-foreground" />
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
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Avg Order Value</CardTitle>
            <DollarSign className="size-4 text-muted-foreground" />
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

      {/* Sales Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Sales Trend</CardTitle>
          <CardDescription>Revenue and orders over time</CardDescription>
        </CardHeader>
        <CardContent>
          {chartData.length === 0 ? (
            <div className="flex h-[200px] items-center justify-center text-sm text-muted-foreground">No sales data available.</div>
          ) : (
            <ChartContainer config={chartConfig} className="h-[200px] w-full">
              <AreaChart data={chartData} margin={{ left: 12, right: 12, top: 8, bottom: 8 }}>
                <defs>
                  <linearGradient id="adminFillAmount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--color-amount)" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="var(--color-amount)" stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis dataKey="period" tickLine={false} axisLine={false} tickMargin={8} minTickGap={24} fontSize={11} />
                <YAxis tickLine={false} axisLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} fontSize={11} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Area type="monotone" dataKey="amount" stroke="var(--color-amount)" strokeWidth={2} fill="url(#adminFillAmount)" name="Revenue" />
              </AreaChart>
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
