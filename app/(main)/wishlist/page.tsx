"use client"

import Link from "next/link"
import { useState } from "react"
import { Heart, ShoppingBag, Loader2, LayoutGrid, List, Trash2, ShoppingCart } from "lucide-react"
import { Button, buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useWishlist } from "@/lib/wishlist-context"
import { ProductCard } from "@/components/product-card"
import { formatPrice } from "@/lib/store-types"
import { Badge } from "@/components/ui/badge"
import { useCart } from "@/lib/cart-context"
import { toast } from "@/components/ui/toast"

export default function WishlistPage() {
  const { items, loading, count, removeItem } = useWishlist()
  const { addToCart } = useCart()
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [actionId, setActionId] = useState<string | null>(null)

  const handleAddToCart = async (product: any) => {
    setActionId(product.id)
    try {
      await addToCart(product, 1)
      toast.add({ title: "Added to cart", description: product.name, type: "success" })
    } catch (err) {
      toast.add({ title: "Failed to add", type: "error" })
    } finally {
      setActionId(null)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center gap-4">
        <Loader2 className="size-10 animate-spin text-primary" />
        <p className="text-muted-foreground font-medium">Loading your wishlist...</p>
      </div>
    )
  }

  if (count === 0) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 md:py-24">
        <div className="flex flex-col items-center gap-6 text-center">
          <div className="flex size-20 items-center justify-center rounded-3xl bg-muted">
            <Heart className="size-10 text-muted-foreground" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold tracking-tight">Your wishlist is empty</h1>
            <p className="text-muted-foreground">
              Save items you love by tapping the heart icon on any product. They&apos;ll appear here for easy access.
            </p>
          </div>
          <Link href="/products" className={cn(buttonVariants({ size: "lg" }), "gap-2")}>
            <ShoppingBag className="size-4" />
            Browse Products
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 md:py-12">
      <div className="mb-8 flex flex-col justify-between gap-4 border-b pb-6 sm:flex-row sm:items-end">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">My Wishlist</h1>
          <p className="text-muted-foreground">
            You have {count} {count === 1 ? "item" : "items"} saved.
          </p>
        </div>
        
        <div className="flex items-center gap-2 rounded-lg border bg-muted/50 p-1">
          <Button
            variant={viewMode === "grid" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setViewMode("grid")}
            className="h-8 w-8 p-0"
          >
            <LayoutGrid className="size-4" />
          </Button>
          <Button
            variant={viewMode === "list" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setViewMode("list")}
            className="h-8 w-8 p-0"
          >
            <List className="size-4" />
          </Button>
        </div>
      </div>

      {viewMode === "grid" ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {items.map((item) => (
            <ProductCard key={item.id} product={item.product} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {items.map((item) => (
            <div
              key={item.id}
              className="group flex flex-col gap-4 rounded-xl border bg-card p-4 transition-all hover:shadow-md sm:flex-row sm:items-center"
            >
              {/* Product Image */}
              <div className="relative size-24 shrink-0 overflow-hidden rounded-lg bg-muted sm:size-32">
                <img
                  src={item.product.images?.[0]?.image_url}
                  alt={item.product.name}
                  className="size-full object-cover transition-transform group-hover:scale-105"
                />
              </div>

              {/* Product Info */}
              <div className="flex flex-1 flex-col gap-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <Link 
                    href={`/products/${item.product.id}`}
                    className="truncate text-lg font-bold hover:underline"
                  >
                    {item.product.name}
                  </Link>
                  {item.product.is_active ? (
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-[10px]">
                      In Stock
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 text-[10px]">
                      Out of Stock
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground line-clamp-1">
                  SKU: {item.product.sku}
                </p>
                <div className="mt-1 flex items-baseline gap-2">
                  <span className="text-xl font-bold text-primary">
                    {formatPrice(item.product.price)}
                  </span>
                  {item.product.sale_price && (
                    <span className="text-sm text-muted-foreground line-through">
                      {formatPrice(item.product.sale_price)}
                    </span>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 pt-2 sm:pt-0">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 gap-2 sm:flex-none"
                  disabled={!item.product.is_active || actionId === item.product.id}
                  onClick={() => handleAddToCart(item.product)}
                >
                  {actionId === item.product.id ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <ShoppingCart className="size-4" />
                  )}
                  Add to Cart
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-muted-foreground hover:text-red-500 hover:bg-red-50"
                  onClick={() => removeItem(item.product_id)}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

