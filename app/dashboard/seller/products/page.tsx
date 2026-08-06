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
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog"
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldDescription,
} from "@/components/ui/field"
import { toast } from "@/components/ui/toast"
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  Package,
  Eye,
  ArrowUpDown,
  ImagePlus,
  X,
  Loader2,
  Star,
  Upload,
} from "lucide-react"
import { api, type ApiError } from "@/lib/api"
import { StatsCardSkeleton, TableSkeleton, PageSkeleton } from "@/components/skeletons"

type ProductStatus = "draft" | "pending_review" | "approved" | "rejected" | "suspended"

type ProductImage = {
  id: string
  image_url: string
  is_primary: boolean
  alt_text: string | null
}

type Category = {
  id: string
  name: string
  slug: string
}

type Product = {
  id: string
  seller_id: string
  category_id: string
  brand_id: string | null
  sku: string
  name: string
  slug: string
  description: string | null
  price: number
  sale_price: number | null
  currency: string
  weight: number | null
  status: ProductStatus
  rejection_reason: string | null
  is_active: boolean
  submitted_at: string | null
  approved_at: string | null
  images: ProductImage[]
  created_at: string
}

const statusConfig: Record<ProductStatus, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  draft: { label: "Draft", variant: "outline" },
  pending_review: { label: "Pending Review", variant: "secondary" },
  approved: { label: "Approved", variant: "default" },
  rejected: { label: "Rejected", variant: "destructive" },
  suspended: { label: "Suspended", variant: "outline" },
}

function formatPrice(price: number): string {
  return `TSh ${Number(price).toLocaleString()}`
}

function getApiError(err: unknown): string {
  const e = err as ApiError
  return e?.detail || "Something went wrong. Please try again."
}

function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")
}

export default function SellerProductsPage() {
  const [products, setProducts] = React.useState<Product[]>([])
  const [categories, setCategories] = React.useState<Category[]>([])
  const [loading, setLoading] = React.useState(true)
  const [search, setSearch] = React.useState("")
  const [statusFilter, setStatusFilter] = React.useState<ProductStatus | "all">("all")
  const [createOpen, setCreateOpen] = React.useState(false)
  const [editProduct, setEditProduct] = React.useState<Product | null>(null)
  const [deleteProduct, setDeleteProduct] = React.useState<Product | null>(null)
  const [sortBy, setSortBy] = React.useState<"name" | "price" | "created">("created")
  const [sortDir, setSortDir] = React.useState<"asc" | "desc">("desc")
  const [actionLoading, setActionLoading] = React.useState(false)

  React.useEffect(() => {
    Promise.all([
      api.get<Product[]>("/products/my-products"),
      api.get<Category[]>("/products/categories"),
    ])
      .then(([prods, cats]) => {
        setProducts(prods)
        setCategories(cats)
      })
      .catch((err) => {
        toast.add({
          title: "Failed to load products",
          description: getApiError(err),
          type: "error",
        })
      })
      .finally(() => setLoading(false))
  }, [])

  const filtered = React.useMemo(() => {
    let result = products
    if (search) {
      const term = search.toLowerCase()
      result = result.filter(
        (p) => p.name.toLowerCase().includes(term) || p.sku.toLowerCase().includes(term)
      )
    }
    if (statusFilter !== "all") {
      result = result.filter((p) => p.status === statusFilter)
    }
    result = [...result].sort((a, b) => {
      let cmp = 0
      if (sortBy === "name") cmp = a.name.localeCompare(b.name)
      else if (sortBy === "price") cmp = a.price - b.price
      else cmp = a.created_at.localeCompare(b.created_at)
      return sortDir === "asc" ? cmp : -cmp
    })
    return result
  }, [products, search, statusFilter, sortBy, sortDir])

  const toggleSort = (field: typeof sortBy) => {
    if (sortBy === field) {
      setSortDir(sortDir === "asc" ? "desc" : "asc")
    } else {
      setSortBy(field)
      setSortDir("desc")
    }
  }

  const handleCreate = async (data: {
    name: string
    sku: string
    price: number
    sale_price: number | null
    category_id: string
    description: string
    images: File[]
  }) => {
    setActionLoading(true)
    try {
      const newProduct = await api.post<Product>("/products", {
        name: data.name,
        sku: data.sku.toUpperCase(),
        slug: slugify(data.name),
        price: data.price,
        sale_price: data.sale_price,
        category_id: data.category_id,
        description: data.description || undefined,
        currency: "TZS",
      })

      if (data.images.length > 0) {
        const formData = new FormData()
        data.images.forEach((file) => formData.append("files", file))
        formData.append("make_first_primary", "true")
        try {
          const uploaded = await api.upload<ProductImage[]>(`/products/${newProduct.id}/images/upload`, formData)
          newProduct.images = uploaded
        } catch (uploadErr) {
          toast.add({
            title: "Images failed to upload",
            description: getApiError(uploadErr),
            type: "error",
          })
        }
      }

      setProducts((prev) => [newProduct, ...prev])
      setCreateOpen(false)
      toast.add({
        title: "Product created!",
        description: `${data.name} has been added as a draft. Submit it for review when ready.`,
        type: "success",
      })
    } catch (err) {
      toast.add({
        title: "Failed to create product",
        description: getApiError(err),
        type: "error",
      })
    } finally {
      setActionLoading(false)
    }
  }

  const handleUpdate = async (id: string, data: {
    name: string
    sku: string
    price: number
    sale_price: number | null
    category_id: string
    description: string
    images: File[]
  }) => {
    setActionLoading(true)
    try {
      const updated = await api.patch<Product>(`/products/${id}`, {
        name: data.name,
        sku: data.sku.toUpperCase(),
        slug: slugify(data.name),
        price: data.price,
        sale_price: data.sale_price,
        category_id: data.category_id,
        description: data.description || undefined,
      })

      if (data.images.length > 0) {
        const formData = new FormData()
        data.images.forEach((file) => formData.append("files", file))
        formData.append("make_first_primary", "false")
        try {
          const uploaded = await api.upload<ProductImage[]>(`/products/${id}/images/upload`, formData)
          updated.images = [...(updated.images || []), ...uploaded]
        } catch (uploadErr) {
          toast.add({
            title: "Images failed to upload",
            description: getApiError(uploadErr),
            type: "error",
          })
        }
      }

      setProducts((prev) => prev.map((p) => (p.id === id ? updated : p)))
      setEditProduct(null)
      toast.add({
        title: "Product updated!",
        description: `${data.name} has been updated.`,
        type: "success",
      })
    } catch (err) {
      toast.add({
        title: "Failed to update product",
        description: getApiError(err),
        type: "error",
      })
    } finally {
      setActionLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    const product = products.find((p) => p.id === id)
    try {
      await api.delete(`/products/${id}`)
      setProducts((prev) => prev.filter((p) => p.id !== id))
      setDeleteProduct(null)
      toast.add({
        title: "Product deleted!",
        description: `${product?.name} has been deleted.`,
        type: "success",
      })
    } catch (err) {
      toast.add({
        title: "Failed to delete product",
        description: getApiError(err),
        type: "error",
      })
    } finally {
      setActionLoading(false)
    }
  }

  const handleSubmitForReview = async (id: string) => {
    const product = products.find((p) => p.id === id)
    try {
      const updated = await api.patch<Product>(`/products/${id}`, { is_active: true })
      setProducts((prev) => prev.map((p) => (p.id === id ? updated : p)))
      toast.add({
        title: "Submitted for review!",
        description: `${product?.name} is now pending admin approval.`,
        type: "info",
      })
    } catch (err) {
      toast.add({
        title: "Failed to submit",
        description: getApiError(err),
        type: "error",
      })
    } finally {
      setActionLoading(false)
    }
  }

  if (loading) {
    return (
      <PageSkeleton>
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => <StatsCardSkeleton key={i} />)}
        </div>
        <Card>
          <TableSkeleton rows={6} cols={7} />
        </Card>
      </PageSkeleton>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Products</h2>
          <p className="text-sm text-muted-foreground">
            Manage your product catalog, pricing, and inventory.
          </p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger
            render={<Button><Plus className="size-4" /> Add Product</Button>}
          />
          <DialogContent className="sm:max-w-[560px]">
            <ProductForm categories={categories} onSubmit={handleCreate} actionLoading={actionLoading} />
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Products</CardTitle>
            <Package className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{products.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Approved</CardTitle>
            <Badge variant="default" className="text-xs">Live</Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{products.filter((p) => p.status === "approved").length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending Review</CardTitle>
            <Badge variant="secondary" className="text-xs">Pending</Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{products.filter((p) => p.status === "pending_review").length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Rejected</CardTitle>
            <Badge variant="destructive" className="text-xs">Alert</Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{products.filter((p) => p.status === "rejected").length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters + Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-1 gap-2">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search by name or SKU..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as ProductStatus | "all")}
                className="h-9 rounded-md border border-input bg-background px-3 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="all">All Status</option>
                <option value="draft">Draft</option>
                <option value="pending_review">Pending Review</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="suspended">Suspended</option>
              </select>
            </div>
            <div className="text-sm text-muted-foreground">
              {filtered.length} of {products.length} products
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  <button className="flex items-center gap-1 hover:text-foreground" onClick={() => toggleSort("name")}>
                    Product
                    <ArrowUpDown className="size-3" />
                  </button>
                </TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>
                  <button className="flex items-center gap-1 hover:text-foreground" onClick={() => toggleSort("price")}>
                    Price
                    <ArrowUpDown className="size-3" />
                  </button>
                </TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                    No products found. Try adjusting your filters.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-muted">
                          {product.images?.find((img) => img.is_primary)?.image_url ? (
                            <img src={product.images.find((img) => img.is_primary)!.image_url} alt={product.name} className="size-10 rounded-md object-cover" />
                          ) : (
                            <Package className="size-5 text-muted-foreground" />
                          )}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-medium">{product.name}</span>
                          <span className="text-xs text-muted-foreground">{new Date(product.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-xs">{product.sku}</TableCell>
                    <TableCell>{categories.find((c) => c.id === product.category_id)?.name ?? "—"}</TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">{formatPrice(product.price)}</span>
                        {product.sale_price && (
                          <span className="text-xs text-green-600">{formatPrice(product.sale_price)} sale</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusConfig[product.status].variant}>
                        {statusConfig[product.status].label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        {product.status === "draft" || product.status === "rejected" ? (
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            disabled={actionLoading}
                            onClick={() => handleSubmitForReview(product.id)}
                            title="Submit for review"
                          >
                            <Eye className="size-4" />
                          </Button>
                        ) : null}
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          disabled={actionLoading}
                          onClick={() => setEditProduct(product)}
                          title="Edit"
                        >
                          <Pencil className="size-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          disabled={actionLoading}
                          onClick={() => setDeleteProduct(product)}
                          title="Delete"
                          className="text-red-500 hover:text-red-600"
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={!!editProduct} onOpenChange={(open) => !open && setEditProduct(null)}>
        <DialogContent className="sm:max-w-[560px]">
          {editProduct && (
            <ProductForm
              product={editProduct}
              categories={categories}
              onSubmit={(data) => handleUpdate(editProduct.id, data)}
              actionLoading={actionLoading}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={!!deleteProduct} onOpenChange={(open) => !open && setDeleteProduct(null)}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle>Delete Product?</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <strong>{deleteProduct?.name}</strong>? This action will archive the product and it will no longer be visible to customers.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>
              Cancel
            </DialogClose>
            <Button
              variant="destructive"
              disabled={actionLoading}
              onClick={() => deleteProduct && handleDelete(deleteProduct.id)}
            >
              <Trash2 className="size-4" />
              {actionLoading ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function generateSku(name: string): string {
  const words = name.trim().split(/\s+/).slice(0, 3)
  const prefix = words.map((w) => w.replace(/[^a-zA-Z0-9]/g, "").substring(0, 3).toUpperCase()).join("-")
  const suffix = Math.random().toString(36).substring(2, 6).toUpperCase()
  return `${prefix}-${suffix}`
}

function ProductForm({
  product,
  categories,
  onSubmit,
  actionLoading,
}: {
  product?: Product
  categories: Category[]
  onSubmit: (data: {
    name: string
    sku: string
    price: number
    sale_price: number | null
    category_id: string
    description: string
    images: File[]
  }) => void
  actionLoading?: boolean
}) {
  const [name, setName] = React.useState(product?.name ?? "")
  const [sku, setSku] = React.useState(product?.sku ?? "")
  const [skuManual, setSkuManual] = React.useState(!!product?.sku)
  const [price, setPrice] = React.useState(product?.price?.toString() ?? "")
  const [salePrice, setSalePrice] = React.useState(product?.sale_price?.toString() ?? "")
  const [categoryId, setCategoryId] = React.useState(product?.category_id ?? categories[0]?.id ?? "")
  const [description, setDescription] = React.useState(product?.description ?? "")
  const [images, setImages] = React.useState<File[]>([])
  const [dragOver, setDragOver] = React.useState(false)
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  React.useEffect(() => {
    if (!skuManual && name.trim()) {
      setSku(generateSku(name))
    }
  }, [name, skuManual])

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setName(e.target.value)
    if (skuManual) setSkuManual(false)
  }

  const handleSkuChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSku(e.target.value)
    setSkuManual(true)
  }

  const handleFiles = (files: FileList | null) => {
    if (!files) return
    const valid = Array.from(files).filter((f) => {
      const type = f.type.toLowerCase()
      return (type === "image/jpeg" || type === "image/png" || type === "image/webp") && f.size <= 5 * 1024 * 1024
    })
    setImages((prev) => [...prev, ...valid].slice(0, 10))
  }

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !sku.trim() || !price || !categoryId) return
    onSubmit({
      name: name.trim(),
      sku: sku.trim().toUpperCase(),
      price: parseFloat(price),
      sale_price: salePrice ? parseFloat(salePrice) : null,
      category_id: categoryId,
      description,
      images,
    })
  }

  return (
    <form onSubmit={handleSubmit}>
      <DialogHeader>
        <DialogTitle>{product ? "Edit Product" : "Add New Product"}</DialogTitle>
        <DialogDescription>
          {product
            ? "Update product details. The product will need to be resubmitted for review."
            : "Fill in the details below to create a new product."}
        </DialogDescription>
      </DialogHeader>

      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="name">Product Name</FieldLabel>
          <Input
            id="name"
            value={name}
            onChange={handleNameChange}
            placeholder="e.g. Wireless Headphones"
            required
            disabled={actionLoading}
          />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field>
            <FieldLabel htmlFor="sku">
              SKU
              <span className="ml-2 text-xs font-normal text-muted-foreground">Auto-generated</span>
            </FieldLabel>
            <Input
              id="sku"
              value={sku}
              onChange={handleSkuChange}
              placeholder="Auto-generated from name"
              required
              className="font-mono"
              disabled={actionLoading}
            />
            {skuManual && (
              <FieldDescription className="text-amber-600">Manually edited</FieldDescription>
            )}
          </Field>
          <Field>
            <FieldLabel htmlFor="category">Category</FieldLabel>
            <select
              id="category"
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              disabled={actionLoading}
              className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
            >
              <option value="" disabled>Select category...</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field>
            <FieldLabel htmlFor="price">Price (TSh)</FieldLabel>
            <Input
              id="price"
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="85000"
              required
              min="0"
              disabled={actionLoading}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="salePrice">Sale Price</FieldLabel>
            <Input
              id="salePrice"
              type="number"
              value={salePrice}
              onChange={(e) => setSalePrice(e.target.value)}
              placeholder="75000"
              min="0"
              disabled={actionLoading}
            />
            <FieldDescription>Optional</FieldDescription>
          </Field>
        </div>

        <Field>
          <FieldLabel htmlFor="description">Description</FieldLabel>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Product description..."
            rows={3}
            disabled={actionLoading}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
          />
        </Field>

        {/* Image Upload */}
        <Field>
          <FieldLabel>Product Images</FieldLabel>
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault()
              setDragOver(false)
              handleFiles(e.dataTransfer.files)
            }}
            onClick={() => fileInputRef.current?.click()}
            className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-6 transition-colors ${
              dragOver ? "border-primary bg-primary/5" : "border-input hover:border-primary/50 hover:bg-muted/30"
            }`}
          >
            <div className="flex size-12 items-center justify-center rounded-full bg-muted">
              <ImagePlus className="size-6 text-muted-foreground" />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium">Click to upload or drag and drop</p>
              <p className="text-xs text-muted-foreground">PNG, JPG, WEBP up to 5MB (max 10 images)</p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              multiple
              className="hidden"
              onChange={(e) => handleFiles(e.target.files)}
            />
          </div>

          {images.length > 0 && (
            <div className="mt-3 grid grid-cols-3 gap-3 sm:grid-cols-4">
              {images.map((file, index) => (
                <div key={index} className="group relative aspect-square overflow-hidden rounded-lg border bg-muted">
                  <img
                    src={URL.createObjectURL(file)}
                    alt={`Preview ${index + 1}`}
                    className="size-full object-cover"
                  />
                  {index === 0 && (
                    <div className="absolute left-1 top-1 flex items-center gap-1 rounded bg-primary px-1.5 py-0.5 text-xs font-medium text-primary-foreground">
                      <Star className="size-2.5 fill-current" /> Primary
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); removeImage(index) }}
                    className="absolute right-1 top-1 flex size-6 items-center justify-center rounded-full bg-black/60 text-white opacity-0 transition-opacity group-hover:opacity-100"
                  >
                    <X className="size-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
          {images.length > 0 && (
            <FieldDescription>{images.length} image{images.length > 1 ? "s" : ""} ready — first image will be primary</FieldDescription>
          )}
        </Field>
      </FieldGroup>

      <DialogFooter>
        <DialogClose render={<Button variant="outline" disabled={actionLoading} />}>
          Cancel
        </DialogClose>
        <Button type="submit" disabled={actionLoading}>
          {actionLoading ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
          {product ? "Save Changes" : "Create Product"}
        </Button>
      </DialogFooter>
    </form>
  )
}
