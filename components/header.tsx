"use client"

import Link from "next/link"
import { useState } from "react"
import { Button, buttonVariants } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import {
  ShoppingCart,
  Search,
  Menu,
  Heart,
  User,
  Store,
  Package,
  Home,
  ChevronRight,
} from "lucide-react"
import { categories } from "@/lib/mock-data"
import * as Icons from "lucide-react"

export function Header() {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      {/* Top bar */}
      <div className="hidden bg-primary text-primary-foreground md:block">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-1.5 text-xs">
          <p>Free shipping on orders over TSh 50,000</p>
          <div className="flex items-center gap-4">
            <Link href="/seller" className="hover:underline">
              Become a Seller
            </Link>
            <Link href="/track-order" className="hover:underline">
              Track Order
            </Link>
            <Link href="/help" className="hover:underline">
              Help
            </Link>
          </div>
        </div>
      </div>

      {/* Main header */}
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3 md:gap-6">
        {/* Mobile menu */}
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="md:hidden">
              <Menu className="size-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-80">
            <SheetHeader>
              <SheetTitle className="flex items-center gap-2">
                <div className="flex size-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <Store className="size-4" />
                </div>
                XerinMarket
              </SheetTitle>
            </SheetHeader>
            <nav className="mt-6 flex flex-col gap-1">
              <Link
                href="/"
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium hover:bg-muted"
              >
                <Home className="size-4" /> Home
              </Link>
              <Link
                href="/products"
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium hover:bg-muted"
              >
                <Package className="size-4" /> All Products
              </Link>
              <div className="px-3 pt-4 pb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Categories
              </div>
              {categories.map((cat) => {
                const Icon = (Icons as any)[cat.icon] || Icons.Package
                return (
                  <Link
                    key={cat.id}
                    href={`/products?category=${cat.id}`}
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center justify-between rounded-lg px-3 py-2.5 text-sm hover:bg-muted"
                  >
                    <span className="flex items-center gap-3">
                      <Icon className="size-4" /> {cat.name}
                    </span>
                    <ChevronRight className="size-4 text-muted-foreground" />
                  </Link>
                )
              })}
            </nav>
          </SheetContent>
        </Sheet>

        {/* Logo */}
        <Link href="/" className="flex shrink-0 items-center gap-2">
          <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Store className="size-5" />
          </div>
          <span className="hidden text-lg font-bold tracking-tight sm:block">
            Xerin<span className="text-primary">Market</span>
          </span>
        </Link>

        {/* Search */}
        <div className="relative flex-1 max-w-xl">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search products, brands and categories..."
            className="pl-9 pr-20"
          />
          <Button
            size="sm"
            className="absolute right-1 top-1/2 -translate-y-1/2"
          >
            Search
          </Button>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 md:gap-2">
          <Button variant="ghost" size="icon" className="relative" asChild>
            <Link href="/wishlist">
              <Heart className="size-5" />
              <Badge className="absolute -right-0.5 -top-0.5 size-4 justify-center p-0 text-[10px]">
                3
              </Badge>
            </Link>
          </Button>
          <Button variant="ghost" size="icon" className="relative" asChild>
            <Link href="/cart">
              <ShoppingCart className="size-5" />
              <Badge className="absolute -right-0.5 -top-0.5 size-4 justify-center p-0 text-[10px]">
                2
              </Badge>
            </Link>
          </Button>
          <Button variant="ghost" size="icon" className="hidden md:flex" asChild>
            <Link href="/login">
              <User className="size-5" />
            </Link>
          </Button>
          <Button size="sm" className="hidden md:flex" asChild>
            <Link href="/login">Sign In</Link>
          </Button>
        </div>
      </div>

      {/* Category nav - desktop */}
      <nav className="hidden border-t md:block">
        <div className="mx-auto flex max-w-7xl items-center gap-1 px-4 py-2">
          <Link
            href="/products"
            className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium hover:bg-muted"
          >
            <Menu className="size-4" /> All Categories
          </Link>
          {categories.slice(0, 7).map((cat) => (
            <Link
              key={cat.id}
              href={`/products?category=${cat.id}`}
              className="rounded-md px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              {cat.name}
            </Link>
          ))}
          <Link
            href="/deals"
            className="ml-auto rounded-md bg-primary/10 px-3 py-1.5 text-sm font-medium text-primary hover:bg-primary/20"
          >
            🔥 Hot Deals
          </Link>
        </div>
      </nav>
    </header>
  )
}
