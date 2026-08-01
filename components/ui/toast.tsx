"use client"

import * as React from "react"
import {
  Toast as ToastPrimitive,
} from "@base-ui/react/toast"

import { cn } from "@/lib/utils"
import { CheckCircle2, Info, AlertTriangle, XCircle, Loader2, X } from "lucide-react"

type ToastType = "default" | "success" | "info" | "warning" | "error" | "loading"

const toastIcons: Record<ToastType, React.ReactNode> = {
  default: null,
  success: <CheckCircle2 className="size-5 text-green-500" />,
  info: <Info className="size-5 text-blue-500" />,
  warning: <AlertTriangle className="size-5 text-yellow-500" />,
  error: <XCircle className="size-5 text-red-500" />,
  loading: <Loader2 className="size-5 animate-spin text-muted-foreground" />,
}

let globalManager: ReturnType<typeof ToastPrimitive.createToastManager> | null = null

function getManager() {
  if (!globalManager) {
    globalManager = ToastPrimitive.createToastManager()
  }
  return globalManager
}

const toast = {
  add(options: {
    title?: React.ReactNode
    description?: React.ReactNode
    type?: ToastType
    actionProps?: React.ComponentPropsWithoutRef<"button">
    timeout?: number
  }) {
    return getManager().add(options)
  },
  close(id?: string) {
    getManager().close(id)
  },
  update(id: string, updates: {
    title?: React.ReactNode
    description?: React.ReactNode
    type?: ToastType
  }) {
    getManager().update(id, updates)
  },
  promise<T>(
    promise: Promise<T>,
    options: {
      loading?: string
      success?: string | ((data: T) => string)
      error?: string | ((error: unknown) => string)
    }
  ) {
    const manager = getManager()
    const id = manager.add({
      title: options.loading ?? "Loading...",
      type: "loading",
    })
    promise.then(
      (data) => {
        const message =
          typeof options.success === "function"
            ? options.success(data)
            : options.success ?? "Success"
        manager.update(id, { title: message, type: "success" })
      },
      (error) => {
        const message =
          typeof options.error === "function"
            ? options.error(error)
            : options.error ?? "Error"
        manager.update(id, { title: message, type: "error" })
      }
    )
    return id
  },
}

function Toaster() {
  const manager = React.useMemo(() => getManager(), [])

  return (
    <ToastPrimitive.Provider toastManager={manager}>
      <ToasterViewport />
    </ToastPrimitive.Provider>
  )
}

function ToasterViewport() {
  const { toasts } = ToastPrimitive.useToastManager()

  return (
    <ToastPrimitive.Viewport
      data-slot="toast-viewport"
      className="fixed bottom-0 right-0 z-[100] flex max-h-screen w-full flex-col-reverse gap-2 p-4 sm:max-w-[400px]"
    >
      {toasts.map((t) => {
          const type = (t.type as ToastType) ?? "default"
          return (
            <ToastPrimitive.Root key={t.id} toast={t}>
            <ToastPrimitive.Content
              data-slot="toast-content"
              data-type={type}
              className={cn(
                "group/toast relative flex w-full items-start gap-3 rounded-xl border border-black/5 bg-white p-4 pr-10 text-sm shadow-xl",
                "data-[ending-style]:animate-out data-[ending-style]:fade-out-0 data-[ending-style]:slide-out-to-right-full",
                "data-[starting-style]:animate-in data-[starting-style]:fade-in-0 data-[starting-style]:slide-in-from-right-full",
                "data-[type=success]:border-green-500/20 data-[type=success]:bg-white",
                "data-[type=error]:border-red-500/20 data-[type=error]:bg-white",
                "data-[type=warning]:border-yellow-500/20 data-[type=warning]:bg-white",
                "data-[type=info]:border-blue-500/20 data-[type=info]:bg-white"
              )}
            >
              {toastIcons[type] && (
                <div className="shrink-0">{toastIcons[type]}</div>
              )}
              <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                {t.title && (
                  <ToastPrimitive.Title
                    data-slot="toast-title"
                    className="font-semibold text-sm text-black"
                  >
                    {t.title}
                  </ToastPrimitive.Title>
                )}
                {t.description && (
                  <ToastPrimitive.Description
                    data-slot="toast-description"
                    className="text-sm text-black/60"
                  >
                    {t.description}
                  </ToastPrimitive.Description>
                )}
                {t.actionProps && (
                  <ToastPrimitive.Action
                    data-slot="toast-action"
                    className={cn(
                      "mt-1 inline-flex h-8 shrink-0 items-center justify-center rounded-md border border-border bg-transparent px-3 text-sm font-medium transition-colors hover:bg-secondary focus:outline-none focus:ring-2 focus:ring-ring"
                    )}
                    {...t.actionProps}
                  />
                )}
              </div>
              <ToastPrimitive.Close
                data-slot="toast-close"
                className="absolute right-2 top-2 rounded-md p-1 text-black/40 opacity-0 transition-opacity hover:opacity-100 focus:opacity-100 focus:outline-none group-hover/toast:opacity-70"
                aria-label="Close"
              >
                <X className="size-4" />
              </ToastPrimitive.Close>
            </ToastPrimitive.Content>
            </ToastPrimitive.Root>
          )
        })}
    </ToastPrimitive.Viewport>
  )
}

export { toast, Toaster }
