"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Flame, Tag, ArrowRight, Zap, TrendingDown, Package } from "lucide-react"
import { buttonVariants, Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Skeleton } from "@/components/ui/skeleton"
import { ProductCard } from "@/components/product-card"
import { api, type ApiError } from "@/lib/api"
import { toast } from "@/components/ui/toast"
import type { ApiProduct } from "@/lib/store-types"

function getApiError(err: unknown): string {
  const e = err as ApiError
  return e?.detail || "Something went wrong. Please try again."
}

export default function DealsPage() {
  const [products, setProducts] = useState<ApiProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    api.get<ApiProduct[]>("/products?limit=100")
      .then((data) => {
        setProducts(data)
        setError(null)
      })
      .catch((err) => {
        const msg = getApiError(err)
        setError(msg)
        toast.add({ title: "Failed to load deals", description: msg, type: "error" })
      })
      .finally(() => setLoading(false))
  }, [])

  const dealProducts = products.filter((p) => p.sale_price && Number(p.sale_price) < Number(p.price))
  const flashDeals = [...dealProducts].sort((a, b) => {
    const pctA = (Number(a.price) - Number(a.sale_price)) / Number(a.price)
    const pctB = (Number(b.price) - Number(b.sale_price)) / Number(b.price)
    return pctB - pctA
  }).slice(0, 4)
  const featuredDeals = dealProducts.slice(0, 8)

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 md:py-12">
      {/* Hero Banner */}
      <div className="relative mb-12 overflow-hidden rounded-2xl bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 p-8 md:p-12">
        <div className="absolute right-0 top-0 size-48 rounded-full bg-white/10" />
        <div className="absolute -right-12 -bottom-12 size-64 rounded-full bg-white/5" />
        <div className="relative flex flex-col items-start gap-4">
          <div className="flex items-center gap-2 rounded-full bg-white/20 px-4 py-1.5">
            <Flame className="size-4 text-white" />
            <span className="text-sm font-medium text-white">Limited Time Only</span>
          </div>
          <h1 className="text-3xl font-bold text-white md:text-5xl">🔥 Hot Deals</h1>
          <p className="max-w-lg text-base text-white/90 md:text-lg">
            Save big on top brands and products. New deals added daily — grab them before they&apos;re gone!
          </p>
          <div className="flex flex-wrap gap-3">
            <Link href="/products?deals=true" className={cn(buttonVariants({ variant: "secondary", size: "lg" }), "gap-2")}>
              Shop All Deals
              <ArrowRight className="size-4" />
            </Link>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:gap-4 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex flex-col gap-2">
              <Skeleton className="aspect-square w-full rounded-lg" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-8 w-full" />
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
          <p className="text-lg font-medium">Failed to load deals</p>
          <p className="text-sm text-muted-foreground">{error}</p>
          <Button variant="outline" onClick={() => window.location.reload()}>Try Again</Button>
        </div>
      ) : dealProducts.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
          <Package className="size-12 text-muted-foreground" />
          <p className="text-lg font-medium">No deals available right now</p>
          <p className="text-sm text-muted-foreground">Check back soon for new deals and discounts!</p>
          <Link href="/products" className={cn(buttonVariants(), "gap-2")}>
            Browse All Products
            <ArrowRight className="size-4" />
          </Link>
        </div>
      ) : (
        <>
          {/* Flash Deals */}
          {flashDeals.length > 0 && (
            <div className="mb-12">
              <div className="mb-6 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Zap className="size-5 text-orange-500" />
                  <h2 className="text-xl font-bold tracking-tight">Flash Deals</h2>
                  <span className="rounded-md bg-orange-500/10 px-2 py-0.5 text-xs font-medium text-orange-600">
                    Biggest Discounts
                  </span>
                </div>
                <Link href="/products?deals=true" className="flex items-center gap-1 text-sm font-medium text-primary hover:underline">
                  View All <ArrowRight className="size-4" />
                </Link>
              </div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:gap-4 xl:grid-cols-4">
                {flashDeals.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            </div>
          )}

          {/* Featured Deals */}
          {featuredDeals.length > 0 && (
            <div className="mb-12">
              <div className="mb-6 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingDown className="size-5 text-primary" />
                  <h2 className="text-xl font-bold tracking-tight">All Deals</h2>
                </div>
                <Link href="/products?deals=true" className="flex items-center gap-1 text-sm font-medium text-primary hover:underline">
                  View All <ArrowRight className="size-4" />
                </Link>
              </div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:gap-4 xl:grid-cols-4">
                {featuredDeals.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Newsletter / CTA */}
      <div className="flex flex-col items-center gap-4 rounded-2xl border bg-muted/30 p-8 text-center">
        <Tag className="size-8 text-primary" />
        <h2 className="text-xl font-bold">Never Miss a Deal</h2>
        <p className="max-w-md text-sm text-muted-foreground">
          Get notified about the best deals and exclusive discounts before anyone else.
        </p>
        <Link
          href="/auth?tab=register"
          className={cn(buttonVariants({ size: "lg" }), "gap-2")}
        >
          Sign Up for Deal Alerts
          <ArrowRight className="size-4" />
        </Link>
      </div>
    </div>
  )
}
