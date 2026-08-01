"use client"

import { useState } from "react"
import { SlidersHorizontal, Grid2x2, List, X } from "lucide-react"
import { ProductCard } from "@/components/product-card"
import { products, categories } from "@/lib/mock-data"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"

export default function ProductsPage() {
  const [view, setView] = useState<"grid" | "list">("grid")
  const [sortBy, setSortBy] = useState("featured")
  const [selectedCats, setSelectedCats] = useState<string[]>([])
  const [selectedBrands, setSelectedBrands] = useState<string[]>([])
  const [priceRange, setPriceRange] = useState<"all" | "low" | "mid" | "high">(
    "all"
  )
  const [filterOpen, setFilterOpen] = useState(false)

  const allBrands = [...new Set(products.map((p) => p.brand))]

  const filtered = products.filter((p) => {
    if (selectedCats.length && !selectedCats.includes(p.category)) return false
    if (selectedBrands.length && !selectedBrands.includes(p.brand)) return false
    if (priceRange === "low" && p.price > 50000) return false
    if (priceRange === "mid" && (p.price < 50000 || p.price > 200000)) return false
    if (priceRange === "high" && p.price < 200000) return false
    return true
  })

  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === "price-low") return a.price - b.price
    if (sortBy === "price-high") return b.price - a.price
    if (sortBy === "rating") return b.rating - a.rating
    return 0
  })

  const toggleCat = (name: string) => {
    setSelectedCats((prev) =>
      prev.includes(name) ? prev.filter((c) => c !== name) : [...prev, name]
    )
  }

  const toggleBrand = (name: string) => {
    setSelectedBrands((prev) =>
      prev.includes(name) ? prev.filter((c) => c !== name) : [...prev, name]
    )
  }

  const clearAll = () => {
    setSelectedCats([])
    setSelectedBrands([])
    setPriceRange("all")
  }

  const activeFilterCount =
    selectedCats.length + selectedBrands.length + (priceRange !== "all" ? 1 : 0)

  const FilterContent = () => (
    <div className="flex flex-col gap-6">
      {/* Categories */}
      <div>
        <h3 className="mb-3 text-sm font-semibold">Categories</h3>
        <div className="flex flex-col gap-1">
          {categories.map((cat) => {
            const checked = selectedCats.includes(cat.name)
            return (
              <button
                key={cat.id}
                onClick={() => toggleCat(cat.name)}
                className={cn(
                  "flex items-center gap-2.5 rounded-lg px-2 py-2.5 text-left text-sm transition-colors",
                  checked ? "bg-primary/5" : "hover:bg-muted"
                )}
              >
                <Checkbox checked={checked} />
                <span>{cat.name}</span>
                <span className="ml-auto text-xs text-muted-foreground">
                  {cat.productCount}
                </span>
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

      <Separator />

      {/* Brands */}
      <div>
        <h3 className="mb-3 text-sm font-semibold">Brands</h3>
        <div className="flex flex-col gap-1">
          {allBrands.map((brand) => {
            const checked = selectedBrands.includes(brand)
            return (
              <button
                key={brand}
                onClick={() => toggleBrand(brand)}
                className={cn(
                  "flex items-center gap-2.5 rounded-lg px-2 py-2.5 text-left text-sm transition-colors",
                  checked ? "bg-primary/5" : "hover:bg-muted"
                )}
              >
                <Checkbox checked={checked} />
                <span>{brand}</span>
              </button>
            )
          })}
        </div>
      </div>

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
          Showing {sorted.length} products
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
            {/* Mobile filter button */}
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

            {/* Sort */}
            <div className="flex items-center gap-2">
              <span className="hidden text-sm text-muted-foreground sm:block">
                Sort by:
              </span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="h-9 rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="featured">Featured</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="rating">Top Rated</option>
              </select>
            </div>

            {/* View toggle */}
            <div className="hidden items-center gap-1 md:flex">
              <Button
                variant={view === "grid" ? "default" : "ghost"}
                size="icon-sm"
                onClick={() => setView("grid")}
              >
                <Grid2x2 className="size-4" />
              </Button>
              <Button
                variant={view === "list" ? "default" : "ghost"}
                size="icon-sm"
                onClick={() => setView("list")}
              >
                <List className="size-4" />
              </Button>
            </div>
          </div>

          {/* Mobile filter overlay */}
          {filterOpen && (
            <div className="fixed inset-0 z-[60] lg:hidden">
              <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={() => setFilterOpen(false)}
              />
              <div
                className="absolute left-0 top-0 h-full w-[85%] max-w-[340px] overflow-y-auto bg-background shadow-2xl"
                style={{ paddingBottom: "calc(1rem + env(safe-area-inset-bottom))" }}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-background p-4">
                  <h2 className="text-base font-semibold">Filters</h2>
                  <button
                    onClick={() => setFilterOpen(false)}
                    className="flex size-8 items-center justify-center rounded-lg hover:bg-muted"
                  >
                    <X className="size-5" />
                  </button>
                </div>
                <div className="p-4">
                  <FilterContent />
                </div>
                <div className="sticky bottom-0 z-10 border-t bg-background p-4"
                  style={{ paddingBottom: "calc(1rem + env(safe-area-inset-bottom))" }}
                >
                  <Button
                    className="w-full"
                    onClick={() => setFilterOpen(false)}
                  >
                    Show {sorted.length} Results
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Active filters */}
          {activeFilterCount > 0 && (
            <div className="mb-4 flex flex-wrap items-center gap-2">
              {selectedCats.map((cat) => (
                <Badge key={cat} variant="secondary" className="gap-1.5">
                  {cat}
                  <button
                    onClick={() => toggleCat(cat)}
                    className="ml-1 text-xs"
                  >
                    <X className="size-3" />
                  </button>
                </Badge>
              ))}
              {selectedBrands.map((brand) => (
                <Badge key={brand} variant="secondary" className="gap-1.5">
                  {brand}
                  <button
                    onClick={() => toggleBrand(brand)}
                    className="ml-1 text-xs"
                  >
                    <X className="size-3" />
                  </button>
                </Badge>
              ))}
              {priceRange !== "all" && (
                <Badge variant="secondary" className="gap-1.5">
                  Price filter
                  <button
                    onClick={() => setPriceRange("all")}
                    className="ml-1 text-xs"
                  >
                    <X className="size-3" />
                  </button>
                </Badge>
              )}
              <button
                onClick={clearAll}
                className="text-sm text-primary hover:underline"
              >
                Clear all
              </button>
            </div>
          )}

          {/* Products grid */}
          {sorted.length > 0 ? (
            <div
              className={cn(
                "grid grid-cols-2 gap-3 sm:grid-cols-2 md:gap-4",
                view === "grid" ? "lg:grid-cols-3" : "lg:grid-cols-2"
              )}
            >
              {sorted.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
              <p className="text-lg font-medium">No products found</p>
              <p className="text-sm text-muted-foreground">
                Try adjusting your filters
              </p>
              <Button variant="outline" onClick={clearAll}>
                Clear Filters
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
