"use client"

import React from "react"
import { AlertTriangle, RefreshCw, Home, Bug } from "lucide-react"

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
  errorInfo: React.ErrorInfo | null
  errorCount: number
}

interface ErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ComponentType<{ error: Error; reset: () => void }>
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
  maxRetries?: number
}

const DefaultFallback: React.FC<{ error: Error; reset: () => void }> = ({ error, reset }) => {
  const [showDetails, setShowDetails] = React.useState(false)

  return (
    <div className="flex min-h-[400px] items-center justify-center p-4">
      <div className="flex max-w-md flex-col items-center gap-6 text-center">
        <div className="flex size-16 items-center justify-center rounded-2xl bg-red-500/10">
          <AlertTriangle className="size-8 text-red-500" />
        </div>
        <div className="flex flex-col gap-2">
          <h2 className="text-xl font-bold tracking-tight">Something went wrong</h2>
          <p className="text-sm text-muted-foreground">
            An unexpected error occurred. Try refreshing the page, or go back home.
          </p>
        </div>

        {showDetails && (
          <div className="w-full rounded-lg border bg-muted/30 p-4 text-left">
            <pre className="overflow-x-auto whitespace-pre-wrap text-xs text-muted-foreground">
              <span className="font-semibold text-red-600">{error.name}: </span>
              {error.message}
              {error.stack && (
                <>
                  {"\n\n"}
                  {error.stack}
                </>
              )}
            </pre>
          </div>
        )}

        <div className="flex flex-wrap items-center justify-center gap-3">
          <button
            onClick={reset}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            <RefreshCw className="size-4" />
            Try Again
          </button>
          <a
            href="/"
            className="inline-flex items-center gap-2 rounded-lg border px-5 py-2.5 text-sm font-medium hover:bg-muted"
          >
            <Home className="size-4" />
            Go Home
          </a>
          <button
            onClick={() => setShowDetails((v) => !v)}
            className="inline-flex items-center gap-2 rounded-lg border px-5 py-2.5 text-sm font-medium hover:bg-muted"
          >
            <Bug className="size-4" />
            {showDetails ? "Hide" : "Show"} Details
          </button>
        </div>
      </div>
    </div>
  )
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null, errorInfo: null, errorCount: 0 }
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    this.setState((prev) => ({ errorCount: prev.errorCount + 1, errorInfo }))

    // Log to console with structured info
    console.error("[ErrorBoundary]", {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      errorCount: this.state.errorCount + 1,
    })

    // Call optional error handler
    this.props.onError?.(error, errorInfo)
  }

  handleReset = (): void => {
    this.setState({ hasError: false, error: null, errorInfo: null })
  }

  render(): React.ReactNode {
    if (this.state.hasError && this.state.error) {
      const FallbackComponent = this.props.fallback || DefaultFallback
      return <FallbackComponent error={this.state.error} reset={this.handleReset} />
    }

    return this.props.children
  }
}

// Hook for functional components to catch errors in async operations
export function useAsyncError() {
  const [, setError] = React.useState()
  return React.useCallback((error: Error) => {
    setError(() => {
      throw error
    })
  }, [])
}
