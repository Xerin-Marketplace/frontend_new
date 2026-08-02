"use client"

import * as React from "react"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button, buttonVariants } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "@/components/ui/toast"
import { cn } from "@/lib/utils"
import {
  Search,
  Heart,
  ShoppingCart,
  Trash2,
  Package,
  Star,
  ArrowRight,
  Sparkles,
  TrendingDown,
  CheckCircle2,
  XCircle,
  ShoppingBag,
} from "lucide-react"

type WishlistItem = {
  id: string
  product_name: string
  seller_name: string
  price: number
  sale_price: number | null
  rating: number
  review_count: number
  in_stock: boolean
  image: string | null
  added_at: string
  category: string
}

const mockWishlist: WishlistItem[] = [
  { id: "1", product_name: "Wireless Headphones", seller_name: "Acme Trading Co.", price: 85000, sale_price: 75000, rating: 4.5, review_count: 128, in_stock: true, image: null, added_at: "2025-07-28", category: "Electronics" },
  { id: "2", product_name: "Smart Watch Pro", seller_name: "TechWorld TZ", price: 120000, sale_price: null, rating: 4.8, review_count: 256, in_stock: true, image: null, added_at: "2025-07-25", category: "Electronics" },
  { id: "3", product_name: "Gaming Mouse", seller_name: "Gadget Hub", price: 45000, sale_price: 39000, rating: 4.2, review_count: 89, in_stock: false, image: null, added_at: "2025-07-20", category: "Accessories" },
  { id: "4", product_name: 'HD Monitor 24"', seller_name: "Acme Trading Co.", price: 350000, sale_price: null, rating: 4.7, review_count: 312, in_stock: true, image: null, added_at: "2025-07-15", category: "Electronics" },
  { id: "5", product_name: "Bluetooth Speaker", seller_name: "TechWorld TZ", price: 65000, sale_price: 55000, rating: 4.3, review_count: 167, in_stock: true, image: null, added_at: "2025-07-10", category: "Audio" },
  { id: "6", product_name: "Webcam HD", seller_name: "Gadget Hub", price: 75000, sale_price: null, rating: 4.0, review_count: 54, in_stock: true, image: null, added_at: "2025-07-05", category: "Accessories" },
]

function formatPrice(price: number): string {
  return `TSh ${price.toLocaleString()}`
}

function timeAgo(dateStr: string): string {
  const days = Math.floor((Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24))
  if (days === 0) return "Today"
  if (days === 1) return "Yesterday"
  if (days < 7) return `${days} days ago`
  if (days < 30) return `${Math.floor(days / 7)} weeks ago`
  return `${Math.floor(days / 30)} months ago`
}

const filterTabs = [
  { value: "all", label: "All Items", icon: Heart },
  { value: "in_stock", label: "In Stock", icon: CheckCircle2 },
  { value: "on_sale", label: "On Sale", icon: TrendingDown },
] as const

export default function WishlistPage() {
  const [items, setItems] = React.useState<WishlistItem[]>(mockWishlist)
  const [search, setSearch] = React.useState("")
  const [filter, setFilter] = React.useState<"all" | "in_stock" | "on_sale">("all")
  const [layout, setLayout] = React.useState<"grid" | "list">("grid")

  const filtered = React.useMemo(() => {
    let result = items
    if (search) {
      const term = search.toLowerCase()
      result = result.filter(
        (i) =>
          i.product_name.toLowerCase().includes(term) ||
          i.seller_name.toLowerCase().includes(term) ||
          i.category.toLowerCase().includes(term)
      )
    }
    if (filter === "in_stock") {
      result = result.filter((i) => i.in_stock)
    } else if (filter === "on_sale") {
      result = result.filter((i) => i.sale_price !== null)
    }
    return result
  }, [items, search, filter])

  const stats = React.useMemo(() => {
    const onSale = items.filter((i) => i.sale_price !== null).length
    const inStock = items.filter((i) => i.in_stock).length
    const totalSavings = items.reduce((sum, i) => {
      if (i.sale_price) return sum + (i.price - i.sale_price)
      return sum
    }, 0)
    return { total: items.length, onSale, inStock, totalSavings }
  }, [items])

  const handleRemove = (id: string) => {
    const item = items.find((i) => i.id === id)
    setItems((prev) => prev.filter((i) => i.id !== id))
    toast.add({
      title: "Removed from wishlist",
      description: `${item?.product_name} has been removed.`,
      type: "success",
    })
  }

  const handleAddToCart = (item: WishlistItem) => {
    if (!item.in_stock) {
      toast.add({
        title: "Out of stock",
        description: `${item.product_name} is currently unavailable.`,
        type: "error",
      })
      return
    }
    toast.add({
      title: "Added to cart!",
      description: `${item.product_name} has been added to your cart.`,
      type: "success",
    })
  }

  const handleAddAllToCart = () => {
    const available = filtered.filter((i) => i.in_stock)
    if (available.length === 0) {
      toast.add({
        title: "No items available",
        description: "All items in your wishlist are out of stock.",
        type: "error",
      })
      return
    }
    toast.add({
      title: `${available.length} items added to cart!`,
      description: "All available items have been added.",
      type: "success",
    })
  }

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 md:py-24">
        <div className="flex flex-col items-center gap-6 text-center">
          <div className="flex size-20 items-center justify-center rounded-3xl bg-muted">
            <Heart className="size-10 text-muted-foreground" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold tracking-tight">Your wishlist is empty</h1>
            <p className="text-muted-foreground">
              Save items you love by tapping the heart icon on any product. They'll appear here for easy access.
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
      {/* Header */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10">
              <Heart className="size-5 fill-primary text-primary" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight md:text-3xl">My Wishlist</h1>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            {stats.total} {stats.total === 1 ? "item" : "items"} saved · {stats.inStock} in stock · {stats.onSale} on sale
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={handleAddAllToCart} variant="outline" className="gap-2">
            <ShoppingCart className="size-4" />
            Add All to Cart
          </Button>
        </div>
      </div>

      {/* Stats cards */}
      <div className="mb-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="flex items-center gap-3 rounded-xl border bg-card p-4">
          <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
            <Heart className="size-5 text-primary" />
          </div>
          <div>
            <p className="text-2xl font-bold">{stats.total}</p>
            <p className="text-xs text-muted-foreground">Total Items</p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-xl border bg-card p-4">
          <div className="flex size-10 items-center justify-center rounded-lg bg-green-500/10">
            <CheckCircle2 className="size-5 text-green-600" />
          </div>
          <div>
            <p className="text-2xl font-bold">{stats.inStock}</p>
            <p className="text-xs text-muted-foreground">In Stock</p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-xl border bg-card p-4">
          <div className="flex size-10 items-center justify-center rounded-lg bg-amber-500/10">
            <TrendingDown className="size-5 text-amber-600" />
          </div>
          <div>
            <p className="text-2xl font-bold">{stats.onSale}</p>
            <p className="text-xs text-muted-foreground">On Sale</p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-xl border bg-card p-4">
          <div className="flex size-10 items-center justify-center rounded-lg bg-green-500/10">
            <Sparkles className="size-5 text-green-600" />
          </div>
          <div>
            <p className="text-2xl font-bold">{formatPrice(stats.totalSavings)}</p>
            <p className="text-xs text-muted-foreground">Total Savings</p>
          </div>
        </div>
      </div>

      {/* Filters bar */}
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
          {/* Search */}
          <div className="relative flex-1 sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search wishlist..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          {/* Filter tabs */}
          <div className="flex items-center gap-1 rounded-lg border bg-card p-1">
            {filterTabs.map((tab) => (
              <button
                key={tab.value}
                onClick={() => setFilter(tab.value)}
                className={cn(
                  "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                  filter === tab.value
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <tab.icon className="size-3.5" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">{filtered.length} results</span>
          {/* Layout toggle */}
          <div className="flex items-center gap-1 rounded-lg border bg-card p-1">
            <button
              onClick={() => setLayout("grid")}
              className={cn(
                "flex size-7 items-center justify-center rounded-md transition-colors",
                layout === "grid" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
              )}
              title="Grid view"
            >
              <div className="grid grid-cols-2 gap-0.5">
                <div className="size-1.5 rounded-sm bg-current" />
                <div className="size-1.5 rounded-sm bg-current" />
                <div className="size-1.5 rounded-sm bg-current" />
                <div className="size-1.5 rounded-sm bg-current" />
              </div>
            </button>
            <button
              onClick={() => setLayout("list")}
              className={cn(
                "flex size-7 items-center justify-center rounded-md transition-colors",
                layout === "list" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
              )}
              title="List view"
            >
              <div className="flex flex-col gap-0.5">
                <div className="h-1 w-3.5 rounded-sm bg-current" />
                <div className="h-1 w-3.5 rounded-sm bg-current" />
                <div className="h-1 w-3.5 rounded-sm bg-current" />
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Wishlist items */}
      {filtered.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
            <Search className="size-10 text-muted-foreground" />
            <p className="text-sm font-medium">No items match your search</p>
            <p className="text-sm text-muted-foreground">Try adjusting your filters or search term.</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSearch("")
                setFilter("all")
              }}
            >
              Clear filters
            </Button>
          </CardContent>
        </Card>
      ) : layout === "grid" ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((item) => (
            <Card key={item.id} className="group overflow-hidden p-0 transition-all hover:shadow-md">
              {/* Image */}
              <div className="relative aspect-square overflow-hidden bg-muted">
                {item.image ? (
                  <img
                    src={item.image}
                    alt={item.product_name}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <Package className="size-12 text-muted-foreground/50" />
                  </div>
                )}
                {/* Badges */}
                <div className="absolute left-2 top-2 flex flex-col gap-1.5">
                  {item.sale_price && (
                    <Badge className="bg-primary text-primary-foreground">
                      -{Math.round(((item.price - item.sale_price) / item.price) * 100)}%
                    </Badge>
                  )}
                  {!item.in_stock && (
                    <Badge variant="destructive">Out of Stock</Badge>
                  )}
                </div>
                {/* Remove button */}
                <button
                  onClick={() => handleRemove(item.id)}
                  className="absolute right-2 top-2 flex size-8 items-center justify-center rounded-full bg-background/80 backdrop-blur transition-colors hover:bg-destructive hover:text-destructive-foreground"
                  title="Remove from wishlist"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>

              {/* Content */}
              <div className="flex flex-col gap-2 p-3">
                <div>
                  <Badge variant="secondary" className="mb-1.5 text-xs">{item.category}</Badge>
                  <h3 className="line-clamp-1 text-sm font-medium">{item.product_name}</h3>
                  <p className="text-xs text-muted-foreground">by {item.seller_name}</p>
                </div>

                {/* Rating */}
                <div className="flex items-center gap-1">
                  <Star className="size-3 fill-yellow-400 text-yellow-400" />
                  <span className="text-xs font-medium">{item.rating}</span>
                  <span className="text-xs text-muted-foreground">({item.review_count})</span>
                </div>

                {/* Price */}
                <div className="flex items-center gap-2">
                  {item.sale_price ? (
                    <>
                      <span className="font-bold text-primary">{formatPrice(item.sale_price)}</span>
                      <span className="text-xs text-muted-foreground line-through">{formatPrice(item.price)}</span>
                    </>
                  ) : (
                    <span className="font-bold text-primary">{formatPrice(item.price)}</span>
                  )}
                </div>

                {/* Action */}
                <Button
                  size="sm"
                  className="mt-1 w-full gap-1.5"
                  onClick={() => handleAddToCart(item)}
                  disabled={!item.in_stock}
                >
                  <ShoppingCart className="size-3.5" />
                  {item.in_stock ? "Add to Cart" : "Unavailable"}
                </Button>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map((item) => (
            <Card key={item.id} className="transition-all hover:shadow-sm">
              <CardContent className="flex items-center gap-4 p-4">
                {/* Image */}
                <div className="relative size-20 shrink-0 overflow-hidden rounded-lg bg-muted">
                  {item.image ? (
                    <img src={item.image} alt={item.product_name} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <Package className="size-8 text-muted-foreground/50" />
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs">{item.category}</Badge>
                    {item.sale_price && (
                      <Badge className="bg-primary text-xs text-primary-foreground">
                        -{Math.round(((item.price - item.sale_price) / item.price) * 100)}%
                      </Badge>
                    )}
                    {!item.in_stock && (
                      <Badge variant="destructive" className="text-xs">Out of Stock</Badge>
                    )}
                  </div>
                  <h3 className="line-clamp-1 text-sm font-medium">{item.product_name}</h3>
                  <p className="text-xs text-muted-foreground">by {item.seller_name}</p>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1">
                      <Star className="size-3 fill-yellow-400 text-yellow-400" />
                      <span className="text-xs font-medium">{item.rating}</span>
                      <span className="text-xs text-muted-foreground">({item.review_count})</span>
                    </div>
                    <span className="text-xs text-muted-foreground">Added {timeAgo(item.added_at)}</span>
                  </div>
                </div>

                {/* Price */}
                <div className="hidden shrink-0 flex-col items-end gap-0.5 sm:flex">
                  {item.sale_price ? (
                    <>
                      <span className="font-bold text-primary">{formatPrice(item.sale_price)}</span>
                      <span className="text-xs text-muted-foreground line-through">{formatPrice(item.price)}</span>
                    </>
                  ) : (
                    <span className="font-bold text-primary">{formatPrice(item.price)}</span>
                  )}
                </div>

                {/* Actions */}
                <div className="flex shrink-0 items-center gap-2">
                  <Button
                    size="sm"
                    className="gap-1.5"
                    onClick={() => handleAddToCart(item)}
                    disabled={!item.in_stock}
                  >
                    <ShoppingCart className="size-3.5" />
                    <span className="hidden sm:inline">{item.in_stock ? "Add to Cart" : "Unavailable"}</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemove(item.id)}
                    className="text-muted-foreground hover:text-destructive"
                    title="Remove"
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Footer CTA */}
      {filtered.length > 0 && (
        <div className="mt-12 flex flex-col items-center gap-4 rounded-2xl border bg-muted/30 p-8 text-center">
          <p className="text-sm text-muted-foreground">
            Looking for more items to add to your wishlist?
          </p>
          <Link href="/products" className={cn(buttonVariants({ variant: "outline" }), "gap-2")}>
            Continue Shopping
            <ArrowRight className="size-4" />
          </Link>
        </div>
      )}
    </div>
  )
}
