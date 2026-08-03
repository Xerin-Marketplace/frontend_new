"use client"

import * as React from "react"
import { useParams, useRouter } from "next/navigation"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "@/components/ui/toast"
import {
  ArrowLeft,
  Mail,
  Phone,
  Calendar,
  Shield,
  Store,
  Wallet,
  ShoppingBag,
  CheckCircle,
  XCircle,
  Package,
  TrendingUp,
  RefreshCw,
  CreditCard,
  Truck,
  Bell,
  Activity,
  User as UserIcon,
} from "lucide-react"
import { api, type ApiError } from "@/lib/api"

// ─── Types ──────────────────────────────────────────────────────────────────

type AdminUser = {
  id: string
  first_name: string | null
  last_name: string | null
  email: string
  phone: string | null
  status: string
  is_verified: boolean
  created_at: string
}

type SellerProfile = {
  id: string
  user_id: string
  business_name: string
  business_description: string | null
  business_country: string | null
  business_region: string | null
  business_city: string | null
  business_address: string | null
  contact_email: string | null
  contact_phone: string | null
  status: string
  agreement_accepted: boolean
  created_at: string
}

type SellerWallet = {
  id: string
  seller_id: string
  currency: string
  pending_balance: number
  available_balance: number
  reserved_balance: number
  debt_balance: number
  paid_out_balance: number
  is_frozen: boolean
}

type WalletTransaction = {
  id: string
  wallet_id: string
  transaction_type: string
  amount: number
  currency: string
  reference: string | null
  description: string | null
  created_at: string
}

type Order = {
  id: string
  order_number: string | null
  total: number
  status: string
  created_at: string
}

type PayoutRequest = {
  id: string
  amount: number
  currency: string
  status: string
  requested_at: string
  completed_at: string | null
}

type AdminActivityLog = {
  id: string
  admin_user_id: string | null
  action: string
  resource_type: string
  resource_id: string | null
  details: string | null
  created_at: string
}

type Refund = {
  id: string
  status: string
  total_amount: number
  currency: string
  created_at: string
}

function getApiError(err: unknown): string {
  const e = err as ApiError
  return e?.detail || "Something went wrong."
}

function formatPrice(price: number): string {
  return `TSh ${Number(price).toLocaleString()}`
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function UserDetailPage() {
  const params = useParams()
  const router = useRouter()
  const userId = params.id as string

  const [user, setUser] = React.useState<AdminUser | null>(null)
  const [seller, setSeller] = React.useState<SellerProfile | null>(null)
  const [wallet, setWallet] = React.useState<SellerWallet | null>(null)
  const [transactions, setTransactions] = React.useState<WalletTransaction[]>([])
  const [payouts, setPayouts] = React.useState<PayoutRequest[]>([])
  const [orders, setOrders] = React.useState<Order[]>([])
  const [refunds, setRefunds] = React.useState<Refund[]>([])
  const [activityLogs, setActivityLogs] = React.useState<AdminActivityLog[]>([])
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    if (!userId) return
    setLoading(true)
    Promise.allSettled([
      api.get<AdminUser>(`/admin/users/${userId}`),
      api.get<SellerProfile[]>(`/admin/sellers`).catch(() => null),
    ])
      .then(async ([userRes, sellersRes]) => {
        if (userRes.status === "fulfilled") {
          setUser(userRes.value)
        } else {
          toast.add({ title: "Failed to load user", description: getApiError(userRes.reason), type: "error" })
          return
        }

        // Try to find seller profile for this user
        if (sellersRes.status === "fulfilled" && sellersRes.value) {
          const found = sellersRes.value.find((s) => s.user_id === userId)
          if (found) {
            setSeller(found)
            // Fetch wallet, transactions, payouts for this seller
            const sellerId = found.id
            const [walletRes, txRes, payoutRes] = await Promise.allSettled([
              api.get<SellerWallet[]>(`/wallet/admin/wallets`).then((wallets) => wallets.find((w) => w.seller_id === sellerId) || null),
              api.get<WalletTransaction[]>(`/wallet/me/transactions`).catch(() => []),
              api.get<PayoutRequest[]>(`/wallet/me/payouts`).catch(() => []),
            ])
            if (walletRes.status === "fulfilled" && walletRes.value) setWallet(walletRes.value)
            if (txRes.status === "fulfilled") setTransactions(txRes.value)
            if (payoutRes.status === "fulfilled") setPayouts(payoutRes.value)
          }
        }

        // Fetch orders for this user
        const ordersRes = await api.get<{ results: Order[]; total: number }>(`/orders/admin/all?page=1&page_size=10`).catch(() => null)
        if (ordersRes) {
          // Filter orders by user_id if the API returns them
          setOrders(ordersRes.results || [])
        }

        // Fetch refunds
        const refundsRes = await api.get<Refund[]>(`/refunds/admin`).catch(() => null)
        if (refundsRes) setRefunds(refundsRes.slice(0, 5))

        // Fetch activity logs for admin users
        const logsRes = await api.get<AdminActivityLog[]>(`/admin/dashboard/activity-logs?limit=10`).catch(() => null)
        if (logsRes) setActivityLogs(logsRes)
      })
      .finally(() => setLoading(false))
  }, [userId])

  if (loading) {
    return (
      <div className="flex flex-col gap-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="flex flex-col gap-2">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28" />)}
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-20">
        <XCircle className="size-10 text-red-500" />
        <h2 className="text-lg font-semibold">User not found</h2>
        <Button variant="outline" onClick={() => router.push("/dashboard/admin/users")}>
          <ArrowLeft className="size-4" /> Back to Users
        </Button>
      </div>
    )
  }

  const fullName = `${user.first_name ?? ""} ${user.last_name ?? ""}`.trim() || user.email
  const initials = `${user.first_name?.[0] ?? ""}${user.last_name?.[0] ?? ""}`.toUpperCase() || "U"

  // Determine user type
  const isSeller = !!seller
  const isAdmin = user.status === "active" && !isSeller // simplified

  return (
    <div className="flex flex-col gap-6">
      {/* Back button */}
      <Button variant="ghost" size="sm" className="w-fit" onClick={() => router.push("/dashboard/admin/users")}>
        <ArrowLeft className="size-4" /> Back to Users
      </Button>

      {/* User Header */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex size-16 items-center justify-center rounded-full bg-primary/10 text-xl font-bold text-primary">
                {initials}
              </div>
              <div>
                <h2 className="text-2xl font-bold tracking-tight">{fullName}</h2>
                <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Mail className="size-3.5" /> {user.email}
                  </span>
                  {user.phone && (
                    <span className="flex items-center gap-1">
                      <Phone className="size-3.5" /> {user.phone}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Calendar className="size-3.5" /> {new Date(user.created_at).toLocaleDateString()}
                  </span>
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <Badge variant={user.status === "active" ? "default" : "outline"}>{user.status}</Badge>
                  <Badge variant={user.is_verified ? "default" : "secondary"}>
                    {user.is_verified ? "Verified" : "Unverified"}
                  </Badge>
                  {isSeller && <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">Seller</Badge>}
                  {isAdmin && <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">Admin</Badge>}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Account Type</CardTitle>
            <UserIcon className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold capitalize">
              {isSeller ? "Seller" : isAdmin ? "Admin" : "Customer"}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Verification</CardTitle>
            {user.is_verified ? <CheckCircle className="size-4 text-green-500" /> : <XCircle className="size-4 text-red-500" />}
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">{user.is_verified ? "Verified" : "Unverified"}</div>
          </CardContent>
        </Card>
        {isSeller && wallet && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Available Balance</CardTitle>
              <Wallet className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold">{formatPrice(Number(wallet.available_balance))}</div>
            </CardContent>
          </Card>
        )}
        {isSeller && wallet && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Pending Balance</CardTitle>
              <RefreshCw className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold text-amber-600">{formatPrice(Number(wallet.pending_balance))}</div>
            </CardContent>
          </Card>
        )}
        {!isSeller && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Member Since</CardTitle>
              <Calendar className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold">{new Date(user.created_at).toLocaleDateString()}</div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* ─── Seller Profile ────────────────────────────────────────────────── */}
      {isSeller && seller && (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Store className="size-4" /> Seller Profile
              </CardTitle>
              <CardDescription>Business information and seller status</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div>
                  <p className="text-xs text-muted-foreground">Business Name</p>
                  <p className="mt-1 font-medium">{seller.business_name}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Status</p>
                  <p className="mt-1">
                    <Badge variant={seller.status === "approved" ? "default" : "outline"}>{seller.status}</Badge>
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Contact Email</p>
                  <p className="mt-1 font-medium">{seller.contact_email ?? "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Contact Phone</p>
                  <p className="mt-1 font-medium">{seller.contact_phone ?? "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Location</p>
                  <p className="mt-1 font-medium">
                    {[seller.business_city, seller.business_region, seller.business_country].filter(Boolean).join(", ") || "—"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Created</p>
                  <p className="mt-1 font-medium">{new Date(seller.created_at).toLocaleDateString()}</p>
                </div>
                {seller.business_description && (
                  <div className="sm:col-span-2 lg:col-span-3">
                    <p className="text-xs text-muted-foreground">Business Description</p>
                    <p className="mt-1 text-sm">{seller.business_description}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Wallet Details */}
          {wallet && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wallet className="size-4" /> Wallet Details
                </CardTitle>
                <CardDescription>Seller wallet balances and financial info</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="rounded-lg border p-4">
                    <p className="text-xs text-muted-foreground">Available Balance</p>
                    <p className="mt-1 text-lg font-bold">{formatPrice(Number(wallet.available_balance))}</p>
                  </div>
                  <div className="rounded-lg border p-4">
                    <p className="text-xs text-muted-foreground">Pending Balance</p>
                    <p className="mt-1 text-lg font-bold text-amber-600">{formatPrice(Number(wallet.pending_balance))}</p>
                  </div>
                  <div className="rounded-lg border p-4">
                    <p className="text-xs text-muted-foreground">Reserved Balance</p>
                    <p className="mt-1 text-lg font-bold text-orange-600">{formatPrice(Number(wallet.reserved_balance))}</p>
                  </div>
                  <div className="rounded-lg border p-4">
                    <p className="text-xs text-muted-foreground">Total Paid Out</p>
                    <p className="mt-1 text-lg font-bold text-green-600">{formatPrice(Number(wallet.paid_out_balance))}</p>
                  </div>
                </div>
                {wallet.is_frozen && (
                  <div className="mt-4 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-900 dark:bg-red-950/50">
                    <Shield className="size-4 text-red-500" />
                    <span className="text-sm font-medium text-red-700 dark:text-red-300">This wallet is frozen</span>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Wallet Transactions */}
          {transactions.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="size-4" /> Wallet Transactions
                </CardTitle>
                <CardDescription>Recent wallet activity</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Type</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions.slice(0, 10).map((tx) => (
                      <TableRow key={tx.id}>
                        <TableCell>
                          <Badge variant="outline">{tx.transaction_type.replace(/_/g, " ")}</Badge>
                        </TableCell>
                        <TableCell className="font-medium">{formatPrice(Number(tx.amount))}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{tx.description ?? "—"}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{new Date(tx.created_at).toLocaleString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {/* Payout Requests */}
          {payouts.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="size-4" /> Payout Requests
                </CardTitle>
                <CardDescription>Recent payout history</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Requested</TableHead>
                      <TableHead>Completed</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payouts.slice(0, 10).map((p) => (
                      <TableRow key={p.id}>
                        <TableCell className="font-medium">{formatPrice(Number(p.amount))}</TableCell>
                        <TableCell>
                          <Badge variant={p.status === "completed" ? "default" : p.status === "failed" ? "destructive" : "outline"}>
                            {p.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">{new Date(p.requested_at).toLocaleDateString()}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {p.completed_at ? new Date(p.completed_at).toLocaleDateString() : "—"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* ─── Admin Activity Logs ───────────────────────────────────────────── */}
      {isAdmin && activityLogs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="size-4" /> Admin Activity
            </CardTitle>
            <CardDescription>Recent admin actions and operations</CardDescription>
          </CardHeader>
          <CardContent>
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
          </CardContent>
        </Card>
      )}

      {/* ─── Orders ─────────────────────────────────────────────────────────── */}
      {orders.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingBag className="size-4" /> Recent Orders
            </CardTitle>
            <CardDescription>Latest orders on the platform</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order ID</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.slice(0, 10).map((o) => (
                  <TableRow key={o.id}>
                    <TableCell className="font-mono text-xs">#{o.id.slice(0, 8)}</TableCell>
                    <TableCell className="font-medium">{formatPrice(Number(o.total))}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{o.status}</Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">{new Date(o.created_at).toLocaleDateString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* ─── Refunds ─────────────────────────────────────────────────────────── */}
      {refunds.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RefreshCw className="size-4" /> Recent Refunds
            </CardTitle>
            <CardDescription>Latest refund requests</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Refund ID</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {refunds.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-mono text-xs">#{r.id.slice(0, 8)}</TableCell>
                    <TableCell className="font-medium">{formatPrice(Number(r.total_amount))}</TableCell>
                    <TableCell>
                      <Badge variant={r.status === "completed" ? "default" : "outline"}>{r.status}</Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* ─── User Details (for regular users) ──────────────────────────────── */}
      {!isSeller && !isAdmin && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserIcon className="size-4" /> User Details
            </CardTitle>
            <CardDescription>Account information and activity</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-lg border p-4">
                <p className="text-xs text-muted-foreground">Full Name</p>
                <p className="mt-1 font-medium">{fullName}</p>
              </div>
              <div className="rounded-lg border p-4">
                <p className="text-xs text-muted-foreground">Email</p>
                <p className="mt-1 font-medium">{user.email}</p>
              </div>
              <div className="rounded-lg border p-4">
                <p className="text-xs text-muted-foreground">Phone</p>
                <p className="mt-1 font-medium">{user.phone ?? "—"}</p>
              </div>
              <div className="rounded-lg border p-4">
                <p className="text-xs text-muted-foreground">Status</p>
                <p className="mt-1">
                  <Badge variant={user.status === "active" ? "default" : "outline"}>{user.status}</Badge>
                </p>
              </div>
              <div className="rounded-lg border p-4">
                <p className="text-xs text-muted-foreground">Verified</p>
                <p className="mt-1">
                  <Badge variant={user.is_verified ? "default" : "secondary"}>
                    {user.is_verified ? "Verified" : "Unverified"}
                  </Badge>
                </p>
              </div>
              <div className="rounded-lg border p-4">
                <p className="text-xs text-muted-foreground">Member Since</p>
                <p className="mt-1 font-medium">{new Date(user.created_at).toLocaleDateString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
