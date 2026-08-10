"use client"

import Link from "next/link"
import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
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
  Package,
  Home,
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
import { cn } from "@/lib/utils"
import { useAuth } from "@/lib/auth-context"
import { useCart } from "@/lib/cart-context"
import { useWishlist } from "@/lib/wishlist-context"
import { ModeToggle } from "@/components/mode-toggle"

export function Header() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const profileRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const { user, isAuthenticated, logout } = useAuth()
  const { count: cartCount } = useCart()
  const { count: wishlistCount } = useWishlist()

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

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
          <p>Tanzania's Trusted Online Marketplace — Shop Local. Connect Globally.</p>
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
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger
            render={
              <button
                className="flex size-10 shrink-0 items-center justify-center rounded-lg text-foreground hover:bg-muted md:hidden"
              >
                <Menu className="size-5" />
              </button>
            }
          />
          <SheetContent side="left" className="p-0 border-none w-[85%] max-w-[320px]">
            <SheetHeader className="sr-only">
              <SheetTitle>Navigation Menu</SheetTitle>
            </SheetHeader>
            <div className="flex flex-col h-full bg-background">
              {/* Drawer header - Plain & Clean */}
              <div className="px-6 pb-6 pt-12 border-b">
                <div className="flex items-center gap-3">
                  <img
                    src="/apple-touch-icon.png"
                    alt="XerinMarket"
                    className="size-10 rounded-lg object-cover"
                  />
                  <div>
                    <p className="text-lg font-bold tracking-tight">
                      Xerin<span className="text-primary">Market</span>
                    </p>
                    <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium">
                      Shop Local. Connect Globally.
                    </p>
                  </div>
                </div>
              </div>

              {/* Drawer content */}
              <div className="flex-1 overflow-y-auto px-4 py-6">
                {/* Quick links */}
                <p className="px-2 pb-3 text-[11px] font-bold uppercase tracking-wider text-muted-foreground/60">
                  Main Menu
                </p>
                <div className="space-y-1">
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
                      className="flex items-center gap-4 rounded-lg px-3 py-3 text-sm font-medium transition-all hover:bg-muted active:bg-muted"
                    >
                      <item.icon className="size-5 text-muted-foreground" strokeWidth={1.5} />
                      {item.label}
                    </Link>
                  ))}
                </div>

                <div className="my-6 h-px bg-border/60 mx-2" />

                {/* Account */}
                <p className="px-2 pb-3 text-[11px] font-bold uppercase tracking-wider text-muted-foreground/60">
                  Personal Space
                </p>
                <div className="space-y-1">
                  {isAuthenticated && user ? (
                    <>
                      <Link
                        href="/dashboard/user"
                        onClick={() => setMobileOpen(false)}
                        className="flex items-center gap-4 rounded-lg px-3 py-3 text-sm font-medium transition-all hover:bg-muted active:bg-muted"
                      >
                        <User className="size-5 text-muted-foreground" strokeWidth={1.5} />
                        My Dashboard
                      </Link>
                      {user.is_seller && (
                        <Link
                          href="/dashboard/seller"
                          onClick={() => setMobileOpen(false)}
                          className="flex items-center gap-4 rounded-lg px-3 py-3 text-sm font-medium transition-all hover:bg-muted active:bg-muted"
                        >
                          <Store className="size-5 text-muted-foreground" strokeWidth={1.5} />
                          Seller Dashboard
                        </Link>
                      )}
                      {(user.account_type === "admin" || user.account_type === "super_admin") && (
                        <Link
                          href="/dashboard/admin"
                          onClick={() => setMobileOpen(false)}
                          className="flex items-center gap-4 rounded-lg px-3 py-3 text-sm font-medium transition-all hover:bg-muted active:bg-muted"
                        >
                          <LayoutDashboard className="size-5 text-muted-foreground" strokeWidth={1.5} />
                          Admin Panel
                        </Link>
                      )}
                      <button
                        onClick={handleLogout}
                        className="flex w-full items-center gap-4 rounded-lg px-3 py-3 text-sm font-medium text-red-500 transition-all hover:bg-red-50 active:bg-red-50"
                      >
                        <LogOut className="size-5" strokeWidth={1.5} />
                        Sign Out
                      </button>
                    </>
                  ) : (
                    <>
                      <Link
                        href="/auth"
                        onClick={() => setMobileOpen(false)}
                        className="flex items-center gap-4 rounded-lg px-3 py-3 text-sm font-medium transition-all hover:bg-muted active:bg-muted"
                      >
                        <User className="size-5 text-muted-foreground" strokeWidth={1.5} />
                        Sign In / Register
                      </Link>
                      <Link
                        href="/auth?tab=seller"
                        onClick={() => setMobileOpen(false)}
                        className="flex items-center gap-4 rounded-lg px-3 py-3 text-sm font-medium transition-all hover:bg-muted active:bg-muted"
                      >
                        <TrendingUp className="size-5 text-muted-foreground" strokeWidth={1.5} />
                        Become a Seller
                      </Link>
                    </>
                  )}
                </div>
              </div>
            </div>
          </SheetContent>
        </Sheet>

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
            {wishlistCount > 0 && (
              <Badge className="absolute -right-0.5 -top-0.5 size-4 justify-center p-0 text-[10px]">
                {wishlistCount}
              </Badge>
            )}
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
          <Link
            href="/deals"
            className="ml-auto rounded-md bg-primary/10 px-3 py-1.5 text-sm font-medium text-primary hover:bg-primary/20"
          >
            Hot Deals
          </Link>
        </div>
      </nav>


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

            </div>
          </div>
        </div>
      )}
    </header>
  )
}
