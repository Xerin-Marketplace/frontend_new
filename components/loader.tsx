"use client"

import { Spinner } from "@/components/ui/spinner"
import { cn } from "@/lib/utils"

export function FullPageLoader({ label = "Loading..." }: { label?: string }) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-4">
        <Spinner className="size-10 text-primary" />
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
      </div>
    </div>
  )
}

export function InlineLoader({
  label = "Loading...",
  className,
}: {
  label?: string
  className?: string
}) {
  return (
    <div className={cn("flex items-center justify-center gap-3 py-8", className)}>
      <Spinner className="size-5 text-primary" />
      <span className="text-sm text-muted-foreground">{label}</span>
    </div>
  )
}
