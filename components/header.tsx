"use client"

import Link from "next/link"
import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button, buttonVariants } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  ShoppingCart,
  Search,
  Menu,
  Heart,
  User,
  Package,
  Home,
  ChevronRight,
  X,
  TrendingUp,
  Tag,
  Headphones,
  Truck,
  LogOut,
  Settings,
  LayoutDashboard,
  Store,
} from "lucide-react"
import { categories as mockCategories } from "@/lib/mock-data"
import * as Icons from "lucide-react"
import { cn } from "@/lib/utils"
import { useAuth } from "@/lib/auth-context"
import { api } from "@/lib/api"
import { ModeToggle } from "@/components/mode-toggle"

export function Header() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [cartCount, setCartCount] = useState(0)
  const profileRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const { user, isAuthenticated, logout } = useAuth()

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  useEffect(() => {
    if (isAuthenticated) {
      api.get<{ items: { id: string; quantity: number }[] }>("/cart")
        .then((data) => {
          setCartCount(data.items?.reduce((sum, item) => sum + item.quantity, 0) ?? 0)
        })
        .catch(() => {})
    }
  }, [isAuthenticated])

  const handleLogout = async () => {
    await logout()
    setProfileOpen(false)
    router.push("/")
  }

  const userInitials = user ? `${user.first_name?.[0] ?? ""}${user.last_name?.[0] ?? ""}`.toUpperCase() : ""

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      {/* Top bar */}
      <div className="hidden bg-primary text-primary-foreground md:block">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-1.5 text-xs">
          <p>Free shipping on orders over TSh 50,000</p>
          <div className="flex items-center gap-4">
            <Link href="/auth?tab=seller" className="hover:underline">
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
          <img
            src="/apple-touch-icon.png"
            alt="XerinMarket"
            className="size-9 rounded-lg object-cover"
          />
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
          <ModeToggle />
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
            {cartCount > 0 && (
              <Badge className="absolute -right-0.5 -top-0.5 size-4 justify-center p-0 text-[10px]">
                {cartCount}
              </Badge>
            )}
          </Link>
          {isAuthenticated && user ? (
            <div className="relative" ref={profileRef}>
              <button
                onClick={() => setProfileOpen(!profileOpen)}
                className="flex items-center gap-2 rounded-full p-0.5 transition-colors hover:bg-muted"
              >
                <div className="flex size-8 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                  {userInitials || <User className="size-4" />}
                </div>
              </button>
              {profileOpen && (
                <div className="absolute right-0 top-full mt-2 w-64 rounded-xl border bg-background shadow-lg z-50">
                  <div className="flex items-center gap-3 border-b p-4">
                    <div className="flex size-10 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                      {userInitials || <User className="size-5" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{user.first_name} {user.last_name}</p>
                      <p className="truncate text-xs text-muted-foreground">{user.email}</p>
                    </div>
                  </div>
                  <div className="flex flex-col p-2">
                    {user.is_seller && (
                      <Link
                        href="/dashboard/seller"
                        onClick={() => setProfileOpen(false)}
                        className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm hover:bg-muted"
                      >
                        <Store className="size-4 text-muted-foreground" />
                        Seller Dashboard
                      </Link>
                    )}
                    {(user.account_type === "admin" || user.account_type === "super_admin") && (
                      <Link
                        href="/dashboard/admin"
                        onClick={() => setProfileOpen(false)}
                        className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm hover:bg-muted"
                      >
                        <LayoutDashboard className="size-4 text-muted-foreground" />
                        Admin Panel
                      </Link>
                    )}
                    <Link
                      href="/dashboard/user"
                      onClick={() => setProfileOpen(false)}
                      className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm hover:bg-muted"
                    >
                      <Package className="size-4 text-muted-foreground" />
                      My Dashboard
                    </Link>
                    <Link
                      href="/dashboard/user/settings"
                      onClick={() => setProfileOpen(false)}
                      className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm hover:bg-muted"
                    >
                      <Settings className="size-4 text-muted-foreground" />
                      Settings
                    </Link>
                    <div className="my-1 h-px bg-border" />
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-red-500 hover:bg-red-50"
                    >
                      <LogOut className="size-4" />
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <>
              <Link
                href="/auth"
                className={cn(buttonVariants({ variant: "ghost", size: "icon" }), "hidden md:flex")}
              >
                <User className="size-5" />
              </Link>
              <Link
                href="/auth"
                className={cn(buttonVariants({ size: "sm" }), "hidden md:flex")}
              >
                Sign In
              </Link>
            </>
          )}
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
          {mockCategories.slice(0, 7).map((cat) => (
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
            className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={() => setMobileOpen(false)}
          />
          <div
            className="absolute left-0 top-0 h-full w-[88%] max-w-[360px] overflow-y-auto bg-background shadow-2xl animate-in slide-in-from-left duration-300"
            style={{ paddingBottom: "calc(1rem + env(safe-area-inset-bottom))" }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drawer header with gradient */}
            <div className="relative bg-gradient-to-br from-primary to-primary/80 px-5 pb-5 pt-6 text-primary-foreground">
              <button
                onClick={() => setMobileOpen(false)}
                className="absolute right-3 top-3 flex size-9 items-center justify-center rounded-lg bg-white/10 hover:bg-white/20"
              >
                <X className="size-5" />
              </button>
              <div className="flex items-center gap-3">
                <img
                  src="/apple-touch-icon.png"
                  alt="XerinMarket"
                  className="size-12 rounded-xl object-cover ring-2 ring-white/20"
                />
                <div>
                  <p className="text-xl font-bold leading-tight">
                    XerinMarket
                  </p>
                  <p className="text-xs text-primary-foreground/70">
                    Buy & Sell with confidence
                  </p>
                </div>
              </div>
            </div>

            {/* Drawer content */}
            <div className="p-3">
              {/* Quick links */}
              <p className="px-3 pb-2 pt-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Menu
              </p>
              {[
                { href: "/", label: "Home", icon: Home },
                { href: "/products", label: "All Products", icon: Package },
                { href: "/deals", label: "Hot Deals", icon: Tag },
                { href: "/track-order", label: "Track Order", icon: Truck },
                { href: "/help", label: "Help Center", icon: Headphones },
              ].map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-colors hover:bg-muted active:scale-[0.98]"
                >
                  <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <item.icon className="size-4.5" />
                  </div>
                  {item.label}
                </Link>
              ))}

              {/* Divider */}
              <div className="my-3 h-px bg-border" />

              {/* Categories */}
              <p className="px-3 pb-2 pt-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Categories
              </p>
              {mockCategories.map((cat) => {
                const Icon = (Icons as any)[cat.icon] || Icons.Package
                return (
                  <Link
                    key={cat.id}
                    href={`/products?category=${cat.id}`}
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center justify-between rounded-xl px-3 py-2.5 text-sm transition-colors hover:bg-muted active:scale-[0.98]"
                  >
                    <span className="flex items-center gap-3">
                      <div className="flex size-8 items-center justify-center rounded-lg bg-muted text-foreground">
                        <Icon className="size-4" />
                      </div>
                      {cat.name}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">{cat.productCount}</span>
                      <ChevronRight className="size-4 text-muted-foreground" />
                    </div>
                  </Link>
                )
              })}

              {/* Divider */}
              <div className="my-3 h-px bg-border" />

              {/* Account */}
              <p className="px-3 pb-2 pt-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Account
              </p>
              {isAuthenticated && user ? (
                <>
                  <Link
                    href="/dashboard/user"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-colors hover:bg-muted active:scale-[0.98]"
                  >
                    <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <User className="size-4.5" />
                    </div>
                    My Dashboard
                  </Link>
                  {user.is_seller && (
                    <Link
                      href="/dashboard/seller"
                      onClick={() => setMobileOpen(false)}
                      className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-colors hover:bg-muted active:scale-[0.98]"
                    >
                      <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <Store className="size-4.5" />
                      </div>
                      Seller Dashboard
                    </Link>
                  )}
                  {(user.account_type === "admin" || user.account_type === "super_admin") && (
                    <Link
                      href="/dashboard/admin"
                      onClick={() => setMobileOpen(false)}
                      className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-colors hover:bg-muted active:scale-[0.98]"
                    >
                      <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <LayoutDashboard className="size-4.5" />
                      </div>
                      Admin Panel
                    </Link>
                  )}
                  <button
                    onClick={handleLogout}
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-red-500 transition-colors hover:bg-red-50 active:scale-[0.98]"
                  >
                    <div className="flex size-9 items-center justify-center rounded-lg bg-red-50 text-red-500">
                      <LogOut className="size-4.5" />
                    </div>
                    Sign Out
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/auth"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-colors hover:bg-muted active:scale-[0.98]"
                  >
                    <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <User className="size-4.5" />
                    </div>
                    Sign In / Register
                  </Link>
                  <Link
                    href="/auth?tab=seller"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-colors hover:bg-muted active:scale-[0.98]"
                  >
                    <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <TrendingUp className="size-4.5" />
                    </div>
                    Become a Seller
                  </Link>
                </>
              )}
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
                {mockCategories.slice(0, 4).map((cat) => {
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
