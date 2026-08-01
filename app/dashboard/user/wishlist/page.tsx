"use client"

import * as React from "react"
import {
  Card,
  CardContent,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "@/components/ui/toast"
import {
  Search,
  Heart,
  ShoppingCart,
  Trash2,
  Package,
  Star,
} from "lucide-react"

type WishlistItem = {
  id: string
  product_name: string
  seller_name: string
  price: number
  sale_price: number | null
  rating: number
  in_stock: boolean
  image: string | null
  added_at: string
}

const mockWishlist: WishlistItem[] = [
  { id: "1", product_name: "Wireless Headphones", seller_name: "Acme Trading Co.", price: 85000, sale_price: 75000, rating: 4.5, in_stock: true, image: null, added_at: "2025-07-28" },
  { id: "2", product_name: "Smart Watch Pro", seller_name: "TechWorld TZ", price: 120000, sale_price: null, rating: 4.8, in_stock: true, image: null, added_at: "2025-07-25" },
  { id: "3", product_name: "Gaming Mouse", seller_name: "Gadget Hub", price: 45000, sale_price: 39000, rating: 4.2, in_stock: false, image: null, added_at: "2025-07-20" },
  { id: "4", product_name: "HD Monitor 24\"", seller_name: "Acme Trading Co.", price: 350000, sale_price: null, rating: 4.7, in_stock: true, image: null, added_at: "2025-07-15" },
  { id: "5", product_name: "Bluetooth Speaker", seller_name: "TechWorld TZ", price: 65000, sale_price: 55000, rating: 4.3, in_stock: true, image: null, added_at: "2025-07-10" },
  { id: "6", product_name: "Webcam HD", seller_name: "Gadget Hub", price: 75000, sale_price: null, rating: 4.0, in_stock: true, image: null, added_at: "2025-07-05" },
]

function formatPrice(price: number): string {
  return `TSh ${price.toLocaleString()}`
}

export default function UserWishlistPage() {
  const [items, setItems] = React.useState<WishlistItem[]>(mockWishlist)
  const [search, setSearch] = React.useState("")
  const [filter, setFilter] = React.useState<"all" | "in_stock" | "on_sale">("all")

  const filtered = React.useMemo(() => {
    let result = items
    if (search) {
      const term = search.toLowerCase()
      result = result.filter((i) => i.product_name.toLowerCase().includes(term) || i.seller_name.toLowerCase().includes(term))
    }
    if (filter === "in_stock") {
      result = result.filter((i) => i.in_stock)
    } else if (filter === "on_sale") {
      result = result.filter((i) => i.sale_price !== null)
    }
    return result
  }, [items, search, filter])

  const handleRemove = (id: string) => {
    const item = items.find((i) => i.id === id)
    setItems((prev) => prev.filter((i) => i.id !== id))
    toast.add({ title: "Removed from wishlist", description: `${item?.product_name} has been removed.`, type: "success" })
  }

  const handleAddToCart = (item: WishlistItem) => {
    if (!item.in_stock) {
      toast.add({ title: "Out of stock", description: `${item.product_name} is currently unavailable.`, type: "error" })
      return
    }
    toast.add({ title: "Added to cart!", description: `${item.product_name} has been added to your cart.`, type: "success" })
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">My Wishlist</h2>
        <p className="text-sm text-muted-foreground">Save items you love and buy them later.</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 gap-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search wishlist..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          </div>
          <select value={filter} onChange={(e) => setFilter(e.target.value as "all" | "in_stock" | "on_sale")} className="h-9 rounded-md border border-input bg-background px-3 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring">
            <option value="all">All Items</option>
            <option value="in_stock">In Stock</option>
            <option value="on_sale">On Sale</option>
          </select>
        </div>
        <div className="text-sm text-muted-foreground">{filtered.length} items</div>
      </div>

      {/* Wishlist Grid */}
      {filtered.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <Heart className="mx-auto size-12 text-muted-foreground" />
            <p className="mt-4 text-sm text-muted-foreground">Your wishlist is empty. Start adding items you love!</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((item) => (
            <Card key={item.id} className="overflow-hidden">
              <CardContent className="p-4">
                {/* Product Image Placeholder */}
                <div className="mb-3 flex aspect-square items-center justify-center rounded-lg bg-muted">
                  {item.image ? (
                    <img src={item.image} alt={item.product_name} className="size-full rounded-lg object-cover" />
                  ) : (
                    <Package className="size-12 text-muted-foreground" />
                  )}
                </div>

                {/* Product Info */}
                <div className="space-y-2">
                  <div>
                    <h3 className="font-medium text-sm line-clamp-1">{item.product_name}</h3>
                    <p className="text-xs text-muted-foreground">{item.seller_name}</p>
                  </div>

                  {/* Rating */}
                  <div className="flex items-center gap-1">
                    <Star className="size-3 fill-yellow-400 text-yellow-400" />
                    <span className="text-xs font-medium">{item.rating}</span>
                  </div>

                  {/* Price */}
                  <div className="flex items-center gap-2">
                    {item.sale_price ? (
                      <>
                        <span className="font-bold text-sm">{formatPrice(item.sale_price)}</span>
                        <span className="text-xs text-muted-foreground line-through">{formatPrice(item.price)}</span>
                        <Badge variant="destructive" className="text-xs">Sale</Badge>
                      </>
                    ) : (
                      <span className="font-bold text-sm">{formatPrice(item.price)}</span>
                    )}
                  </div>

                  {/* Stock Status */}
                  {!item.in_stock && (
                    <Badge variant="destructive" className="text-xs">Out of Stock</Badge>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2 pt-2">
                    <Button
                      size="sm"
                      className="flex-1"
                      onClick={() => handleAddToCart(item)}
                      disabled={!item.in_stock}
                    >
                      <ShoppingCart className="size-3" />
                      Add to Cart
                    </Button>
                    <Button variant="ghost" size="icon-sm" onClick={() => handleRemove(item.id)} className="text-red-500" title="Remove">
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
