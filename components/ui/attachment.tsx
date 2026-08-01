"use client"

import * as React from "react"

import { cn } from "@/lib/utils"
import { Button, buttonVariants } from "@/components/ui/button"

type AttachmentState = "idle" | "uploading" | "processing" | "error" | "done"
type AttachmentSize = "default" | "sm" | "xs"
type AttachmentOrientation = "horizontal" | "vertical"

const AttachmentContext = React.createContext<{
  state: AttachmentState
  size: AttachmentSize
}>({
  state: "done",
  size: "default",
})

function Attachment({
  state = "done",
  size = "default",
  orientation = "horizontal",
  className,
  ...props
}: React.ComponentProps<"div"> & {
  state?: AttachmentState
  size?: AttachmentSize
  orientation?: AttachmentOrientation
}) {
  return (
    <AttachmentContext.Provider value={{ state, size }}>
      <div
        data-slot="attachment"
        data-state={state}
        data-size={size}
        data-orientation={orientation}
        className={cn(
          "group/attachment relative flex items-center gap-3 rounded-lg border bg-card p-3 text-card-foreground transition-colors",
          "data-[orientation=vertical]:flex-col data-[orientation=vertical]:items-start",
          "data-[state=error]:border-destructive/30 data-[state=error]:bg-destructive/5",
          "data-[size=sm]:gap-2.5 data-[size=sm]:p-2.5",
          "data-[size=xs]:gap-2 data-[size=xs]:p-2",
          className
        )}
        {...props}
      />
    </AttachmentContext.Provider>
  )
}

function AttachmentMedia({
  variant = "icon",
  className,
  children,
  ...props
}: React.ComponentProps<"div"> & {
  variant?: "icon" | "image"
}) {
  const { size } = React.useContext(AttachmentContext)
  return (
    <div
      data-slot="attachment-media"
      data-variant={variant}
      className={cn(
        "flex shrink-0 items-center justify-center overflow-hidden rounded-md bg-muted text-muted-foreground",
        "size-10 data-[size=sm]:size-8 data-[size=xs]:size-7",
        variant === "image" && "bg-muted",
        className
      )}
      data-size={size}
      {...props}
    >
      {children}
    </div>
  )
}

function AttachmentContent({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="attachment-content"
      className={cn("flex min-w-0 flex-1 flex-col gap-0.5", className)}
      {...props}
    />
  )
}

function AttachmentTitle({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const { state } = React.useContext(AttachmentContext)
  return (
    <div
      data-slot="attachment-title"
      className={cn(
        "truncate text-sm font-medium",
        "data-[state=uploading]:animate-pulse data-[state=processing]:animate-pulse",
        state === "error" && "text-destructive",
        className
      )}
      data-state={state}
      {...props}
    />
  )
}

function AttachmentDescription({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const { state } = React.useContext(AttachmentContext)
  return (
    <div
      data-slot="attachment-description"
      className={cn(
        "truncate text-xs text-muted-foreground",
        state === "error" && "text-destructive/80",
        className
      )}
      {...props}
    />
  )
}

function AttachmentActions({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="attachment-actions"
      className={cn(
        "flex shrink-0 items-center gap-1 self-center",
        className
      )}
      {...props}
    />
  )
}

function AttachmentAction({
  className,
  size,
  ...props
}: React.ComponentProps<typeof Button>) {
  return (
    <Button
      data-slot="attachment-action"
      variant="ghost"
      size={size ?? "icon-xs"}
      className={cn(
        "text-muted-foreground hover:text-foreground",
        className
      )}
      {...props}
    />
  )
}

function AttachmentTrigger({
  className,
  ...props
}: React.ComponentProps<"button">) {
  return (
    <button
      data-slot="attachment-trigger"
      className={cn(
        "absolute inset-0 z-0 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-ring",
        className
      )}
      {...props}
    />
  )
}

function AttachmentGroup({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="attachment-group"
      className={cn(
        "flex snap-x snap-mandatory gap-2 overflow-x-auto scroll-smooth",
        "[mask-image:linear-gradient(to_right,transparent,black_8px,black_calc(100%-8px),transparent)]",
        className
      )}
      {...props}
    />
  )
}

export {
  Attachment,
  AttachmentMedia,
  AttachmentContent,
  AttachmentTitle,
  AttachmentDescription,
  AttachmentActions,
  AttachmentAction,
  AttachmentTrigger,
  AttachmentGroup,
}
