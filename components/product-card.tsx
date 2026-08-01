"use client"

import Link from "next/link"
import { useState } from "react"
import { Heart, ShoppingCart } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { type ApiProduct, formatPrice, getPrimaryImage, getDisplayPrice } from "@/lib/store-types"
import { toast } from "@/components/ui/toast"
import { api, type ApiError } from "@/lib/api"

function getApiError(err: unknown): string {
  const e = err as ApiError
  return e?.detail || "Something went wrong. Please try again."
}

export function ProductCard({ product }: { product: ApiProduct }) {
  const [adding, setAdding] = useState(false)
  const image = getPrimaryImage(product)
  const { price, originalPrice, discount } = getDisplayPrice(product)

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setAdding(true)
    try {
      await api.post("/cart/items", {
        product_id: product.id,
        quantity: 1,
      })
      toast.add({ title: "Added to cart!", description: product.name, type: "success" })
    } catch (err) {
      toast.add({ title: "Failed to add", description: getApiError(err), type: "error" })
    } finally {
      setAdding(false)
    }
  }

  return (
    <Link href={`/products/${product.id}`} className="group block">
      <Card className="h-full p-0 transition-all hover:shadow-md">
        {/* Image */}
        <div className="relative aspect-square overflow-hidden bg-muted">
          {image ? (
            <img
              src={image}
              alt={product.name}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              loading="lazy"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-muted-foreground">
              <ShoppingCart className="size-8" />
            </div>
          )}
          {discount && discount > 0 && (
            <Badge className="absolute left-2 top-2 bg-primary text-primary-foreground">
              -{discount}%
            </Badge>
          )}
          <button
            className="absolute right-2 top-2 flex size-8 items-center justify-center rounded-full bg-background/80 backdrop-blur transition-colors hover:bg-background"
            onClick={(e) => e.preventDefault()}
          >
            <Heart className="size-4 text-muted-foreground" />
          </button>
          {!product.is_active && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/60">
              <Badge variant="secondary">Out of Stock</Badge>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex flex-col gap-1.5 p-3">
          <h3 className="line-clamp-2 text-sm font-medium leading-snug">
            {product.name}
          </h3>

          {/* Price */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-primary">
              {formatPrice(price)}
            </span>
            {originalPrice && (
              <span className="text-xs text-muted-foreground line-through">
                {formatPrice(originalPrice)}
              </span>
            )}
          </div>

          {/* Add to cart */}
          <button
            className={cn(
              buttonVariants({ size: "sm", variant: "outline" }),
              "mt-1 w-full gap-1.5"
            )}
            onClick={handleAddToCart}
            disabled={adding}
          >
            <ShoppingCart className="size-3.5" />
            {adding ? "Adding..." : "Add to Cart"}
          </button>
        </div>
      </Card>
    </Link>
  )
}
