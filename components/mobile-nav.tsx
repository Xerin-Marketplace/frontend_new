"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, Search, ShoppingCart, Heart, User } from "lucide-react"
import { cn } from "@/lib/utils"
import { useAuth } from "@/lib/auth-context"

const navItems = [
  { href: "/", label: "Home", icon: Home },
  { href: "/products", label: "Browse", icon: Search },
  { href: "/cart", label: "Cart", icon: ShoppingCart },
  { href: "/wishlist", label: "Saved", icon: Heart },
  { href: "/auth", label: "Account", icon: User },
]

export function MobileNav() {
  const pathname = usePathname()
  const { user, isAuthenticated } = useAuth()

  const userInitials = user ? `${user.first_name?.[0] ?? ""}${user.last_name?.[0] ?? ""}`.toUpperCase() : ""

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur-lg md:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="flex items-stretch justify-around px-1 py-1">
        {navItems.map((item) => {
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={isAuthenticated && item.href === "/auth" ? "/dashboard/user" : item.href}
              className={cn(
                "flex flex-1 flex-col items-center justify-center gap-1 rounded-xl py-2.5 transition-all duration-200 min-h-[52px]",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground active:scale-90 active:bg-muted"
              )}
            >
              <div className="relative">
                {isActive && (
                  <span className="absolute -top-2.5 left-1/2 h-1 w-6 -translate-x-1/2 rounded-full bg-primary" />
                )}
                {item.href === "/auth" && isAuthenticated && user ? (
                  <div className="flex size-6 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                    {userInitials || <User className="size-4" />}
                  </div>
                ) : (
                  <item.icon
                    className={cn(
                      "size-5 transition-transform",
                      isActive && "scale-110"
                    )}
                  />
                )}
              </div>
              <span
                className={cn(
                  "text-[10px] font-medium",
                  isActive ? "opacity-100" : "opacity-70"
                )}
              >
                {item.href === "/auth" && isAuthenticated ? "Profile" : item.label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
