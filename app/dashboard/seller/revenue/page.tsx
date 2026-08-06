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
import { Button, buttonVariants } from "@/components/ui/button"
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
  Wallet,
  TrendingUp,
  TrendingDown,
  ArrowDownToLine,
  Clock,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Banknote,
  Plus,
} from "lucide-react"
import { TShIcon } from "@/components/tsh-icon"
import { AreaChart, Area, BarChart, Bar, CartesianGrid, XAxis, YAxis, PieChart, Pie, Cell } from "recharts"
import { api, type ApiError } from "@/lib/api"
import { StatsCardSkeleton, TableSkeleton, PageSkeleton } from "@/components/skeletons"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "@/components/ui/toast"
import Link from "next/link"
import { cn } from "@/lib/utils"

// ─── Types ───
type WalletResponse = {
  id: string
  seller_id: string
  currency: string
  pending_balance: number
  available_balance: number
  reserved_balance: number
  paid_out_balance: number
  refunded_balance: number
  debt_balance: number
  is_frozen: boolean
  created_at: string
  updated_at: string | null
}

type WalletTransaction = {
  id: string
  transaction_type: string
  amount: number
  currency: string
  reference: string
  order_id: string | null
  eligible_at: string | null
  released_at: string | null
  description: string | null
  created_at: string
}

type PayoutRequest = {
  id: string
  seller_id: string
  payout_account_id: string
  amount: number
  currency: string
  status: string
  provider_reference: string | null
  seller_note: string | null
  admin_note: string | null
  requested_at: string
  processed_at: string | null
  completed_at: string | null
}

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

const creditTypes = ["sale_credit", "funds_release", "adjustment", "payout_released"]

const txTypeConfig: Record<string, { label: string; color: string }> = {
  sale_credit: { label: "Sale Credit", color: "hsl(var(--chart-1))" },
  funds_release: { label: "Funds Released", color: "hsl(var(--chart-2))" },
  payout_hold: { label: "Payout Hold", color: "hsl(var(--chart-3))" },
  payout_completed: { label: "Payout Completed", color: "hsl(var(--chart-4))" },
  payout_released: { label: "Payout Released", color: "hsl(var(--chart-3))" },
  refund_debit: { label: "Refund Debit", color: "hsl(var(--destructive))" },
  adjustment: { label: "Adjustment", color: "hsl(var(--chart-5))" },
}

const payoutStatusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  pending: { label: "Pending", variant: "secondary" },
  approved: { label: "Approved", variant: "secondary" },
  processing: { label: "Processing", variant: "secondary" },
  completed: { label: "Completed", variant: "default" },
  cancelled: { label: "Cancelled", variant: "outline" },
  rejected: { label: "Rejected", variant: "destructive" },
  failed: { label: "Failed", variant: "destructive" },
}

const revenueChartConfig = {
  amount: { label: "Revenue", color: "hsl(var(--chart-1))" },
  earnings: { label: "Net Earnings", color: "hsl(var(--chart-2))" },
} satisfies ChartConfig

const breakdownConfig = {
  value: { label: "Amount", color: "hsl(var(--chart-3))" },
} satisfies ChartConfig

const PIE_COLORS = ["hsl(var(--chart-1))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))", "hsl(var(--chart-5))"]

// ─── Component ───
export default function SellerRevenuePage() {
  const [wallet, setWallet] = React.useState<WalletResponse | null>(null)
  const [transactions, setTransactions] = React.useState<WalletTransaction[]>([])
  const [payouts, setPayouts] = React.useState<PayoutRequest[]>([])
  const [overview, setOverview] = React.useState<AnalyticsOverview | null>(null)
  const [sales, setSales] = React.useState<SalesPoint[]>([])
  const [loading, setLoading] = React.useState(true)
  const [txFilter, setTxFilter] = React.useState<"all" | "credit" | "debit">("all")

  React.useEffect(() => {
    const end = new Date()
    const start = new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000)
    const params = `?start_at=${start.toISOString()}&end_at=${end.toISOString()}`
    Promise.allSettled([
      api.get<WalletResponse>("/wallet/me"),
      api.get<WalletTransaction[]>("/wallet/me/transactions"),
      api.get<PayoutRequest[]>("/wallet/me/payouts"),
      api.get<AnalyticsOverview>(`/analytics/seller/me/overview${params}`),
      api.get<SalesPoint[]>(`/analytics/seller/me/sales${params}`),
    ])
      .then(([wRes, txRes, pyRes, ovRes, slRes]) => {
        if (wRes.status === "fulfilled") setWallet(wRes.value)
        if (txRes.status === "fulfilled") setTransactions(txRes.value)
        if (pyRes.status === "fulfilled") setPayouts(pyRes.value)
        if (ovRes.status === "fulfilled") setOverview(ovRes.value)
        if (slRes.status === "fulfilled") setSales(slRes.value)
      })
      .finally(() => setLoading(false))
  }, [])

  const cancelPayout = async (id: string) => {
    try {
      const updated = await api.post<PayoutRequest>(`/wallet/me/payouts/${id}/cancel`, {})
      setPayouts((prev) => prev.map((p) => (p.id === id ? updated : p)))
      toast.add({ title: "Payout cancelled", description: "Funds have been released back to your wallet.", type: "success" })
    } catch (err) {
      toast.add({ title: "Failed to cancel payout", description: getApiError(err), type: "error" })
    }
  }

  const filteredTx = React.useMemo(() => {
    if (txFilter === "all") return transactions
    return transactions.filter((tx) => {
      const isCredit = creditTypes.includes(tx.transaction_type)
      return txFilter === "credit" ? isCredit : !isCredit
    })
  }, [transactions, txFilter])

  if (loading) {
    return (
      <PageSkeleton>
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => <StatsCardSkeleton key={i} />)}
        </div>
        <Skeleton className="h-[340px] w-full" />
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
      </PageSkeleton>
    )
  }

  const available = Number(wallet?.available_balance ?? 0)
  const pending = Number(wallet?.pending_balance ?? 0)
  const reserved = Number(wallet?.reserved_balance ?? 0)
  const paidOut = Number(wallet?.paid_out_balance ?? 0)
  const refunded = Number(wallet?.refunded_balance ?? 0)
  const debt = Number(wallet?.debt_balance ?? 0)

  const grossSales = Number(overview?.money.gross_sales ?? 0)
  const netEarnings = Number(overview?.money.seller_net_earnings ?? 0)
  const commissionPaid = Number(overview?.money.commission_revenue ?? 0)
  const refundsCompleted = Number(overview?.money.refunds_completed ?? 0)
  const payoutsCompleted = Number(overview?.money.payouts_completed ?? 0)
  const avgOrderValue = Number(overview?.average_order_value ?? 0)

  const balanceCards = [
    {
      title: "Available Balance",
      value: formatPrice(available),
      icon: Wallet,
      color: "text-green-600",
      bg: "bg-green-500/10",
      desc: "Ready for withdrawal",
    },
    {
      title: "Pending Balance",
      value: formatPrice(pending),
      icon: Clock,
      color: "text-amber-600",
      bg: "bg-amber-500/10",
      desc: "Awaiting settlement",
    },
    {
      title: "Reserved (Payouts)",
      value: formatPrice(reserved),
      icon: ArrowDownToLine,
      color: "text-blue-600",
      bg: "bg-blue-500/10",
      desc: "In payout processing",
    },
    {
      title: "Total Paid Out",
      value: formatPrice(paidOut),
      icon: Banknote,
      color: "text-purple-600",
      bg: "bg-purple-500/10",
      desc: "Lifetime withdrawals",
    },
  ]

  const revenueCards = [
    { title: "Gross Sales (30d)", value: formatPrice(grossSales), icon: TrendingUp, color: "text-chart-1" },
    { title: "Net Earnings (30d)", value: formatPrice(netEarnings), icon: TShIcon, color: "text-green-600" },
    { title: "Commission Paid (30d)", value: formatPrice(commissionPaid), icon: RefreshCw, color: "text-muted-foreground" },
    { title: "Avg Order Value", value: formatPrice(Math.round(avgOrderValue)), icon: TrendingUp, color: "text-chart-3" },
  ]

  const chartData = sales.map((s) => ({
    period: s.period,
    amount: Number(s.amount),
    earnings: Number(s.amount) * (netEarnings / (grossSales || 1)),
  }))

  const breakdownData = [
    { name: "Net Earnings", value: netEarnings },
    { name: "Commission", value: commissionPaid },
    { name: "Refunds", value: refundsCompleted },
    { name: "Payouts", value: payoutsCompleted },
  ].filter((d) => d.value > 0)

  const totalTxIn = transactions.filter((t) => creditTypes.includes(t.transaction_type)).reduce((sum, t) => sum + Number(t.amount), 0)
  const totalTxOut = transactions.filter((t) => !creditTypes.includes(t.transaction_type)).reduce((sum, t) => sum + Number(t.amount), 0)

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="animate-fade-in-up">
          <h2 className="text-2xl font-bold tracking-tight">Revenue</h2>
          <p className="text-sm text-muted-foreground">
            Track your earnings, wallet balances, payouts, and financial performance.
          </p>
        </div>
        <Link href="/dashboard/seller/wallet" className={buttonVariants({ variant: "outline" })}>
          <Wallet className="size-4" />
          Full Wallet
        </Link>
      </div>

      {/* Wallet Balance Cards */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {balanceCards.map((card, i) => (
          <Card key={card.title} className={`opacity-0-init animate-fade-in-up animation-delay-${i * 100}`}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{card.title}</CardTitle>
              <div className={`flex size-8 items-center justify-center rounded-lg ${card.bg}`}>
                <card.icon className={`size-4 ${card.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold animate-count-up">{card.value}</div>
              <p className="mt-1 text-xs text-muted-foreground">{card.desc}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Revenue Summary Cards */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {revenueCards.map((card, i) => (
          <Card key={card.title} className={`opacity-0-init animate-fade-in-up animation-delay-${i * 100 + 400}`}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{card.title}</CardTitle>
              <card.icon className={`size-4 ${card.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold">{card.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Revenue Chart + Breakdown Pie */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="lg:col-span-4 opacity-0-init animate-fade-in-scale animation-delay-500">
          <CardHeader>
            <CardTitle>Revenue & Earnings Trend</CardTitle>
            <CardDescription>Daily gross sales and estimated net earnings (30 days)</CardDescription>
          </CardHeader>
          <CardContent>
            {chartData.length === 0 ? (
              <div className="flex h-[300px] items-center justify-center text-sm text-muted-foreground">
                No revenue data for this period yet.
              </div>
            ) : (
              <ChartContainer config={revenueChartConfig} className="h-[300px] w-full">
                <AreaChart data={chartData} margin={{ left: 12, right: 12, top: 8, bottom: 8 }}>
                  <defs>
                    <linearGradient id="revFillAmount" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--color-amount)" stopOpacity={0.5} />
                      <stop offset="100%" stopColor="var(--color-amount)" stopOpacity={0.05} />
                    </linearGradient>
                    <linearGradient id="revFillEarnings" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--color-earnings)" stopOpacity={0.4} />
                      <stop offset="100%" stopColor="var(--color-earnings)" stopOpacity={0.05} />
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
                    fill="url(#revFillAmount)"
                    name="Gross Sales"
                  />
                  <Area
                    type="monotone"
                    dataKey="earnings"
                    stroke="var(--color-earnings)"
                    strokeWidth={2}
                    fill="url(#revFillEarnings)"
                    name="Net Earnings"
                  />
                </AreaChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-3 opacity-0-init animate-fade-in-scale animation-delay-700">
          <CardHeader>
            <CardTitle>Revenue Breakdown</CardTitle>
            <CardDescription>Where your money goes (30d)</CardDescription>
          </CardHeader>
          <CardContent>
            {breakdownData.length === 0 ? (
              <div className="flex h-[300px] items-center justify-center text-sm text-muted-foreground">
                No breakdown data available.
              </div>
            ) : (
              <ChartContainer config={breakdownConfig} className="h-[300px] w-full">
                <PieChart>
                  <ChartTooltip content={<ChartTooltipContent nameKey="value" />} />
                  <Pie
                    data={breakdownData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={90}
                    innerRadius={50}
                    paddingAngle={3}
                  >
                    {breakdownData.map((_, idx) => (
                      <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                </PieChart>
              </ChartContainer>
            )}
            {breakdownData.length > 0 && (
              <div className="mt-4 flex flex-wrap justify-center gap-3">
                {breakdownData.map((d, idx) => (
                  <div key={d.name} className="flex items-center gap-1.5 text-xs">
                    <div className="size-2.5 rounded-full" style={{ backgroundColor: PIE_COLORS[idx % PIE_COLORS.length] }} />
                    <span className="text-muted-foreground">{d.name}</span>
                    <span className="font-medium">{formatPrice(d.value)}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Transaction Flow Summary */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Inflow</CardTitle>
            <TrendingUp className="size-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-green-600">{formatPrice(totalTxIn)}</div>
            <p className="mt-1 text-xs text-muted-foreground">Credits to wallet</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Outflow</CardTitle>
            <TrendingDown className="size-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-red-600">{formatPrice(totalTxOut)}</div>
            <p className="mt-1 text-xs text-muted-foreground">Debits from wallet</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Refunds</CardTitle>
            <RefreshCw className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">{formatPrice(refunded)}</div>
            <p className="mt-1 text-xs text-muted-foreground">Lifetime refunds</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Debt Balance</CardTitle>
            <XCircle className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={cn("text-xl font-bold", debt > 0 ? "text-red-600" : "")}>{formatPrice(debt)}</div>
            <p className="mt-1 text-xs text-muted-foreground">Recoverable amount</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Transactions */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Wallet Transactions</CardTitle>
              <CardDescription>All credits and debits to your wallet</CardDescription>
            </div>
            <div className="flex gap-1 rounded-lg border p-1">
              {(["all", "credit", "debit"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setTxFilter(f)}
                  className={cn(
                    "rounded-md px-3 py-1.5 text-sm font-medium transition-all",
                    txFilter === f
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  )}
                >
                  {f === "all" ? "All" : f === "credit" ? "Credits" : "Debits"}
                </button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredTx.length === 0 ? (
            <div className="flex h-24 items-center justify-center text-sm text-muted-foreground">
              No transactions yet.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Reference</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTx.slice(0, 15).map((tx) => {
                  const isCredit = creditTypes.includes(tx.transaction_type)
                  const cfg = txTypeConfig[tx.transaction_type] ?? { label: tx.transaction_type, color: "hsl(var(--muted))" }
                  return (
                    <TableRow key={tx.id}>
                      <TableCell>
                        <Badge variant={isCredit ? "default" : "outline"} className="text-xs">
                          {cfg.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate text-sm text-muted-foreground">
                        {tx.description ?? "—"}
                      </TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {tx.reference.slice(0, 20)}…
                      </TableCell>
                      <TableCell className={cn("font-medium", isCredit ? "text-green-600" : "text-red-600")}>
                        {isCredit ? "+" : "−"}{formatPrice(Number(tx.amount))}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Clock className="size-3" />
                          {formatDate(tx.created_at)}
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Recent Payouts */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Recent Payouts</CardTitle>
              <CardDescription>Your withdrawal requests and their status</CardDescription>
            </div>
            <Link href="/dashboard/seller/wallet" className={buttonVariants({ variant: "outline", size: "sm" })}>
              <Plus className="size-4" />
              New Payout
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {payouts.length === 0 ? (
            <div className="flex h-24 items-center justify-center text-sm text-muted-foreground">
              No payout requests yet. Request a payout from your wallet.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Note</TableHead>
                  <TableHead>Requested</TableHead>
                  <TableHead>Completed</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payouts.slice(0, 10).map((payout) => {
                  const cfg = payoutStatusConfig[payout.status] ?? { label: payout.status, variant: "outline" as const }
                  return (
                    <TableRow key={payout.id}>
                      <TableCell className="font-medium">{formatPrice(Number(payout.amount))}</TableCell>
                      <TableCell>
                        <Badge variant={cfg.variant}>{cfg.label}</Badge>
                      </TableCell>
                      <TableCell className="max-w-[180px] truncate text-sm text-muted-foreground">
                        {payout.seller_note ?? payout.admin_note ?? "—"}
                      </TableCell>
                      <TableCell className="text-muted-foreground">{formatDate(payout.requested_at)}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {payout.completed_at ? formatDate(payout.completed_at) : "—"}
                      </TableCell>
                      <TableCell>
                        {payout.status === "pending" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => cancelPayout(payout.id)}
                          >
                            Cancel
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
