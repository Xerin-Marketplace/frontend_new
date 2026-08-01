"use client"

import { useState, useEffect, useCallback } from "react"
import { SlidersHorizontal, Grid2x2, List, X } from "lucide-react"
import { ProductCard } from "@/components/product-card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import { api, type ApiError } from "@/lib/api"
import { toast } from "@/components/ui/toast"
import type { ApiProduct, ApiCategory, ApiBrand } from "@/lib/store-types"

function getApiError(err: unknown): string {
  const e = err as ApiError
  return e?.detail || "Something went wrong. Please try again."
}

export default function ProductsPage() {
  const [view, setView] = useState<"grid" | "list">("grid")
  const [sortBy, setSortBy] = useState("featured")
  const [selectedCats, setSelectedCats] = useState<string[]>([])
  const [selectedBrands, setSelectedBrands] = useState<string[]>([])
  const [priceRange, setPriceRange] = useState<"all" | "low" | "mid" | "high">("all")
  const [filterOpen, setFilterOpen] = useState(false)
  const [products, setProducts] = useState<ApiProduct[]>([])
  const [categories, setCategories] = useState<ApiCategory[]>([])
  const [brands, setBrands] = useState<ApiBrand[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")

  useEffect(() => {
    Promise.all([
      api.get<ApiProduct[]>("/products?limit=100"),
      api.get<ApiCategory[]>("/products/categories"),
      api.get<ApiBrand[]>("/products/brands"),
    ])
      .then(([p, c, b]) => {
        setProducts(p)
        setCategories(c)
        setBrands(b)
      })
      .catch((err) => {
        toast.add({ title: "Failed to load products", description: getApiError(err), type: "error" })
      })
      .finally(() => setLoading(false))
  }, [])

  const filtered = products.filter((p) => {
    if (selectedCats.length && !selectedCats.includes(p.category_id)) return false
    if (selectedBrands.length && (!p.brand_id || !selectedBrands.includes(p.brand_id))) return false
    const price = Number(p.sale_price ?? p.price)
    if (priceRange === "low" && price > 50000) return false
    if (priceRange === "mid" && (price < 50000 || price > 200000)) return false
    if (priceRange === "high" && price < 200000) return false
    if (search && !p.name.toLowerCase().includes(search.toLowerCase()) && !p.description?.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const sorted = [...filtered].sort((a, b) => {
    const priceA = Number(a.sale_price ?? a.price)
    const priceB = Number(b.sale_price ?? b.price)
    if (sortBy === "price-low") return priceA - priceB
    if (sortBy === "price-high") return priceB - priceA
    return 0
  })

  const toggleCat = (id: string) => {
    setSelectedCats((prev) => prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id])
  }

  const toggleBrand = (id: string) => {
    setSelectedBrands((prev) => prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id])
  }

  const clearAll = () => {
    setSelectedCats([])
    setSelectedBrands([])
    setPriceRange("all")
    setSearch("")
  }

  const activeFilterCount = selectedCats.length + selectedBrands.length + (priceRange !== "all" ? 1 : 0)

  const FilterContent = () => (
    <div className="flex flex-col gap-6">
      {/* Search */}
      <div>
        <h3 className="mb-3 text-sm font-semibold">Search</h3>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search products..."
          className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
        />
      </div>

      <Separator />

      {/* Categories */}
      <div>
        <h3 className="mb-3 text-sm font-semibold">Categories</h3>
        <div className="flex flex-col gap-1">
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-8 w-full rounded-lg" />)
          ) : categories.map((cat) => {
            const checked = selectedCats.includes(cat.id)
            return (
              <button
                key={cat.id}
                onClick={() => toggleCat(cat.id)}
                className={cn(
                  "flex items-center gap-2.5 rounded-lg px-2 py-2.5 text-left text-sm transition-colors",
                  checked ? "bg-primary/5" : "hover:bg-muted"
                )}
              >
                <Checkbox checked={checked} />
                <span>{cat.name}</span>
              </button>
            )
          })}
        </div>
      </div>

      <Separator />

      {/* Price */}
      <div>
        <h3 className="mb-3 text-sm font-semibold">Price Range</h3>
        <div className="flex flex-col gap-1">
          {[
            { key: "all", label: "All Prices" },
            { key: "low", label: "Under TSh 50,000" },
            { key: "mid", label: "TSh 50,000 - 200,000" },
            { key: "high", label: "Above TSh 200,000" },
          ].map((opt) => {
            const checked = priceRange === opt.key
            return (
              <button
                key={opt.key}
                onClick={() => setPriceRange(opt.key as typeof priceRange)}
                className={cn(
                  "flex items-center gap-2.5 rounded-lg px-2 py-2.5 text-left text-sm transition-colors",
                  checked ? "bg-primary/5" : "hover:bg-muted"
                )}
              >
                <Checkbox checked={checked} />
                <span>{opt.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {brands.length > 0 && (
        <>
          <Separator />
          <div>
            <h3 className="mb-3 text-sm font-semibold">Brands</h3>
            <div className="flex flex-col gap-1">
              {brands.map((brand) => {
                const checked = selectedBrands.includes(brand.id)
                return (
                  <button
                    key={brand.id}
                    onClick={() => toggleBrand(brand.id)}
                    className={cn(
                      "flex items-center gap-2.5 rounded-lg px-2 py-2.5 text-left text-sm transition-colors",
                      checked ? "bg-primary/5" : "hover:bg-muted"
                    )}
                  >
                    <Checkbox checked={checked} />
                    <span>{brand.name}</span>
                  </button>
                )
              })}
            </div>
          </div>
        </>
      )}

      {activeFilterCount > 0 && (
        <Button variant="outline" onClick={clearAll} className="w-full">
          Clear All Filters ({activeFilterCount})
        </Button>
      )}
    </div>
  )

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      {/* Header */}
      <div className="mb-4 flex flex-col gap-2">
        <h1 className="text-2xl font-bold tracking-tight">All Products</h1>
        <p className="text-sm text-muted-foreground">
          {loading ? "Loading..." : `Showing ${sorted.length} products`}
        </p>
      </div>

      <div className="flex gap-6">
        {/* Desktop sidebar */}
        <aside className="hidden w-64 shrink-0 lg:block">
          <div className="sticky top-32">
            <FilterContent />
          </div>
        </aside>

        {/* Main */}
        <div className="flex-1">
          {/* Toolbar */}
          <div className="mb-4 flex items-center justify-between gap-2 border-b pb-3">
            <Button
              variant="outline"
              size="sm"
              className="lg:hidden"
              onClick={() => setFilterOpen(true)}
            >
              <SlidersHorizontal className="size-4" />
              Filters
              {activeFilterCount > 0 && (
                <Badge className="ml-1 size-5 justify-center p-0 text-[10px]">
                  {activeFilterCount}
                </Badge>
              )}
            </Button>

            <div className="flex items-center gap-2">
              <span className="hidden text-sm text-muted-foreground sm:block">Sort by:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="h-9 rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="featured">Featured</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
              </select>
            </div>

            <div className="hidden items-center gap-1 md:flex">
              <Button variant={view === "grid" ? "default" : "ghost"} size="icon-sm" onClick={() => setView("grid")}>
                <Grid2x2 className="size-4" />
              </Button>
              <Button variant={view === "list" ? "default" : "ghost"} size="icon-sm" onClick={() => setView("list")}>
                <List className="size-4" />
              </Button>
            </div>
          </div>

          {/* Mobile filter overlay */}
          {filterOpen && (
            <div className="fixed inset-0 z-[60] lg:hidden">
              <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setFilterOpen(false)} />
              <div
                className="absolute left-0 top-0 h-full w-[85%] max-w-[340px] overflow-y-auto bg-background shadow-2xl"
                style={{ paddingBottom: "calc(1rem + env(safe-area-inset-bottom))" }}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-background p-4">
                  <h2 className="text-base font-semibold">Filters</h2>
                  <button onClick={() => setFilterOpen(false)} className="flex size-8 items-center justify-center rounded-lg hover:bg-muted">
                    <X className="size-5" />
                  </button>
                </div>
                <div className="p-4"><FilterContent /></div>
                <div className="sticky bottom-0 z-10 border-t bg-background p-4" style={{ paddingBottom: "calc(1rem + env(safe-area-inset-bottom))" }}>
                  <Button className="w-full" onClick={() => setFilterOpen(false)}>
                    Show {sorted.length} Results
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Active filters */}
          {activeFilterCount > 0 && (
            <div className="mb-4 flex flex-wrap items-center gap-2">
              {selectedCats.map((catId) => {
                const cat = categories.find((c) => c.id === catId)
                return (
                  <Badge key={catId} variant="secondary" className="gap-1.5">
                    {cat?.name ?? catId}
                    <button onClick={() => toggleCat(catId)} className="ml-1 text-xs"><X className="size-3" /></button>
                  </Badge>
                )
              })}
              {selectedBrands.map((brandId) => {
                const brand = brands.find((b) => b.id === brandId)
                return (
                  <Badge key={brandId} variant="secondary" className="gap-1.5">
                    {brand?.name ?? brandId}
                    <button onClick={() => toggleBrand(brandId)} className="ml-1 text-xs"><X className="size-3" /></button>
                  </Badge>
                )
              })}
              {priceRange !== "all" && (
                <Badge variant="secondary" className="gap-1.5">
                  Price filter
                  <button onClick={() => setPriceRange("all")} className="ml-1 text-xs"><X className="size-3" /></button>
                </Badge>
              )}
              <button onClick={clearAll} className="text-sm text-primary hover:underline">Clear all</button>
            </div>
          )}

          {/* Products grid */}
          {loading ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 md:gap-4 lg:grid-cols-3">
              {Array.from({ length: 9 }).map((_, i) => (
                <div key={i} className="flex flex-col gap-2">
                  <Skeleton className="aspect-square w-full rounded-lg" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-8 w-full" />
                </div>
              ))}
            </div>
          ) : sorted.length > 0 ? (
            <div className={cn("grid grid-cols-2 gap-3 sm:grid-cols-2 md:gap-4", view === "grid" ? "lg:grid-cols-3" : "lg:grid-cols-2")}>
              {sorted.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
              <p className="text-lg font-medium">No products found</p>
              <p className="text-sm text-muted-foreground">Try adjusting your filters</p>
              <Button variant="outline" onClick={clearAll}>Clear Filters</Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
