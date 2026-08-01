"use client"

import { useState } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import {
  Star,
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
import { products } from "@/lib/mock-data"
import { formatPrice } from "@/components/product-card"
import { cn } from "@/lib/utils"

export default function ProductDetailPage() {
  const params = useParams()
  const product = products.find((p) => p.id === params.id)
  const [qty, setQty] = useState(1)
  const [selectedImage, setSelectedImage] = useState(0)

  if (!product) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
        <p className="text-lg font-medium">Product not found</p>
        <Link href="/products" className={buttonVariants()}>
          Back to Products
        </Link>
      </div>
    )
  }

  const discount = product.originalPrice
    ? Math.round(
        ((product.originalPrice - product.price) / product.originalPrice) * 100
      )
    : 0

  const related = products
    .filter((p) => p.category === product.category && p.id !== product.id)
    .slice(0, 4)

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      {/* Breadcrumb */}
      <nav className="mb-6 flex items-center gap-1.5 text-sm text-muted-foreground">
        <Link href="/" className="hover:text-foreground">Home</Link>
        <ChevronRight className="size-3.5" />
        <Link href="/products" className="hover:text-foreground">Products</Link>
        <ChevronRight className="size-3.5" />
        <Link
          href={`/products?category=${product.category}`}
          className="hover:text-foreground"
        >
          {product.category}
        </Link>
        <ChevronRight className="size-3.5" />
        <span className="text-foreground">{product.name}</span>
      </nav>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Images */}
        <div className="flex flex-col gap-4">
          <div className="relative aspect-square overflow-hidden rounded-xl border bg-muted">
            <img
              src={product.images[selectedImage] || product.image}
              alt={product.name}
              className="h-full w-full object-cover"
            />
            {discount > 0 && (
              <Badge className="absolute left-3 top-3 bg-primary text-primary-foreground">
                -{discount}%
              </Badge>
            )}
          </div>
          <div className="flex gap-2">
            {product.images.map((img, i) => (
              <button
                key={i}
                onClick={() => setSelectedImage(i)}
                className={cn(
                  "relative size-20 overflow-hidden rounded-lg border-2 transition-colors",
                  selectedImage === i
                    ? "border-primary"
                    : "border-transparent hover:border-muted-foreground/30"
                )}
              >
                <img
                  src={img}
                  alt={`${product.name} ${i + 1}`}
                  className="h-full w-full object-cover"
                />
              </button>
            ))}
          </div>
        </div>

        {/* Info */}
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <Badge variant="secondary">{product.brand}</Badge>
              {product.inStock ? (
                <Badge className="bg-green-500/10 text-green-600">In Stock</Badge>
              ) : (
                <Badge variant="destructive">Out of Stock</Badge>
              )}
            </div>
            <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
              {product.name}
            </h1>
            {/* Rating */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={cn(
                      "size-4",
                      star <= Math.round(product.rating)
                        ? "fill-primary text-primary"
                        : "text-muted-foreground/30"
                    )}
                  />
                ))}
              </div>
              <span className="text-sm font-medium">{product.rating}</span>
              <span className="text-sm text-muted-foreground">
                ({product.reviewCount} reviews)
              </span>
            </div>
          </div>

          <Separator />

          {/* Price */}
          <div className="flex items-center gap-3">
            <span className="text-3xl font-bold text-primary">
              {formatPrice(product.price)}
            </span>
            {product.originalPrice && (
              <span className="text-lg text-muted-foreground line-through">
                {formatPrice(product.originalPrice)}
              </span>
            )}
            {discount > 0 && (
              <Badge className="bg-primary/10 text-primary">
                Save {discount}%
              </Badge>
            )}
          </div>

          {/* Description */}
          <p className="text-sm text-muted-foreground">
            {product.description}
          </p>

          {/* Seller */}
          <div className="flex items-center gap-3 rounded-lg border p-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Store className="size-5" />
            </div>
            <div>
              <p className="text-sm font-medium">{product.seller}</p>
              <p className="text-xs text-muted-foreground">Verified Seller</p>
            </div>
          </div>

          {/* Quantity */}
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium">Quantity:</span>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="icon-sm"
                onClick={() => setQty(Math.max(1, qty - 1))}
              >
                <Minus className="size-4" />
              </Button>
              <span className="w-12 text-center text-sm font-medium">{qty}</span>
              <Button
                variant="outline"
                size="icon-sm"
                onClick={() => setQty(qty + 1)}
              >
                <Plus className="size-4" />
              </Button>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button size="lg" className="flex-1 gap-2">
              <ShoppingCart className="size-5" />
              Add to Cart
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
            <TabsTrigger value="reviews">Reviews ({product.reviewCount})</TabsTrigger>
          </TabsList>
          <TabsContent value="description" className="mt-4">
            <div className="prose max-w-none text-sm text-muted-foreground">
              <p>{product.description}</p>
              <p className="mt-3">
                This product is sold by {product.seller}, a verified seller on
                XerinMarket. All purchases are protected by our secure payment
                escrow system.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {product.tags.map((tag) => (
                  <Badge key={tag} variant="secondary">
                    #{tag}
                  </Badge>
                ))}
              </div>
            </div>
          </TabsContent>
          <TabsContent value="specs" className="mt-4">
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                { label: "Brand", value: product.brand },
                { label: "Category", value: product.category },
                { label: "Seller", value: product.seller },
                { label: "Availability", value: product.inStock ? "In Stock" : "Out of Stock" },
                { label: "Tags", value: product.tags.join(", ") },
              ].map((spec) => (
                <div
                  key={spec.label}
                  className="flex justify-between border-b py-2 text-sm"
                >
                  <span className="text-muted-foreground">{spec.label}</span>
                  <span className="font-medium">{spec.value}</span>
                </div>
              ))}
            </div>
          </TabsContent>
          <TabsContent value="reviews" className="mt-4">
            <div className="flex flex-col gap-4">
              {[
                { name: "John D.", rating: 5, comment: "Excellent product, fast delivery!" },
                { name: "Sarah M.", rating: 4, comment: "Good quality, would recommend." },
                { name: "Ali K.", rating: 5, comment: "Best purchase I've made this year." },
              ].map((review, i) => (
                <div key={i} className="rounded-lg border p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">{review.name}</p>
                    <div className="flex items-center gap-0.5">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={cn(
                            "size-3.5",
                            star <= review.rating
                              ? "fill-primary text-primary"
                              : "text-muted-foreground/30"
                          )}
                        />
                      ))}
                    </div>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {review.comment}
                  </p>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Related */}
      {related.length > 0 && (
        <div className="mt-10">
          <h2 className="mb-6 text-2xl font-bold tracking-tight">
            Related Products
          </h2>
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
