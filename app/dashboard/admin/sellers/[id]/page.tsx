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
  Store,
  Wallet,
  Check,
  X,
  FileText,
  Package,
  ShoppingBag,
  CreditCard,
  MapPin,
  Shield,
  Activity,
  TrendingUp,
} from "lucide-react"
import { api, type ApiError } from "@/lib/api"

type Seller = {
  id: string
  user_id: string
  business_name: string
  business_description: string | null
  business_country: string | null
  business_region: string | null
  business_city: string | null
  business_address: string | null
  product_description: string | null
  years_in_business: string | null
  website_url: string | null
  contact_email: string | null
  contact_phone: string | null
  status: string
  agreement_accepted: boolean
  created_at: string
}

type KycDocument = {
  id: string
  seller_id: string
  document_type: string
  document_url: string
  status: string
  rejection_reason: string | null
  uploaded_at: string
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

type PayoutRequest = {
  id: string
  amount: number
  currency: string
  status: string
  requested_at: string
  completed_at: string | null
}

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

const sellerStatusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  approved: { label: "Approved", variant: "default" },
  active: { label: "Active", variant: "default" },
  pending: { label: "Pending", variant: "secondary" },
  under_review: { label: "Under Review", variant: "secondary" },
  suspended: { label: "Suspended", variant: "destructive" },
  rejected: { label: "Rejected", variant: "destructive" },
}

function getApiError(err: unknown): string {
  const e = err as ApiError
  return e?.detail || "Something went wrong."
}

function formatPrice(price: number): string {
  return `TSh ${Number(price).toLocaleString()}`
}

export default function SellerDetailPage() {
  const params = useParams()
  const router = useRouter()
  const sellerId = params.id as string

  const [seller, setSeller] = React.useState<Seller | null>(null)
  const [user, setUser] = React.useState<AdminUser | null>(null)
  const [docs, setDocs] = React.useState<KycDocument[]>([])
  const [wallet, setWallet] = React.useState<SellerWallet | null>(null)
  const [transactions, setTransactions] = React.useState<WalletTransaction[]>([])
  const [payouts, setPayouts] = React.useState<PayoutRequest[]>([])
  const [actionLoading, setActionLoading] = React.useState(false)
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    if (!sellerId) return
    setLoading(true)
    Promise.allSettled([
      api.get<Seller>(`/admin/sellers/${sellerId}`),
      api.get<KycDocument[]>(`/sellers/admin/${sellerId}/documents`),
      api.get<SellerWallet[]>(`/wallet/admin/wallets`),
      api.get<PayoutRequest[]>(`/wallet/admin/payouts`),
    ])
      .then(async ([sellerRes, docsRes, walletsRes, payoutsRes]) => {
        if (sellerRes.status === "fulfilled") {
          setSeller(sellerRes.value)
          // Fetch the user info
          if (sellerRes.value.user_id) {
            api.get<AdminUser>(`/admin/users/${sellerRes.value.user_id}`)
              .then(setUser)
              .catch(() => {})
          }
        } else {
          toast.add({ title: "Failed to load seller", description: getApiError(sellerRes.reason), type: "error" })
        }
        if (docsRes.status === "fulfilled") setDocs(docsRes.value)
        if (walletsRes.status === "fulfilled") {
          const w = walletsRes.value.find((x) => x.seller_id === sellerId)
          if (w) setWallet(w)
        }
        if (payoutsRes.status === "fulfilled") {
          setPayouts(payoutsRes.value.filter((p) => p.id && true).slice(0, 10))
        }
      })
      .finally(() => setLoading(false))
  }, [sellerId])

  const handleApprove = async () => {
    if (!seller) return
    setActionLoading(true)
    try {
      await api.post(`/sellers/admin/${seller.id}/approve`)
      toast.add({ title: "Seller approved!", description: `${seller.business_name} is now active.`, type: "success" })
      setSeller({ ...seller, status: "approved" })
    } catch (err) {
      toast.add({ title: "Failed to approve seller", description: getApiError(err), type: "error" })
    } finally {
      setActionLoading(false)
    }
  }

  const handleReject = async () => {
    if (!seller) return
    setActionLoading(true)
    try {
      const formData = new FormData()
      formData.append("reason", "Rejected by admin from seller detail page")
      await api.post(`/sellers/admin/${seller.id}/reject`, formData)
      toast.add({ title: "Seller rejected", description: `${seller.business_name} has been rejected.`, type: "success" })
      setSeller({ ...seller, status: "rejected" })
    } catch (err) {
      toast.add({ title: "Failed to reject seller", description: getApiError(err), type: "error" })
    } finally {
      setActionLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col gap-6">
        <Skeleton className="h-10 w-32" />
        <div className="flex items-center gap-4">
          <Skeleton className="h-16 w-16 rounded-full" />
          <div className="flex flex-col gap-2">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28" />)}
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    )
  }

  if (!seller) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-20">
        <X className="size-10 text-red-500" />
        <h2 className="text-lg font-semibold">Seller not found</h2>
        <Button variant="outline" onClick={() => router.push("/dashboard/admin/sellers")}>
          <ArrowLeft className="size-4" /> Back to Sellers
        </Button>
      </div>
    )
  }

  const initials = seller.business_name.slice(0, 2).toUpperCase()
  const isPending = seller.status === "pending" || seller.status === "under_review"

  return (
    <div className="flex flex-col gap-6">
      {/* Back button */}
      <Button variant="ghost" size="sm" className="w-fit" onClick={() => router.push("/dashboard/admin/sellers")}>
        <ArrowLeft className="size-4" /> Back to Sellers
      </Button>

      {/* Seller Header */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex size-16 items-center justify-center rounded-xl bg-primary/10 text-xl font-bold text-primary">
                {initials}
              </div>
              <div>
                <h2 className="text-2xl font-bold tracking-tight">{seller.business_name}</h2>
                <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                  {seller.contact_email && (
                    <span className="flex items-center gap-1">
                      <Mail className="size-3.5" /> {seller.contact_email}
                    </span>
                  )}
                  {seller.contact_phone && (
                    <span className="flex items-center gap-1">
                      <Phone className="size-3.5" /> {seller.contact_phone}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Calendar className="size-3.5" /> {new Date(seller.created_at).toLocaleDateString()}
                  </span>
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <Badge variant={sellerStatusConfig[seller.status]?.variant ?? "outline"}>
                    {sellerStatusConfig[seller.status]?.label ?? seller.status}
                  </Badge>
                  {seller.agreement_accepted && (
                    <Badge variant="outline" className="gap-1">
                      <Shield className="size-3" /> Agreement Accepted
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            {isPending && (
              <div className="flex gap-2">
                <Button variant="destructive" disabled={actionLoading} onClick={handleReject}>
                  <X className="size-4" /> Reject
                </Button>
                <Button disabled={actionLoading} onClick={handleApprove}>
                  <Check className="size-4" /> Approve Seller
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Status</CardTitle>
            <Store className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold capitalize">{sellerStatusConfig[seller.status]?.label ?? seller.status}</div>
          </CardContent>
        </Card>
        {wallet && (
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
        {wallet && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Pending Balance</CardTitle>
              <TrendingUp className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold text-amber-600">{formatPrice(Number(wallet.pending_balance))}</div>
            </CardContent>
          </Card>
        )}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">KYC Documents</CardTitle>
            <FileText className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">{docs.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Business Profile */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Store className="size-4" /> Business Profile
          </CardTitle>
          <CardDescription>Detailed business information</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <p className="text-xs text-muted-foreground">Business Name</p>
              <p className="mt-1 font-medium">{seller.business_name}</p>
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
              <p className="mt-1 font-medium flex items-center gap-1">
                <MapPin className="size-3.5 text-muted-foreground" />
                {[seller.business_city, seller.business_region, seller.business_country].filter(Boolean).join(", ") || "—"}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Years in Business</p>
              <p className="mt-1 font-medium">{seller.years_in_business ?? "—"}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Website</p>
              <p className="mt-1 font-medium">
                {seller.website_url ? (
                  <a href={seller.website_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                    {seller.website_url}
                  </a>
                ) : "—"}
              </p>
            </div>
            {seller.business_description && (
              <div className="sm:col-span-2 lg:col-span-3">
                <p className="text-xs text-muted-foreground">Business Description</p>
                <p className="mt-1 text-sm">{seller.business_description}</p>
              </div>
            )}
            {seller.product_description && (
              <div className="sm:col-span-2 lg:col-span-3">
                <p className="text-xs text-muted-foreground">Product Description</p>
                <p className="mt-1 text-sm">{seller.product_description}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Linked User Account */}
      {user && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="size-4" /> Linked User Account
            </CardTitle>
            <CardDescription>The user account associated with this seller</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div>
                <p className="text-xs text-muted-foreground">Name</p>
                <p className="mt-1 font-medium">{user.first_name ?? ""} {user.last_name ?? ""}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Email</p>
                <p className="mt-1 font-medium">{user.email}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Phone</p>
                <p className="mt-1 font-medium">{user.phone ?? "—"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">User Status</p>
                <p className="mt-1"><Badge variant={user.status === "active" ? "default" : "outline"}>{user.status}</Badge></p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Verified</p>
                <p className="mt-1"><Badge variant={user.is_verified ? "default" : "secondary"}>{user.is_verified ? "Verified" : "Unverified"}</Badge></p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Member Since</p>
                <p className="mt-1 font-medium">{new Date(user.created_at).toLocaleDateString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* KYC Documents */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="size-4" /> KYC Documents
          </CardTitle>
          <CardDescription>Verification documents uploaded by the seller</CardDescription>
        </CardHeader>
        <CardContent>
          {docs.length === 0 ? (
            <div className="flex h-24 items-center justify-center text-sm text-muted-foreground">No documents uploaded.</div>
          ) : (
            <div className="flex flex-col gap-2">
              {docs.map((doc) => (
                <div key={doc.id} className="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-muted/30">
                  <div className="flex items-center gap-3">
                    <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10">
                      <FileText className="size-4 text-primary" />
                    </div>
                    <div>
                      <div className="text-sm font-medium capitalize">{doc.document_type.replace(/_/g, " ")}</div>
                      <div className="text-xs text-muted-foreground">Uploaded: {new Date(doc.uploaded_at).toLocaleDateString()}</div>
                      {doc.rejection_reason && (
                        <div className="text-xs text-red-500">Rejected: {doc.rejection_reason}</div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={doc.status === "approved" ? "default" : doc.status === "rejected" ? "destructive" : "secondary"}>
                      {doc.status}
                    </Badge>
                    <a href={doc.document_url} target="_blank" rel="noopener noreferrer">
                      <Button variant="outline" size="sm">View Document</Button>
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
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

      {/* Payout Requests */}
      {payouts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="size-4" /> Payout Requests
            </CardTitle>
            <CardDescription>Recent payout history for this seller</CardDescription>
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
    </div>
  )
}
