"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import {
  ArrowRight,
  SlidersHorizontal,
  X,
  Package,
} from "lucide-react"
import { buttonVariants, Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ProductCard } from "@/components/product-card"
import { cn } from "@/lib/utils"
import { Skeleton } from "@/components/ui/skeleton"
import { api, type ApiError } from "@/lib/api"
import { toast } from "@/components/ui/toast"
import type { ApiProduct, ApiCategory } from "@/lib/store-types"
import { useAuth } from "@/lib/auth-context"

type DiscoveryResponse = { total: number; results: Array<{
  id: string
  seller_id: string
  category_id: string
  brand_id: string | null
  name: string
  slug: string
  price: number
  sale_price: number | null
  currency: string
  primary_image_url: string | null
}> }

function toProduct(item: DiscoveryResponse["results"][number]): ApiProduct {
  return {
    ...item,
    sku: "",
    description: null,
    weight: null,
    status: "approved",
    is_active: true,
    created_at: "",
    images: item.primary_image_url ? [{
      id: `discovery-${item.id}`,
      product_id: item.id,
      image_url: item.primary_image_url,
      thumbnail_url: item.primary_image_url,
      alt_text: item.name,
      is_primary: true,
      display_order: 0,
    }] : [],
  }
}

function ProductSection({ title, products, href = "/products" }: { title: string; products: ApiProduct[]; href?: string }) {
  if (products.length === 0) return null
  return (
    <section className="mt-10">
      <div className="mb-5 flex items-center justify-between">
        <h2 className="text-xl font-bold tracking-tight">{title}</h2>
        <Link href={href} className="flex items-center gap-1 text-sm font-medium text-primary hover:underline">
          View All <ArrowRight className="size-4" />
        </Link>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:gap-4 xl:grid-cols-4">
        {products.slice(0, 4).map((product) => <ProductCard key={`${title}-${product.id}`} product={product} />)}
      </div>
    </section>
  )
}

function getApiError(err: unknown): string {
  const e = err as ApiError
  return e?.detail || "Something went wrong. Please try again."
}

export default function Home() {
  const { isAuthenticated } = useAuth()
  const [activeCat, setActiveCat] = useState<string | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [products, setProducts] = useState<ApiProduct[]>([])
  const [categories, setCategories] = useState<ApiCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [newArrivals, setNewArrivals] = useState<ApiProduct[]>([])
  const [trending, setTrending] = useState<ApiProduct[]>([])
  const [recommended, setRecommended] = useState<ApiProduct[]>([])
  const [recentlyViewed, setRecentlyViewed] = useState<ApiProduct[]>([])

  useEffect(() => {
    Promise.all([
      api.get<ApiProduct[]>("/products?limit=20"),
      api.get<ApiCategory[]>("/products/categories"),
    ])
      .then(([p, c]) => {
        setProducts(p)
        setCategories(c)
        setError(null)
      })
      .catch((err) => {
        const msg = getApiError(err)
        setError(msg)
        toast.add({ title: "Failed to load data", description: msg, type: "error" })
      })
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    Promise.all([
      api.get<DiscoveryResponse>("/search/products?sort=newest&page_size=4"),
      api.get<DiscoveryResponse>("/search/products?sort=popular&page_size=4"),
    ]).then(([newest, popular]) => {
      setNewArrivals(newest.results.map(toProduct))
      setTrending(popular.results.map(toProduct))
    }).catch(() => {
      setNewArrivals([])
      setTrending([])
    })
  }, [])

  useEffect(() => {
    if (!isAuthenticated) {
      return
    }
    Promise.all([
      api.get<DiscoveryResponse>("/recommendations?limit=4"),
      api.get<DiscoveryResponse>("/recommendations/recently-viewed?limit=4"),
    ]).then(([recs, recent]) => {
      setRecommended(recs.results.map(toProduct))
      setRecentlyViewed(recent.results.map(toProduct))
    }).catch(() => {
      setRecommended([])
      setRecentlyViewed([])
    })
  }, [isAuthenticated])

  const filtered = activeCat
    ? products.filter((p) => p.category_id === activeCat)
    : products

  const dealsProducts = products.filter((p) => p.sale_price && Number(p.sale_price) < Number(p.price)).slice(0, 4)

  return (
    <div className="flex flex-col">
      {/* Main layout: sidebar + products */}
      <div className="mx-auto flex w-full max-w-7xl gap-6 px-4 py-6">
        {/* Desktop sidebar - categories */}
        <aside className="hidden w-56 shrink-0 lg:block">
          <div className="sticky top-32 flex flex-col gap-1">
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
                Categories
              </h2>
            </div>
            <button
              onClick={() => setActiveCat(null)}
              className={cn(
                "flex items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors",
                !activeCat
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-muted"
              )}
            >
              <span>All Products</span>
              <span className="text-xs opacity-70">{loading ? "..." : products.length}</span>
            </button>
            {loading ? (
              <div className="flex flex-col gap-1">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="h-9 w-full rounded-lg" />
                ))}
              </div>
            ) : (
              categories.map((cat) => {
                const isActive = activeCat === cat.id
                return (
                  <button
                    key={cat.id}
                    onClick={() => setActiveCat(isActive ? null : cat.id)}
                    className={cn(
                      "flex items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors",
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "hover:bg-muted"
                    )}
                  >
                    <span className="flex items-center gap-2.5">
                      <Package className="size-4" />
                      {cat.name}
                    </span>
                  </button>
                )
              })
            )}

            {/* Deals link */}
            <Link
              href="/products?deals=true"
              className="mt-3 flex items-center gap-2 rounded-lg bg-primary/10 px-3 py-2.5 text-sm font-medium text-primary transition-colors hover:bg-primary/20"
            >
              🔥 Hot Deals
            </Link>
          </div>
        </aside>

        {/* Mobile sidebar toggle */}
        <button
          onClick={() => setSidebarOpen(true)}
          className="fixed bottom-24 left-4 z-40 flex size-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform active:scale-90 lg:hidden"
        >
          <SlidersHorizontal className="size-5" />
        </button>

        {/* Mobile sidebar overlay */}
        {sidebarOpen && (
          <div className="fixed inset-0 z-[60] lg:hidden">
            <div
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              onClick={() => setSidebarOpen(false)}
            />
            <div
              className="absolute left-0 top-0 h-full w-[85%] max-w-[320px] overflow-y-auto bg-background p-4 shadow-2xl"
              style={{ paddingBottom: "calc(1rem + env(safe-area-inset-bottom))" }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
                  Categories
                </h2>
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="flex size-8 items-center justify-center rounded-lg hover:bg-muted"
                >
                  <X className="size-5" />
                </button>
              </div>
              <button
                onClick={() => {
                  setActiveCat(null)
                  setSidebarOpen(false)
                }}
                className={cn(
                  "mb-1 flex w-full items-center justify-between rounded-lg px-3 py-3 text-sm transition-colors",
                  !activeCat ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                )}
              >
                <span>All Products</span>
                <span className="text-xs opacity-70">{products.length}</span>
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => {
                    setActiveCat(cat.id)
                    setSidebarOpen(false)
                  }}
                  className={cn(
                    "mb-1 flex w-full items-center justify-between rounded-lg px-3 py-3 text-sm transition-colors",
                    activeCat === cat.id
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-muted"
                  )}
                >
                  <span className="flex items-center gap-2.5">
                    <Package className="size-4" />
                    {cat.name}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Products area */}
        <div className="flex-1">
          {/* Section header */}
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold tracking-tight md:text-2xl">
                {activeCat ? categories.find((c) => c.id === activeCat)?.name ?? "Products" : "All Products"}
              </h1>
              <p className="text-sm text-muted-foreground">
                {loading ? "Loading..." : `${filtered.length} products available`}
              </p>
            </div>
            <select
              className="h-9 rounded-md border border-input bg-background px-3 text-sm"
              defaultValue="featured"
            >
              <option value="featured">Featured</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
            </select>
          </div>

          {/* Products grid */}
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
              <p className="text-lg font-medium">Failed to load products</p>
              <p className="text-sm text-muted-foreground">{error}</p>
              <Button variant="outline" onClick={() => window.location.reload()}>Try Again</Button>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
              No products found.
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:gap-4 xl:grid-cols-4">
              {filtered.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}

          {/* Deals banner */}
          <div className="mt-8 relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary to-primary/80 p-5 md:p-8">
            <div className="absolute right-0 top-0 size-32 rounded-full bg-white/10" />
            <div className="absolute -right-8 -bottom-8 size-40 rounded-full bg-white/5" />
            <div className="relative flex flex-col items-start gap-3">
              <Badge className="bg-white/20 text-white">Limited Time</Badge>
              <h2 className="text-2xl font-bold text-white md:text-3xl">
                Hot Deals of the Week
              </h2>
              <p className="max-w-md text-sm text-white/80">
                Save big on selected items. Hurry, these deals won&apos;t last long!
              </p>
              <Link
                href="/products?deals=true"
                className={cn(
                  buttonVariants({ variant: "secondary", size: "lg" }),
                  "gap-2"
                )}
              >
                Shop Deals
                <ArrowRight className="size-4" />
              </Link>
            </div>
          </div>

          {/* Deals products */}
          {dealsProducts.length > 0 && (
            <div className="mt-8">
              <div className="mb-5 flex items-center justify-between">
                <h2 className="text-xl font-bold tracking-tight">Today&apos;s Deals</h2>
                <Link
                  href="/products?deals=true"
                  className="flex items-center gap-1 text-sm font-medium text-primary hover:underline"
                >
                  View All <ArrowRight className="size-4" />
                </Link>
              </div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:gap-4 xl:grid-cols-4">
                {dealsProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            </div>
          )}

          <ProductSection title="Recommended for You" products={isAuthenticated ? recommended : []} />
          <ProductSection title="Trending Now" products={trending} href="/products?sort=popular" />
          <ProductSection title="New Arrivals" products={newArrivals} href="/products?sort=newest" />
          <ProductSection title="Recently Viewed" products={isAuthenticated ? recentlyViewed : []} />
        </div>
      </div>

    </div>
  )
}
