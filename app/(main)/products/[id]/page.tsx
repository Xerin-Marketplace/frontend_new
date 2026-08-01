"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import {
  ShoppingCart,
  Heart,
  Share2,
  Truck,
  ShieldCheck,
  RotateCcw,
  Store,
  Minus,
  Plus,
  ChevronRight,
} from "lucide-react"
import { Button, buttonVariants } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { ProductCard } from "@/components/product-card"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import { api, type ApiError } from "@/lib/api"
import { toast } from "@/components/ui/toast"
import { type ApiProduct, type ApiCategory, formatPrice, getDisplayPrice } from "@/lib/store-types"

function getApiError(err: unknown): string {
  const e = err as ApiError
  return e?.detail || "Something went wrong. Please try again."
}

export default function ProductDetailPage() {
  const params = useParams()
  const [product, setProduct] = useState<ApiProduct | null>(null)
  const [category, setCategory] = useState<ApiCategory | null>(null)
  const [related, setRelated] = useState<ApiProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [qty, setQty] = useState(1)
  const [selectedImage, setSelectedImage] = useState(0)
  const [adding, setAdding] = useState(false)

  useEffect(() => {
    setLoading(true)
    setNotFound(false)
    api.get<ApiProduct>(`/products/${params.id}`)
      .then(async (data) => {
        setProduct(data)
        setSelectedImage(0)
        if (data.images.length === 0 && data.images[0]) {
          setSelectedImage(0)
        }
        const primaryIdx = data.images.findIndex((img) => img.is_primary)
        setSelectedImage(primaryIdx >= 0 ? primaryIdx : 0)

        if (data.category_id) {
          api.get<ApiCategory>(`/products/categories/${data.category_id}`)
            .then(setCategory)
            .catch(() => {})

          api.get<ApiProduct[]>(`/products?category_id=${data.category_id}&limit=5`)
            .then((relatedProducts) => {
              setRelated(relatedProducts.filter((p) => p.id !== data.id).slice(0, 4))
            })
            .catch(() => {})
        }
      })
      .catch((err) => {
        const e = err as ApiError
        if (e?.status === 404) setNotFound(true)
        else toast.add({ title: "Failed to load product", description: getApiError(err), type: "error" })
      })
      .finally(() => setLoading(false))
  }, [params.id])

  const handleAddToCart = async () => {
    if (!product) return
    setAdding(true)
    try {
      await api.post("/cart/items", {
        product_id: product.id,
        quantity: qty,
      })
      toast.add({ title: "Added to cart!", description: `${qty} x ${product.name}`, type: "success" })
    } catch (err) {
      toast.add({ title: "Failed to add", description: getApiError(err), type: "error" })
    } finally {
      setAdding(false)
    }
  }

  if (notFound) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
        <p className="text-lg font-medium">Product not found</p>
        <Link href="/products" className={buttonVariants()}>Back to Products</Link>
      </div>
    )
  }

  if (loading || !product) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-6">
        <Skeleton className="mb-6 h-5 w-80" />
        <div className="grid gap-8 lg:grid-cols-2">
          <div className="flex flex-col gap-4">
            <Skeleton className="aspect-square w-full rounded-xl" />
            <div className="flex gap-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="size-20 rounded-lg" />
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-4">
            <Skeleton className="h-6 w-20" />
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-px w-full" />
            <Skeleton className="h-10 w-48" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        </div>
      </div>
    )
  }

  const { price, originalPrice, discount } = getDisplayPrice(product)
  const images = product.images.length > 0 ? product.images : []

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      {/* Breadcrumb */}
      <nav className="mb-6 flex items-center gap-1.5 text-sm text-muted-foreground">
        <Link href="/" className="hover:text-foreground">Home</Link>
        <ChevronRight className="size-3.5" />
        <Link href="/products" className="hover:text-foreground">Products</Link>
        {category && (
          <>
            <ChevronRight className="size-3.5" />
            <Link href={`/products?category=${category.id}`} className="hover:text-foreground">
              {category.name}
            </Link>
          </>
        )}
        <ChevronRight className="size-3.5" />
        <span className="text-foreground">{product.name}</span>
      </nav>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Images */}
        <div className="flex flex-col gap-4">
          <div className="relative aspect-square overflow-hidden rounded-xl border bg-muted">
            {images[selectedImage] ? (
              <img
                src={images[selectedImage].image_url}
                alt={product.name}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                <ShoppingCart className="size-12" />
              </div>
            )}
            {discount && discount > 0 && (
              <Badge className="absolute left-3 top-3 bg-primary text-primary-foreground">
                -{discount}%
              </Badge>
            )}
          </div>
          {images.length > 1 && (
            <div className="flex gap-2">
              {images.map((img, i) => (
                <button
                  key={img.id}
                  onClick={() => setSelectedImage(i)}
                  className={cn(
                    "relative size-20 overflow-hidden rounded-lg border-2 transition-colors",
                    selectedImage === i ? "border-primary" : "border-transparent hover:border-muted-foreground/30"
                  )}
                >
                  <img src={img.image_url} alt={`${product.name} ${i + 1}`} className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              {product.is_active ? (
                <Badge className="bg-green-500/10 text-green-600">In Stock</Badge>
              ) : (
                <Badge variant="destructive">Out of Stock</Badge>
              )}
              <Badge variant="secondary">{product.currency}</Badge>
            </div>
            <h1 className="text-2xl font-bold tracking-tight md:text-3xl">{product.name}</h1>
          </div>

          <Separator />

          {/* Price */}
          <div className="flex items-center gap-3">
            <span className="text-3xl font-bold text-primary">{formatPrice(price)}</span>
            {originalPrice && (
              <span className="text-lg text-muted-foreground line-through">{formatPrice(originalPrice)}</span>
            )}
            {discount && discount > 0 && (
              <Badge className="bg-primary/10 text-primary">Save {discount}%</Badge>
            )}
          </div>

          {/* Description */}
          {product.description && (
            <p className="text-sm text-muted-foreground">{product.description}</p>
          )}

          {/* Seller */}
          <div className="flex items-center gap-3 rounded-lg border p-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Store className="size-5" />
            </div>
            <div>
              <p className="text-sm font-medium">Seller ID: {product.seller_id.slice(0, 8)}</p>
              <p className="text-xs text-muted-foreground">Verified Seller</p>
            </div>
          </div>

          {/* Quantity */}
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium">Quantity:</span>
            <div className="flex items-center gap-1">
              <Button variant="outline" size="icon-sm" onClick={() => setQty(Math.max(1, qty - 1))}>
                <Minus className="size-4" />
              </Button>
              <span className="w-12 text-center text-sm font-medium">{qty}</span>
              <Button variant="outline" size="icon-sm" onClick={() => setQty(qty + 1)}>
                <Plus className="size-4" />
              </Button>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button size="lg" className="flex-1 gap-2" onClick={handleAddToCart} disabled={adding || !product.is_active}>
              <ShoppingCart className="size-5" />
              {adding ? "Adding..." : "Add to Cart"}
            </Button>
            <Button variant="outline" size="lg" className="gap-2">
              <Heart className="size-5" />
              Wishlist
            </Button>
            <Button variant="ghost" size="icon-lg">
              <Share2 className="size-5" />
            </Button>
          </div>

          {/* Trust */}
          <div className="grid grid-cols-3 gap-3 rounded-xl border p-4">
            <div className="flex flex-col items-center gap-1.5 text-center">
              <Truck className="size-5 text-primary" />
              <p className="text-xs font-medium">Fast Delivery</p>
            </div>
            <div className="flex flex-col items-center gap-1.5 text-center">
              <ShieldCheck className="size-5 text-primary" />
              <p className="text-xs font-medium">Secure Payment</p>
            </div>
            <div className="flex flex-col items-center gap-1.5 text-center">
              <RotateCcw className="size-5 text-primary" />
              <p className="text-xs font-medium">7-Day Returns</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mt-10">
        <Tabs defaultValue="description">
          <TabsList>
            <TabsTrigger value="description">Description</TabsTrigger>
            <TabsTrigger value="specs">Specifications</TabsTrigger>
          </TabsList>
          <TabsContent value="description" className="mt-4">
            <div className="prose max-w-none text-sm text-muted-foreground">
              <p>{product.description || "No description available."}</p>
              <p className="mt-3">
                This product is sold by a verified seller on XerinMarket. All purchases
                are protected by our secure payment escrow system.
              </p>
            </div>
          </TabsContent>
          <TabsContent value="specs" className="mt-4">
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                { label: "SKU", value: product.sku },
                { label: "Category", value: category?.name ?? "N/A" },
                { label: "Currency", value: product.currency },
                { label: "Availability", value: product.is_active ? "In Stock" : "Out of Stock" },
                { label: "Weight", value: product.weight ? `${product.weight} kg` : "N/A" },
                { label: "Status", value: product.status },
              ].map((spec) => (
                <div key={spec.label} className="flex justify-between border-b py-2 text-sm">
                  <span className="text-muted-foreground">{spec.label}</span>
                  <span className="font-medium">{spec.value}</span>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Related */}
      {related.length > 0 && (
        <div className="mt-10">
          <h2 className="mb-6 text-2xl font-bold tracking-tight">Related Products</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:gap-4 lg:grid-cols-4">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
