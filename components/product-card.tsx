"use client"

import Link from "next/link"
import { Heart, Star, ShoppingCart } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { Product } from "@/lib/mock-data"

export function formatPrice(price: number) {
  return `TSh ${price.toLocaleString()}`
}

export function ProductCard({ product }: { product: Product }) {
  const discount = product.originalPrice
    ? Math.round(
        ((product.originalPrice - product.price) / product.originalPrice) * 100
      )
    : 0

  return (
    <Link href={`/products/${product.id}`} className="group block">
      <Card className="h-full p-0 transition-all hover:shadow-md">
        {/* Image */}
        <div className="relative aspect-square overflow-hidden bg-muted">
          <img
            src={product.image}
            alt={product.name}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
          {discount > 0 && (
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
          {!product.inStock && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/60">
              <Badge variant="secondary">Out of Stock</Badge>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex flex-col gap-1.5 p-3">
          <p className="text-xs text-muted-foreground">{product.brand}</p>
          <h3 className="line-clamp-2 text-sm font-medium leading-snug">
            {product.name}
          </h3>

          {/* Rating */}
          <div className="flex items-center gap-1">
            <Star className="size-3.5 fill-primary text-primary" />
            <span className="text-xs font-medium">{product.rating}</span>
            <span className="text-xs text-muted-foreground">
              ({product.reviewCount})
            </span>
          </div>

          {/* Price */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-primary">
              {formatPrice(product.price)}
            </span>
            {product.originalPrice && (
              <span className="text-xs text-muted-foreground line-through">
                {formatPrice(product.originalPrice)}
              </span>
            )}
          </div>

          {/* Add to cart */}
          <button
            className={cn(
              buttonVariants({ size: "sm", variant: "outline" }),
              "mt-1 w-full gap-1.5"
            )}
            onClick={(e) => e.preventDefault()}
          >
            <ShoppingCart className="size-3.5" />
            Add to Cart
          </button>
        </div>
      </Card>
    </Link>
  )
}
