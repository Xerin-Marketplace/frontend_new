"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

type MarkerVariant = "default" | "border" | "separator"

function Marker({
  variant = "default",
  render,
  className,
  ...props
}: React.ComponentProps<"div"> & {
  variant?: MarkerVariant
  render?: React.ReactElement
}) {
  const Comp = (render ?? "div") as React.ElementType
  return (
    <Comp
      data-slot="marker"
      data-variant={variant}
      className={cn(
        "flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground",
        "data-[variant=border]:border-b data-[variant=border]:border-border",
        "data-[variant=separator]:relative data-[variant=separator]:justify-center data-[variant=separator]:py-3",
        "data-[variant=separator]:before:absolute data-[variant=separator]:before:left-0 data-[variant=separator]:before:right-1/2 data-[variant=separator]:before:mr-4 data-[variant=separator]:before:h-px data-[variant=separator]:before:bg-border",
        "data-[variant=separator]:after:absolute data-[variant=separator]:after:right-0 data-[variant=separator]:after:left-1/2 data-[variant=separator]:after:ml-4 data-[variant=separator]:after:h-px data-[variant=separator]:after:bg-border",
        className
      )}
      {...props}
    />
  )
}

function MarkerIcon({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="marker-icon"
      aria-hidden="true"
      className={cn(
        "flex shrink-0 items-center justify-center text-muted-foreground",
        "size-4",
        className
      )}
      {...props}
    />
  )
}

function MarkerContent({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="marker-content"
      className={cn("min-w-0 flex-1 truncate text-sm", className)}
      {...props}
    />
  )
}

export { Marker, MarkerIcon, MarkerContent }
