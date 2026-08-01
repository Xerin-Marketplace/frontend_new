"use client"

import { useState } from "react"
import { SlidersHorizontal, Grid2x2, List, ChevronDown } from "lucide-react"
import { ProductCard } from "@/components/product-card"
import { products, categories } from "@/lib/mock-data"
import { Button, buttonVariants } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Separator } from "@/components/ui/separator"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { cn } from "@/lib/utils"

export default function ProductsPage() {
  const [view, setView] = useState<"grid" | "list">("grid")
  const [sortBy, setSortBy] = useState("featured")
  const [selectedCats, setSelectedCats] = useState<string[]>([])
  const [priceRange, setPriceRange] = useState<"all" | "low" | "mid" | "high">(
    "all"
  )

  const filtered = products.filter((p) => {
    if (selectedCats.length && !selectedCats.includes(p.category)) return false
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

  const FilterContent = () => (
    <div className="flex flex-col gap-6">
      {/* Categories */}
      <div>
        <h3 className="mb-3 text-sm font-semibold">Categories</h3>
        <div className="flex flex-col gap-2.5">
          {categories.map((cat) => (
            <label
              key={cat.id}
              className="flex items-center gap-2.5 text-sm"
            >
              <Checkbox
                checked={selectedCats.includes(cat.name)}
                onCheckedChange={(checked) => {
                  if (checked) setSelectedCats([...selectedCats, cat.name])
                  else
                    setSelectedCats(
                      selectedCats.filter((c) => c !== cat.name)
                    )
                }}
              />
              <span>{cat.name}</span>
              <span className="ml-auto text-xs text-muted-foreground">
                {cat.productCount}
              </span>
            </label>
          ))}
        </div>
      </div>

      <Separator />

      {/* Price */}
      <div>
        <h3 className="mb-3 text-sm font-semibold">Price Range</h3>
        <div className="flex flex-col gap-2.5">
          {[
            { key: "all", label: "All Prices" },
            { key: "low", label: "Under TSh 50,000" },
            { key: "mid", label: "TSh 50,000 - 200,000" },
            { key: "high", label: "Above TSh 200,000" },
          ].map((opt) => (
            <label
              key={opt.key}
              className="flex items-center gap-2.5 text-sm"
            >
              <Checkbox
                checked={priceRange === opt.key}
                onCheckedChange={() =>
                  setPriceRange(opt.key as typeof priceRange)
                }
              />
              <span>{opt.label}</span>
            </label>
          ))}
        </div>
      </div>

      <Separator />

      {/* Brands */}
      <div>
        <h3 className="mb-3 text-sm font-semibold">Brands</h3>
        <div className="flex flex-col gap-2.5">
          {[...new Set(products.map((p) => p.brand))].map((brand) => (
            <label key={brand} className="flex items-center gap-2.5 text-sm">
              <Checkbox />
              <span>{brand}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  )

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-2">
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
            {/* Mobile filter */}
            <Sheet>
              <SheetTrigger
                render={
                  <Button variant="outline" size="sm" className="lg:hidden" />
                }
              >
                <SlidersHorizontal className="size-4" /> Filters
              </SheetTrigger>
              <SheetContent side="left" className="w-80 overflow-y-auto">
                <SheetHeader>
                  <SheetTitle>Filters</SheetTitle>
                </SheetHeader>
                <div className="mt-6">
                  <FilterContent />
                </div>
              </SheetContent>
            </Sheet>

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

          {/* Active filters */}
          {selectedCats.length > 0 && (
            <div className="mb-4 flex flex-wrap items-center gap-2">
              {selectedCats.map((cat) => (
                <Badge key={cat} variant="secondary" className="gap-1.5">
                  {cat}
                  <button
                    onClick={() =>
                      setSelectedCats(selectedCats.filter((c) => c !== cat))
                    }
                    className="ml-1 text-xs"
                  >
                    ×
                  </button>
                </Badge>
              ))}
              <button
                onClick={() => setSelectedCats([])}
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
                "grid gap-3 sm:grid-cols-2 md:gap-4",
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
              <Button
                variant="outline"
                onClick={() => {
                  setSelectedCats([])
                  setPriceRange("all")
                }}
              >
                Clear Filters
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
