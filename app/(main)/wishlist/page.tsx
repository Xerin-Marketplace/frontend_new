"use client"

import Link from "next/link"
import { Heart, ShoppingBag } from "lucide-react"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export default function WishlistPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-16 md:py-24">
      <div className="flex flex-col items-center gap-6 text-center">
        <div className="flex size-20 items-center justify-center rounded-3xl bg-muted">
          <Heart className="size-10 text-muted-foreground" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight">Your wishlist is empty</h1>
          <p className="text-muted-foreground">
            Save items you love by tapping the heart icon on any product. They&apos;ll appear here for easy access.
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
