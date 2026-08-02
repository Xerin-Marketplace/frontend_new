"use client"

import * as React from "react"
import { api, type ApiError } from "@/lib/api"

// ─── Types ──────────────────────────────────────────────────────────────────

interface UseApiState<T> {
  data: T | null
  loading: boolean
  error: ApiError | null
  refetch: () => Promise<void>
}

interface UseApiOptions {
  enabled?: boolean
  deps?: React.DependencyList
  onSuccess?: (data: unknown) => void
  onError?: (error: ApiError) => void
  cacheKey?: string
  cacheTtl?: number // milliseconds
}

// ─── In-memory cache ─────────────────────────────────────────────────────────

interface CacheEntry {
  data: unknown
  timestamp: number
}

const cache = new Map<string, CacheEntry>()

function getCached<T>(key: string, ttl: number): T | null {
  const entry = cache.get(key)
  if (!entry) return null
  if (Date.now() - entry.timestamp > ttl) {
    cache.delete(key)
    return null
  }
  return entry.data as T
}

function setCached(key: string, data: unknown): void {
  cache.set(key, { data, timestamp: Date.now() })
}

function invalidateCache(key?: string): void {
  if (key) {
    cache.delete(key)
  } else {
    cache.clear()
  }
}

// ─── useApi hook ─────────────────────────────────────────────────────────────

export function useApi<T>(
  fetcher: () => Promise<T>,
  options: UseApiOptions = {}
): UseApiState<T> {
  const {
    enabled = true,
    deps = [],
    onSuccess,
    onError,
    cacheKey,
    cacheTtl = 60000,
  } = options

  const [data, setData] = React.useState<T | null>(null)
  const [loading, setLoading] = React.useState(enabled)
  const [error, setError] = React.useState<ApiError | null>(null)
  const mountedRef = React.useRef(true)
  const fetcherRef = React.useRef(fetcher)
  fetcherRef.current = fetcher

  const execute = React.useCallback(async () => {
    if (!enabled) {
      setLoading(false)
      return
    }

    // Check cache first
    if (cacheKey) {
      const cached = getCached<T>(cacheKey, cacheTtl)
      if (cached !== null) {
        setData(cached)
        setLoading(false)
        setError(null)
        onSuccess?.(cached)
        return
      }
    }

    setLoading(true)
    setError(null)

    try {
      const result = await fetcherRef.current()
      if (!mountedRef.current) return

      setData(result)
      setError(null)

      if (cacheKey) {
        setCached(cacheKey, result)
      }

      onSuccess?.(result)
    } catch (err) {
      if (!mountedRef.current) return
      const apiErr = err as ApiError
      setError(apiErr)
      onError?.(apiErr)
    } finally {
      if (mountedRef.current) {
        setLoading(false)
      }
    }
  }, [enabled, cacheKey, cacheTtl, onSuccess, onError])

  React.useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
    }
  }, [])

  React.useEffect(() => {
    if (enabled) {
      execute()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, ...deps])

  return { data, loading, error, refetch: execute }
}

// ─── useApiMutation hook ─────────────────────────────────────────────────────

interface MutationState<T> {
  data: T | null
  loading: boolean
  error: ApiError | null
  mutate: (...args: unknown[]) => Promise<T | null>
  reset: () => void
}

export function useApiMutation<T>(
  mutationFn: (...args: unknown[]) => Promise<T>,
  options: Omit<UseApiOptions, "enabled" | "deps"> = {}
): MutationState<T> {
  const { onSuccess, onError, cacheKey } = options
  const [data, setData] = React.useState<T | null>(null)
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<ApiError | null>(null)
  const mountedRef = React.useRef(true)
  const mutationRef = React.useRef(mutationFn)
  mutationRef.current = mutationFn

  React.useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
    }
  }, [])

  const mutate = React.useCallback(
    async (...args: unknown[]): Promise<T | null> => {
      setLoading(true)
      setError(null)

      try {
        const result = await mutationRef.current(...args)
        if (!mountedRef.current) return null

        setData(result)
        setError(null)

        if (cacheKey) {
          invalidateCache(cacheKey)
        }

        onSuccess?.(result)
        return result
      } catch (err) {
        if (!mountedRef.current) return null
        const apiErr = err as ApiError
        setError(apiErr)
        onError?.(apiErr)
        return null
      } finally {
        if (mountedRef.current) {
          setLoading(false)
        }
      }
    },
    [cacheKey, onSuccess, onError]
  )

  const reset = React.useCallback(() => {
    setData(null)
    setError(null)
    setLoading(false)
  }, [])

  return { data, loading, error, mutate, reset }
}

// ─── Convenience: useApiGet ───────────────────────────────────────────────────

export function useApiGet<T>(path: string, options: UseApiOptions = {}): UseApiState<T> {
  return useApi<T>(() => api.get<T>(path), {
    ...options,
    deps: [path, ...(options.deps || [])],
  })
}

export { invalidateCache }
