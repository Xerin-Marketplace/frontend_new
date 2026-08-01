"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

type BubbleVariant =
  | "default"
  | "secondary"
  | "muted"
  | "tinted"
  | "outline"
  | "ghost"
  | "destructive"

type BubbleAlign = "start" | "end"

const bubbleVariants: Record<BubbleVariant, string> = {
  default: "bg-primary text-primary-foreground",
  secondary: "bg-muted text-foreground",
  muted: "bg-muted/50 text-muted-foreground",
  tinted: "bg-primary/10 text-primary",
  outline: "border border-border bg-background text-foreground",
  ghost: "bg-transparent text-foreground",
  destructive: "bg-destructive/10 text-destructive border border-destructive/20",
}

function Bubble({
  variant = "default",
  align = "start",
  className,
  ...props
}: React.ComponentProps<"div"> & {
  variant?: BubbleVariant
  align?: BubbleAlign
}) {
  return (
    <div
      data-slot="bubble"
      data-variant={variant}
      data-align={align}
      className={cn(
        "flex w-full flex-col",
        align === "end" ? "items-end" : "items-start",
        className
      )}
      {...props}
    />
  )
}

function BubbleContent({
  className,
  render,
  ...props
}: React.ComponentProps<"div"> & {
  render?: React.ReactElement | ((props: any) => React.ReactElement)
}) {
  const Comp = (render ?? "div") as React.ElementType
  return (
    <Comp
      data-slot="bubble-content"
      className={cn(
        "max-w-[80%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed",
        "data-[align=end]:rounded-br-md data-[align=start]:rounded-bl-md",
        "outline-none focus-visible:ring-2 focus-visible:ring-ring",
        className
      )}
      {...props}
    />
  )
}

function BubbleReactions({
  side = "bottom",
  align = "end",
  className,
  ...props
}: React.ComponentProps<"div"> & {
  side?: "top" | "bottom"
  align?: "start" | "end"
}) {
  return (
    <div
      data-slot="bubble-reactions"
      data-side={side}
      data-align={align}
      className={cn(
        "relative z-10 flex items-center gap-1 rounded-full bg-background px-2 py-1 shadow-sm border",
        side === "top" ? "-mt-2" : "-mb-2",
        align === "end" ? "self-end" : "self-start",
        className
      )}
      {...props}
    />
  )
}

function BubbleGroup({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="bubble-group"
      className={cn("flex flex-col gap-1", className)}
      {...props}
    />
  )
}

export { Bubble, BubbleContent, BubbleReactions, BubbleGroup, bubbleVariants }
