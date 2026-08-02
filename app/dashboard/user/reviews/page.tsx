"use client"

import { Star, MessageSquare } from "lucide-react"

export default function UserReviewsPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">My Reviews</h2>
        <p className="text-sm text-muted-foreground">Share your experience and manage reviews for products you&apos;ve purchased.</p>
      </div>

      <div className="flex flex-col items-center justify-center gap-4 rounded-lg border border-dashed py-20 text-center">
        <MessageSquare className="size-12 text-muted-foreground" />
        <div>
          <p className="text-sm font-medium">No reviews yet</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Reviews for your delivered orders will appear here.
          </p>
        </div>
      </div>
    </div>
  )
}
