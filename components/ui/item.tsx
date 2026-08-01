"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

type ItemVariant = "default" | "outline" | "muted"
type ItemSize = "default" | "sm" | "xs"

function Item({
  variant = "default",
  size = "default",
  render,
  className,
  ...props
}: React.ComponentProps<"div"> & {
  variant?: ItemVariant
  size?: ItemSize
  render?: React.ReactElement
}) {
  const Comp = (render ?? "div") as React.ElementType
  return (
    <Comp
      data-slot="item"
      data-variant={variant}
      data-size={size}
      className={cn(
        "group/item relative flex w-full items-center gap-3 rounded-lg p-3 text-sm transition-colors",
        "data-[variant=default]:bg-card data-[variant=default]:text-card-foreground",
        "data-[variant=outline]:border border-border bg-background",
        "data-[variant=muted]:bg-muted/50 text-foreground",
        "data-[size=sm]:gap-2.5 data-[size=sm]:p-2.5",
        "data-[size=xs]:gap-2 data-[size=xs]:p-2",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        "hover:bg-muted/50",
        className
      )}
      {...props}
    />
  )
}

function ItemGroup({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="item-group"
      className={cn("flex flex-col gap-2", className)}
      {...props}
    />
  )
}

function ItemSeparator({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="item-separator"
      className={cn("h-px w-full bg-border", className)}
      {...props}
    />
  )
}

function ItemMedia({
  variant = "default",
  className,
  ...props
}: React.ComponentProps<"div"> & {
  variant?: "default" | "icon" | "image"
}) {
  return (
    <div
      data-slot="item-media"
      data-variant={variant}
      className={cn(
        "flex shrink-0 items-center justify-center overflow-hidden",
        "data-[variant=icon]:size-9 data-[variant=icon]:rounded-md data-[variant=icon]:bg-muted data-[variant=icon]:text-muted-foreground",
        "data-[variant=image]:size-9 data-[variant=image]:rounded-md",
        "data-[variant=default]:size-9",
        className
      )}
      {...props}
    />
  )
}

function ItemContent({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="item-content"
      className={cn("flex min-w-0 flex-1 flex-col gap-0.5", className)}
      {...props}
    />
  )
}

function ItemTitle({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="item-title"
      className={cn("truncate font-medium text-sm", className)}
      {...props}
    />
  )
}

function ItemDescription({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="item-description"
      className={cn("truncate text-xs text-muted-foreground", className)}
      {...props}
    />
  )
}

function ItemActions({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="item-actions"
      className={cn("flex shrink-0 items-center gap-1", className)}
      {...props}
    />
  )
}

function ItemHeader({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="item-header"
      className={cn("text-xs font-medium text-muted-foreground", className)}
      {...props}
    />
  )
}

function ItemFooter({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="item-footer"
      className={cn("text-xs text-muted-foreground", className)}
      {...props}
    />
  )
}

export {
  Item,
  ItemGroup,
  ItemSeparator,
  ItemMedia,
  ItemContent,
  ItemTitle,
  ItemDescription,
  ItemActions,
  ItemHeader,
  ItemFooter,
}
