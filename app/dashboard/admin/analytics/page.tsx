"use client"

import * as React from "react"
import {
  Card,
  CardContent,
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
  DollarSign,
  ShoppingBag,
  Store,
  Package,
  RefreshCw,
  Wallet,
} from "lucide-react"
import { api, type ApiError } from "@/lib/api"
import { StatsCardSkeleton, TableSkeleton, PageSkeleton } from "@/components/skeletons"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "@/components/ui/toast"

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

  const maxAmount = Math.max(...sales.map((d) => Number(d.amount)), 1)

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Analytics</h2>
          <p className="text-sm text-muted-foreground">Platform-wide analytics and insights.</p>
        </div>
        <div className="flex gap-1 rounded-lg border p-1">
          {(["7d", "30d", "90d"] as const).map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`rounded-md px-3 py-1 text-sm font-medium transition-colors ${
                range === r ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {r === "7d" ? "7 Days" : r === "30d" ? "30 Days" : "90 Days"}
            </button>
          ))}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Gross Sales</CardTitle>
            <DollarSign className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatPrice(Number(overview?.money.gross_sales ?? 0))}</div>
            <p className="mt-1 text-xs text-muted-foreground">Total platform sales</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Orders</CardTitle>
            <ShoppingBag className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview?.counts.orders ?? 0}</div>
            <p className="mt-1 text-xs text-muted-foreground">{overview?.counts.paid_orders ?? 0} paid</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Sellers</CardTitle>
            <Store className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview?.counts.active_sellers ?? 0}</div>
            <p className="mt-1 text-xs text-muted-foreground">{overview?.counts.products ?? 0} products</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Commission Revenue</CardTitle>
            <TrendingUp className="size-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatPrice(Number(overview?.money.commission_revenue ?? 0))}</div>
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
        </CardHeader>
        <CardContent>
          <div className="flex items-end justify-between gap-3 h-48">
            {sales.length === 0 ? (
              <div className="flex h-full w-full items-center justify-center text-sm text-muted-foreground">No sales data available.</div>
            ) : (
              sales.map((d) => (
                <div key={d.period} className="flex flex-1 flex-col items-center gap-2">
                  <div className="text-xs font-medium text-muted-foreground">{formatPrice(Number(d.amount))}</div>
                  <div className="flex w-full items-end justify-center" style={{ height: "140px" }}>
                    <div
                      className="w-full max-w-[60px] rounded-t-md bg-primary transition-all hover:bg-primary/80"
                      style={{ height: `${(Number(d.amount) / maxAmount) * 100}%` }}
                    />
                  </div>
                  <div className="text-xs text-muted-foreground">{d.period}</div>
                  <div className="text-xs font-medium">{d.order_count} orders</div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Top Sellers */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
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
                  <TableRow key={s.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <span className="flex size-6 items-center justify-center rounded bg-muted text-xs font-bold text-muted-foreground">{idx + 1}</span>
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

      {/* Top Products */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
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
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <span className="flex size-6 items-center justify-center rounded bg-muted text-xs font-bold text-muted-foreground">{idx + 1}</span>
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
