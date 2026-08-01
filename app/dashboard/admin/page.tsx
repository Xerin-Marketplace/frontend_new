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
  ShoppingBag,
  Users,
  Package,
  DollarSign,
  Store,
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
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    Promise.all([
      api.get<AnalyticsOverview>("/analytics/admin/overview"),
      api.get<AnalyticsSeriesPoint[]>("/analytics/admin/sales"),
      api.get<PaginatedSellers>("/sellers/admin/pending?page=1&page_size=5"),
    ])
      .then(([o, s, ps]) => {
        setOverview(o)
        setSales(s)
        setPendingSellers(ps.results)
      })
      .catch((err) => {
        toast.add({
          title: "Failed to load admin overview",
          description: getApiError(err),
          type: "error",
        })
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

  const maxAmount = Math.max(...sales.map((d) => Number(d.amount)), 1)

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Admin Overview</h2>
        <p className="text-sm text-muted-foreground">Platform-wide metrics and pending actions.</p>
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
