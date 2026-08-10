"use client"

import * as React from "react"
import { Toast as ToastPrimitive } from "@base-ui/react/toast"
import { cn } from "@/lib/utils"
import { 
  CheckCircle2, 
  Info, 
  AlertTriangle, 
  XCircle, 
  Loader2, 
  X 
} from "lucide-react"

type ToastType = "default" | "success" | "info" | "warning" | "error" | "loading"

const toastIcons: Record<ToastType, React.ReactNode> = {
  default: null,
  success: <CheckCircle2 className="size-5 text-green-500" />,
  info: <Info className="size-5 text-blue-500" />,
  warning: <AlertTriangle className="size-5 text-amber-500" />,
  error: <XCircle className="size-5 text-red-500" />,
  loading: <Loader2 className="size-5 animate-spin text-primary" />,
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
      title: options.loading ?? "Inakamilisha...",
      type: "loading",
    })
    promise.then(
      (data) => {
        const message =
          typeof options.success === "function"
            ? options.success(data)
            : options.success ?? "Imekamilika!"
        manager.update(id, { title: message, type: "success" })
      },
      (error) => {
        const message =
          typeof options.error === "function"
            ? options.error(error)
            : options.error ?? "Imefeli!"
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
      className="fixed bottom-0 right-0 z-[100] flex max-h-screen w-full flex-col-reverse gap-3 p-6 sm:max-w-[420px]"
    >
      {toasts.map((t) => {
        const type = (t.type as ToastType) ?? "default"
        return (
          <ToastPrimitive.Root 
            key={t.id} 
            toast={t}
            className="group/toast relative flex w-full flex-col overflow-hidden rounded-2xl border bg-background p-4 shadow-2xl transition-all duration-300 data-[ending-style]:scale-95 data-[ending-style]:opacity-0 data-[starting-style]:translate-y-4 data-[starting-style]:opacity-0 sm:data-[starting-style]:translate-x-4 sm:data-[starting-style]:translate-y-0"
          >
            <div className="flex w-full items-start gap-4">
              {toastIcons[type] && (
                <div className="mt-0.5 shrink-0 transition-transform group-hover/toast:scale-110">
                  {toastIcons[type]}
                </div>
              )}
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                {t.title && (
                  <ToastPrimitive.Title
                    data-slot="toast-title"
                    className="text-[15px] font-bold leading-none tracking-tight text-foreground"
                  >
                    {t.title}
                  </ToastPrimitive.Title>
                )}
                {t.description && (
                  <ToastPrimitive.Description
                    data-slot="toast-description"
                    className="text-[13px] leading-relaxed text-muted-foreground"
                  >
                    {t.description}
                  </ToastPrimitive.Description>
                )}
                
                {t.actionProps && (
                  <div className="mt-3 flex items-center gap-2">
                    <ToastPrimitive.Action
                      data-slot="toast-action"
                      className="inline-flex h-8 items-center justify-center rounded-lg bg-primary px-3 text-xs font-bold text-primary-foreground shadow-sm transition-all hover:bg-primary/90 hover:shadow-md active:scale-95"
                      {...t.actionProps}
                    />
                  </div>
                )}
              </div>
              
              <ToastPrimitive.Close
                data-slot="toast-close"
                className="absolute right-3 top-3 flex size-7 items-center justify-center rounded-full bg-muted/50 text-muted-foreground opacity-0 transition-all hover:bg-muted hover:text-foreground group-hover/toast:opacity-100 focus:opacity-100"
                aria-label="Funga"
              >
                <X className="size-3.5" strokeWidth={2.5} />
              </ToastPrimitive.Close>
            </div>
            
            {/* Progress bar for auto-close */}
            <div 
              className={cn(
                "absolute bottom-0 left-0 h-1 bg-primary/20 transition-all duration-150",
                type === "success" && "bg-green-500/20",
                type === "error" && "bg-red-500/20",
                type === "warning" && "bg-amber-500/20",
                type === "info" && "bg-blue-500/20"
              )}
              style={{ width: "100%" }}
            />
          </ToastPrimitive.Root>
        )
      })}
    </ToastPrimitive.Viewport>
  )
}

export { toast, Toaster }
