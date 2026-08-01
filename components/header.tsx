"use client"

import Link from "next/link"
import { useState } from "react"
import { Button, buttonVariants } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
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
  X,
  TrendingUp,
  Tag,
  Headphones,
  Truck,
} from "lucide-react"
import { categories } from "@/lib/mock-data"
import * as Icons from "lucide-react"
import { cn } from "@/lib/utils"

export function Header() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)

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
      <div className="mx-auto flex max-w-7xl items-center gap-2 px-3 py-2.5 md:gap-6 md:px-4 md:py-3">
        {/* Mobile menu button */}
        <button
          onClick={() => setMobileOpen(true)}
          className="flex size-10 shrink-0 items-center justify-center rounded-lg text-foreground hover:bg-muted md:hidden"
        >
          <Menu className="size-5" />
        </button>

        {/* Logo */}
        <Link href="/" className="flex shrink-0 items-center gap-2">
          <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Store className="size-5" />
          </div>
          <span className="text-base font-bold tracking-tight sm:text-lg">
            Xerin<span className="text-primary">Market</span>
          </span>
        </Link>

        {/* Search - desktop only */}
        <div className="relative hidden max-w-xl flex-1 md:block">
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

        {/* Mobile search icon */}
        <button
          onClick={() => setSearchOpen(true)}
          className="flex size-10 shrink-0 items-center justify-center rounded-lg text-foreground hover:bg-muted md:hidden"
        >
          <Search className="size-5" />
        </button>

        {/* Actions */}
        <div className="ml-auto flex items-center gap-0.5 md:gap-2">
          <Link
            href="/wishlist"
            className={cn(buttonVariants({ variant: "ghost", size: "icon" }), "relative shrink-0")}
          >
            <Heart className="size-5" />
            <Badge className="absolute -right-0.5 -top-0.5 size-4 justify-center p-0 text-[10px]">
              3
            </Badge>
          </Link>
          <Link
            href="/cart"
            className={cn(buttonVariants({ variant: "ghost", size: "icon" }), "relative shrink-0")}
          >
            <ShoppingCart className="size-5" />
            <Badge className="absolute -right-0.5 -top-0.5 size-4 justify-center p-0 text-[10px]">
              2
            </Badge>
          </Link>
          <Link
            href="/login"
            className={cn(buttonVariants({ variant: "ghost", size: "icon" }), "hidden md:flex")}
          >
            <User className="size-5" />
          </Link>
          <Link
            href="/login"
            className={cn(buttonVariants({ size: "sm" }), "hidden md:flex")}
          >
            Sign In
          </Link>
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
            Hot Deals
          </Link>
        </div>
      </nav>

      {/* Mobile drawer overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-[60] md:hidden">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <div
            className="absolute left-0 top-0 h-full w-[85%] max-w-[340px] overflow-y-auto bg-background shadow-2xl"
            style={{ paddingBottom: "calc(1rem + env(safe-area-inset-bottom))" }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drawer header */}
            <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-background p-4">
              <div className="flex items-center gap-2">
                <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <Store className="size-5" />
                </div>
                <span className="text-lg font-bold tracking-tight">
                  Xerin<span className="text-primary">Market</span>
                </span>
              </div>
              <button
                onClick={() => setMobileOpen(false)}
                className="flex size-9 items-center justify-center rounded-lg hover:bg-muted"
              >
                <X className="size-5" />
              </button>
            </div>

            {/* Drawer content */}
            <div className="p-3">
              {/* Quick links */}
              <Link
                href="/"
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-3 rounded-lg px-3 py-3.5 text-sm font-medium hover:bg-muted"
              >
                <Home className="size-5 text-primary" /> Home
              </Link>
              <Link
                href="/products"
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-3 rounded-lg px-3 py-3.5 text-sm font-medium hover:bg-muted"
              >
                <Package className="size-5 text-primary" /> All Products
              </Link>
              <Link
                href="/deals"
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-3 rounded-lg px-3 py-3.5 text-sm font-medium hover:bg-muted"
              >
                <Tag className="size-5 text-primary" /> Hot Deals
              </Link>
              <Link
                href="/track-order"
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-3 rounded-lg px-3 py-3.5 text-sm font-medium hover:bg-muted"
              >
                <Truck className="size-5 text-primary" /> Track Order
              </Link>
              <Link
                href="/help"
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-3 rounded-lg px-3 py-3.5 text-sm font-medium hover:bg-muted"
              >
                <Headphones className="size-5 text-primary" /> Help Center
              </Link>

              {/* Divider */}
              <div className="my-3 h-px bg-border" />

              {/* Categories */}
              <p className="px-3 pb-2 pt-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Categories
              </p>
              {categories.map((cat) => {
                const Icon = (Icons as any)[cat.icon] || Icons.Package
                return (
                  <Link
                    key={cat.id}
                    href={`/products?category=${cat.id}`}
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center justify-between rounded-lg px-3 py-3 text-sm hover:bg-muted"
                  >
                    <span className="flex items-center gap-3">
                      <Icon className="size-4" /> {cat.name}
                    </span>
                    <ChevronRight className="size-4 text-muted-foreground" />
                  </Link>
                )
              })}

              {/* Divider */}
              <div className="my-3 h-px bg-border" />

              {/* Account */}
              <Link
                href="/login"
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-3 rounded-lg px-3 py-3.5 text-sm font-medium hover:bg-muted"
              >
                <User className="size-5 text-primary" /> Sign In / Register
              </Link>
              <Link
                href="/seller"
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-3 rounded-lg px-3 py-3.5 text-sm font-medium hover:bg-muted"
              >
                <TrendingUp className="size-5 text-primary" /> Become a Seller
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Mobile search popup overlay */}
      {searchOpen && (
        <div className="fixed inset-0 z-[60] md:hidden">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setSearchOpen(false)}
          />
          <div
            className="absolute left-0 right-0 top-0 bg-background shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Search header */}
            <div className="flex items-center gap-2 border-b p-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search products, brands..."
                  className="pl-9"
                  autoFocus
                />
              </div>
              <button
                onClick={() => setSearchOpen(false)}
                className="flex size-10 shrink-0 items-center justify-center rounded-lg hover:bg-muted"
              >
                <X className="size-5" />
              </button>
            </div>

            {/* Search suggestions */}
            <div className="p-4">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Popular Searches
              </p>
              <div className="flex flex-wrap gap-2">
                {["iPhone", "Samsung", "Headphones", "Shoes", "Watch", "Laptop"].map(
                  (term) => (
                    <Link
                      key={term}
                      href={`/products?q=${term.toLowerCase()}`}
                      onClick={() => setSearchOpen(false)}
                      className="rounded-full border px-3 py-1.5 text-sm text-muted-foreground hover:border-primary hover:text-primary"
                    >
                      {term}
                    </Link>
                  )
                )}
              </div>

              <p className="mb-3 mt-5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Trending Categories
              </p>
              <div className="flex flex-col gap-1">
                {categories.slice(0, 4).map((cat) => {
                  const Icon = (Icons as any)[cat.icon] || Icons.Package
                  return (
                    <Link
                      key={cat.id}
                      href={`/products?category=${cat.id}`}
                      onClick={() => setSearchOpen(false)}
                      className="flex items-center gap-3 rounded-lg px-2 py-2.5 text-sm hover:bg-muted"
                    >
                      <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <Icon className="size-4" />
                      </div>
                      {cat.name}
                    </Link>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
