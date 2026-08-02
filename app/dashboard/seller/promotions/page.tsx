"use client"

import { Tag } from "lucide-react"

export default function SellerPromotionsPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Promotions</h2>
        <p className="text-sm text-muted-foreground">Create and manage promotional campaigns and discount coupons.</p>
      </div>

      <div className="flex flex-col items-center justify-center gap-4 rounded-lg border border-dashed py-20 text-center">
        <Tag className="size-12 text-muted-foreground" />
        <div>
          <p className="text-sm font-medium">No promotions available</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Promotional campaigns and discount coupons will appear here.
          </p>
        </div>
      </div>
    </div>
  )
}
