"use client"

import * as React from "react"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog"
import {
  Field,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { toast } from "@/components/ui/toast"
import {
  Package,
  Search,
  Check,
  X,
  Eye,
} from "lucide-react"
import { api, type ApiError } from "@/lib/api"
import { useAuth } from "@/lib/auth-context"
import { PageSkeleton, TableSkeleton } from "@/components/skeletons"

type Product = {
  id: string
  seller_id: string
  category_id: string | null
  brand_id: string | null
  sku: string | null
  name: string
  slug: string
  description: string | null
  price: number
  sale_price: number | null
  currency: string
  weight: number | null
  status: string
  rejection_reason: string | null
  is_active: boolean
  submitted_at: string | null
  approved_at: string | null
  images: { id: string; image_url: string; alt_text: string | null; is_primary: boolean }[]
  created_at: string
}

const productStatusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  draft: { label: "Draft", variant: "outline" },
  pending_review: { label: "Pending Review", variant: "secondary" },
  approved: { label: "Approved", variant: "default" },
  rejected: { label: "Rejected", variant: "destructive" },
  suspended: { label: "Suspended", variant: "destructive" },
}

function formatPrice(price: number): string {
  return `TSh ${Number(price).toLocaleString()}`
}

function getApiError(err: unknown): string {
  const e = err as ApiError
  return e?.detail || "Something went wrong. Please try again."
}

export default function AdminProductsPage() {
  const { hasPermission, isSuperAdmin } = useAuth()
  const canApprove = isSuperAdmin || hasPermission("can_approve_products")
  const canReject = isSuperAdmin || hasPermission("can_reject_products")
  const [products, setProducts] = React.useState<Product[]>([])
  const [loading, setLoading] = React.useState(true)
  const [search, setSearch] = React.useState("")
  const [searchInput, setSearchInput] = React.useState("")
  const [viewProduct, setViewProduct] = React.useState<Product | null>(null)
  const [rejectProduct, setRejectProduct] = React.useState<Product | null>(null)
  const [rejectReason, setRejectReason] = React.useState("")
  const [actionLoading, setActionLoading] = React.useState(false)
  const [showPendingOnly, setShowPendingOnly] = React.useState(false)

  const fetchProducts = React.useCallback(() => {
    setLoading(true)
    if (showPendingOnly) {
      api.get<Product[]>("/admin/products/pending")
        .then(setProducts)
        .catch((err) => {
          toast.add({ title: "Failed to load products", description: getApiError(err), type: "error" })
        })
        .finally(() => setLoading(false))
    } else {
      api.get<Product[]>("/products")
        .then(setProducts)
        .catch((err) => {
          toast.add({ title: "Failed to load products", description: getApiError(err), type: "error" })
        })
        .finally(() => setLoading(false))
    }
  }, [showPendingOnly])

  React.useEffect(() => { fetchProducts() }, [fetchProducts])

  const handleSearch = () => {
    setSearch(searchInput)
  }

  const handleApprove = async (product: Product) => {
    setActionLoading(true)
    try {
      await api.post(`/admin/products/${product.id}/approve`)
      toast.add({ title: "Product approved!", description: `${product.name} is now live.`, type: "success" })
      fetchProducts()
      setViewProduct(null)
    } catch (err) {
      toast.add({ title: "Failed to approve product", description: getApiError(err), type: "error" })
    } finally {
      setActionLoading(false)
    }
  }

  const handleReject = async () => {
    if (!rejectProduct || !rejectReason.trim()) return
    setActionLoading(true)
    try {
      const formData = new FormData()
      formData.append("reason", rejectReason.trim())
      await api.post(`/admin/products/${rejectProduct.id}/reject`, formData)
      setRejectProduct(null)
      setRejectReason("")
      toast.add({ title: "Product rejected", description: `${rejectProduct.name} has been rejected.`, type: "success" })
      fetchProducts()
    } catch (err) {
      toast.add({ title: "Failed to reject product", description: getApiError(err), type: "error" })
    } finally {
      setActionLoading(false)
    }
  }

  const filteredProducts = React.useMemo(() => {
    if (!search) return products
    const term = search.toLowerCase()
    return products.filter(
      (p) => p.name.toLowerCase().includes(term) || (p.sku ?? "").toLowerCase().includes(term)
    )
  }, [products, search])

  if (loading) {
    return (
      <PageSkeleton>
        <Card><TableSkeleton rows={10} cols={6} /></Card>
      </PageSkeleton>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Products</h2>
          <p className="text-sm text-muted-foreground">Review and approve products ({products.length} total).</p>
        </div>
        <div className="flex gap-2">
          <Button variant={!showPendingOnly ? "default" : "outline"} size="sm" onClick={() => setShowPendingOnly(false)}>
            All Products
          </Button>
          <Button variant={showPendingOnly ? "default" : "outline"} size="sm" onClick={() => setShowPendingOnly(true)}>
            Pending Review
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Package className="size-4" /> {showPendingOnly ? "Pending Review" : "All Products"}
            </CardTitle>
            <div className="flex gap-2">
              <Input
                placeholder="Search products..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                className="w-64"
              />
              <Button variant="outline" size="sm" onClick={handleSearch}>
                <Search className="size-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProducts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">No products found.</TableCell>
                </TableRow>
              ) : (
                filteredProducts.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        {p.images.find((i) => i.is_primary)?.image_url && (
                          <img src={p.images.find((i) => i.is_primary)?.image_url} alt={p.name} className="size-8 rounded object-cover" />
                        )}
                        {p.name}
                      </div>
                    </TableCell>
                    <TableCell>{formatPrice(Number(p.price))}</TableCell>
                    <TableCell className="font-mono text-xs">{p.sku ?? "—"}</TableCell>
                    <TableCell>
                      <Badge variant={productStatusConfig[p.status]?.variant ?? "outline"}>
                        {productStatusConfig[p.status]?.label ?? p.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs">{new Date(p.created_at).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon-sm" title="View" onClick={() => setViewProduct(p)}>
                          <Eye className="size-4" />
                        </Button>
                        {p.status === "pending_review" && (canApprove || canReject) && (
                          <>
                            {canApprove && <Button variant="ghost" size="icon-sm" disabled={actionLoading} title="Approve" className="text-green-600" onClick={() => handleApprove(p)}>
                              <Check className="size-4" />
                            </Button>}
                            {canReject && <Button variant="ghost" size="icon-sm" disabled={actionLoading} title="Reject" className="text-red-500" onClick={() => setRejectProduct(p)}>
                              <X className="size-4" />
                            </Button>}
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* View Product Dialog */}
      <Dialog open={!!viewProduct} onOpenChange={(open) => !open && setViewProduct(null)}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{viewProduct?.name}</DialogTitle>
            <DialogDescription>Product details and review</DialogDescription>
          </DialogHeader>
          {viewProduct && (
            <div className="flex flex-col gap-4">
              {viewProduct.images.length > 0 && (
                <div className="flex gap-2 overflow-x-auto">
                  {viewProduct.images.map((img) => (
                    <img key={img.id} src={img.image_url} alt={img.alt_text ?? viewProduct.name} className="size-20 rounded-lg object-cover" />
                  ))}
                </div>
              )}
              <div className="grid gap-2 text-sm">
                <div><span className="text-muted-foreground">Price:</span> {formatPrice(Number(viewProduct.price))}</div>
                <div><span className="text-muted-foreground">SKU:</span> {viewProduct.sku ?? "—"}</div>
                <div><span className="text-muted-foreground">Status:</span> <Badge variant={productStatusConfig[viewProduct.status]?.variant ?? "outline"}>{viewProduct.status}</Badge></div>
                {viewProduct.rejection_reason && (
                  <div><span className="text-muted-foreground">Rejection Reason:</span> <span className="text-red-500">{viewProduct.rejection_reason}</span></div>
                )}
                <div><span className="text-muted-foreground">Description:</span></div>
                <div className="rounded-md border p-3 text-sm">{viewProduct.description ?? "No description"}</div>
              </div>
            </div>
          )}
          {viewProduct?.status === "pending_review" && (canApprove || canReject) && (
            <DialogFooter>
              {canReject && <Button variant="outline" disabled={actionLoading} onClick={() => setRejectProduct(viewProduct)}>
                <X className="size-4" /> Reject
              </Button>}
              {canApprove && <Button disabled={actionLoading} onClick={() => handleApprove(viewProduct)}>
                <Check className="size-4" /> Approve Product
              </Button>}
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>

      {/* Reject Product Dialog */}
      <Dialog open={!!rejectProduct} onOpenChange={(open) => !open && setRejectProduct(null)}>
        <DialogContent className="sm:max-w-[440px]">
          <DialogHeader>
            <DialogTitle>Reject Product?</DialogTitle>
            <DialogDescription>Reject <strong>{rejectProduct?.name}</strong>? Please provide a reason.</DialogDescription>
          </DialogHeader>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="rejectReason">Reason</FieldLabel>
              <Input id="rejectReason" value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} placeholder="e.g. Inappropriate content" />
            </Field>
          </FieldGroup>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>
            <Button variant="destructive" disabled={actionLoading || !rejectReason.trim()} onClick={handleReject}>
              <X className="size-4" /> Reject Product
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
