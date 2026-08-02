/**
 * API Client — Production-grade HTTP client with:
 * - Request timeout & abort controllers
 * - Automatic token refresh with queue (no duplicate refresh calls)
 * - Retry with exponential backoff for transient failures
 * - Structured error handling with typed errors
 * - Request/response interceptors
 * - XSS-safe response parsing
 * - Rate-limit awareness (429 handling)
 * - Proactive token expiry checking
 */

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "https://api.xerinmarketplace.com/api/v1"

// ─── Types ──────────────────────────────────────────────────────────────────

type TokenType = "access" | "refresh"

export type ApiError = {
  status: number
  detail: string
  errors?: Record<string, string[]>
  code?: string
  retryAfter?: number
}

type RequestConfig = RequestInit & {
  timeoutMs?: number
  retries?: number
  skipAuth?: boolean
}

type Interceptor = {
  onRequest?: (config: RequestConfig) => RequestConfig
  onResponse?: <T>(response: T) => T
  onError?: (error: ApiError) => ApiError
}

// ─── Security: Token Management ─────────────────────────────────────────────

const TOKEN_KEY = "access_token"
const REFRESH_KEY = "refresh_token"
const USER_KEY = "user_data"
const TOKEN_EXPIRY_KEY = "token_expires_at"
const TOKEN_TTL_MS = 25 * 60 * 1000 // 25 minutes (matches backend access token)

function getToken(type: TokenType = "access"): string | null {
  if (typeof window === "undefined") return null
  return localStorage.getItem(type === "refresh" ? REFRESH_KEY : TOKEN_KEY)
}

function setToken(type: TokenType, value: string): void {
  if (typeof window === "undefined") return
  const key = type === "refresh" ? REFRESH_KEY : TOKEN_KEY
  localStorage.setItem(key, value)
  if (type === "access") {
    localStorage.setItem(TOKEN_EXPIRY_KEY, String(Date.now() + TOKEN_TTL_MS))
  }
}

function removeTokens(): void {
  if (typeof window === "undefined") return
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(REFRESH_KEY)
  localStorage.removeItem(USER_KEY)
  localStorage.removeItem(TOKEN_EXPIRY_KEY)
}

function isTokenExpired(): boolean {
  if (typeof window === "undefined") return true
  const expiry = localStorage.getItem(TOKEN_EXPIRY_KEY)
  if (!expiry) return true
  return Date.now() > parseInt(expiry, 10)
}

function getUserData(): Record<string, unknown> | null {
  if (typeof window === "undefined") return null
  const raw = localStorage.getItem(USER_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw)
  } catch {
    localStorage.removeItem(USER_KEY)
    return null
  }
}

function setUserData(data: Record<string, unknown>): void {
  if (typeof window === "undefined") return
  localStorage.setItem(USER_KEY, JSON.stringify(data))
}

// ─── Security: Input Sanitization ────────────────────────────────────────────

function sanitizeString(value: string): string {
  return value
    .replace(/<[^>]*>/g, "")
    .replace(/javascript:/gi, "")
    .replace(/on\w+\s*=/gi, "")
    .trim()
}

function sanitizeObject<T>(obj: T): T {
  if (typeof obj === "string") {
    return sanitizeString(obj) as unknown as T
  }
  if (Array.isArray(obj)) {
    return obj.map(sanitizeObject) as unknown as T
  }
  if (obj && typeof obj === "object") {
    const result: Record<string, unknown> = {}
    for (const [key, value] of Object.entries(obj)) {
      result[key] = sanitizeObject(value)
    }
    return result as unknown as T
  }
  return obj
}

// ─── Auth Paths ──────────────────────────────────────────────────────────────

const AUTH_PATHS = [
  "/auth/login",
  "/auth/register",
  "/auth/register-seller",
  "/auth/forgot-password",
  "/auth/reset-password",
  "/auth/send-otp",
  "/auth/verify-otp",
  "/auth/refresh-token",
  "/auth/logout",
]

function isAuthPath(path: string): boolean {
  return AUTH_PATHS.some((p) => path === p || path.startsWith(p))
}

// ─── Token Refresh Queue (prevents duplicate refresh calls) ──────────────────

let refreshPromise: Promise<boolean> | null = null

async function refreshAccessToken(): Promise<boolean> {
  if (refreshPromise) return refreshPromise

  const refreshToken = getToken("refresh")
  if (!refreshToken) return false

  refreshPromise = (async () => {
    try {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 10000)

      const res = await fetch(`${API_BASE_URL}/auth/refresh-token`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh_token: refreshToken }),
        signal: controller.signal,
      })

      clearTimeout(timeout)

      if (!res.ok) {
        removeTokens()
        return false
      }

      const data = await res.json()
      setToken("access", data.access_token)
      if (data.refresh_token) setToken("refresh", data.refresh_token)
      if (data.user) setUserData(data.user)
      return true
    } catch {
      removeTokens()
      return false
    } finally {
      refreshPromise = null
    }
  })()

  return refreshPromise
}

// ─── Interceptors ────────────────────────────────────────────────────────────

const interceptors: Interceptor[] = []

function addInterceptor(interceptor: Interceptor): () => void {
  interceptors.push(interceptor)
  return () => {
    const idx = interceptors.indexOf(interceptor)
    if (idx > -1) interceptors.splice(idx, 1)
  }
}

// ─── Core Request Function ───────────────────────────────────────────────────

const DEFAULT_TIMEOUT = 30000
const MAX_RETRIES = 2
const RETRYABLE_STATUS = new Set([0, 408, 429, 500, 502, 503, 504])

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function getRetryDelay(attempt: number, retryAfter?: number): number {
  if (retryAfter) return retryAfter * 1000
  return Math.min(500 * Math.pow(2, attempt), 5000)
}

async function request<T>(
  path: string,
  options: RequestConfig = {},
  retry = true
): Promise<T> {
  const {
    timeoutMs = DEFAULT_TIMEOUT,
    retries = MAX_RETRIES,
    skipAuth = false,
    ...fetchOptions
  } = options

  // Apply request interceptors
  let config: RequestConfig = { ...fetchOptions, timeoutMs, retries, skipAuth }
  for (const interceptor of interceptors) {
    if (interceptor.onRequest) {
      config = interceptor.onRequest(config)
    }
  }

  // Build headers
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "X-Client-Version": "1.0.0",
    ...((config.headers as Record<string, string>) || {}),
  }

  // Attach auth token
  if (!skipAuth && !isAuthPath(path)) {
    const token = getToken("access")
    if (token && !isTokenExpired()) {
      headers["Authorization"] = `Bearer ${token}`
    } else if (token && isTokenExpired() && getToken("refresh")) {
      const refreshed = await refreshAccessToken()
      if (refreshed) {
        const newToken = getToken("access")
        if (newToken) headers["Authorization"] = `Bearer ${newToken}`
      }
    }
  }

  let res: Response | null = null
  let lastError: ApiError | null = null

  // Retry loop for transient failures
  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), timeoutMs)

    try {
      res = await fetch(`${API_BASE_URL}${path}`, {
        ...config,
        headers,
        signal: controller.signal,
      })
      clearTimeout(timeout)
      break
    } catch (networkErr) {
      clearTimeout(timeout)

      const isAbort = networkErr instanceof DOMException && networkErr.name === "AbortError"
      const error: ApiError = {
        status: 0,
        detail: isAbort
          ? `Request timed out after ${timeoutMs}ms`
          : `Cannot connect to API. Please check your internet connection.`,
        code: isAbort ? "TIMEOUT" : "NETWORK_ERROR",
      }

      if (isAuthPath(path) || attempt >= retries) {
        throw error
      }

      lastError = error
      await sleep(getRetryDelay(attempt))
    }
  }

  // If we exhausted retries without a response
  if (!res) {
    throw lastError || { status: 0, detail: "Network error", code: "NETWORK_ERROR" } as ApiError
  }

  // Handle 401 — token refresh
  if (res.status === 401 && retry) {
    if (isAuthPath(path)) {
      let detail = "Invalid credentials"
      try {
        const body = await res.json()
        detail = body?.detail || body?.message || detail
      } catch {
        // no body
      }
      throw { status: 401, detail } as ApiError
    }

    const refreshed = await refreshAccessToken()
    if (refreshed) {
      return request<T>(path, { ...options, retry: false } as RequestConfig, false)
    }

    removeTokens()
    if (typeof window !== "undefined") {
      const onAuthPage =
        window.location.pathname.startsWith("/auth") ||
        window.location.pathname.startsWith("/(auth)")
      if (!onAuthPage) {
        window.location.href = "/auth?tab=login&reason=session_expired"
      }
    }
    throw { status: 401, detail: "Session expired. Please sign in again.", code: "SESSION_EXPIRED" } as ApiError
  }

  // Handle 429 — Rate limiting
  if (res.status === 429) {
    const retryAfter = parseInt(res.headers.get("Retry-After") || "0", 10)
    let detail = "Too many requests. Please slow down."
    try {
      const body = await res.json()
      detail = body?.detail || detail
    } catch {
      // no body
    }
    console.warn(`[API RATE LIMIT] ${path}`, { retryAfter })
    throw { status: 429, detail, retryAfter, code: "RATE_LIMITED" } as ApiError
  }

  // Handle other errors
  if (!res.ok) {
    let detail = "Something went wrong"
    let errors: Record<string, string[]> | undefined
    let rawBody: unknown = null

    try {
      rawBody = await res.json()
      detail =
        (rawBody as { detail?: string; message?: string })?.detail ||
        (rawBody as { message?: string })?.message ||
        detail
      errors = (rawBody as { errors?: Record<string, string[]> })?.errors

      if (Array.isArray((rawBody as { detail?: unknown })?.detail)) {
        detail = ((rawBody as { detail: { msg: string }[] }).detail)
          .map((e) => e.msg)
          .join(", ")
      }
    } catch {
      // response had no body
    }

    const apiError: ApiError = { status: res.status, detail, errors }

    if (res.status !== 403) {
      console.error(
        `[API ERROR] ${config.method || "GET"} ${path} → ${res.status} ${res.statusText}`,
        { detail, errors, rawBody }
      )
    } else {
      console.warn(`[API 403] ${config.method || "GET"} ${path}`, { detail })
    }

    let finalError = apiError
    for (const interceptor of interceptors) {
      if (interceptor.onError) {
        finalError = interceptor.onError(finalError)
      }
    }

    throw finalError
  }

  // 204 No Content
  if (res.status === 204) {
    return undefined as T
  }

  // Parse JSON response
  try {
    const data = await res.json()
    const sanitized = sanitizeObject(data)

    let result = sanitized
    for (const interceptor of interceptors) {
      if (interceptor.onResponse) {
        result = interceptor.onResponse(result)
      }
    }

    return result as T
  } catch {
    throw {
      status: res.status,
      detail: "Invalid response from server.",
      code: "PARSE_ERROR",
    } as ApiError
  }
}

// ─── Public API ──────────────────────────────────────────────────────────────

export const api = {
  get: <T>(path: string, options?: RequestConfig) =>
    request<T>(path, { ...options, method: "GET" }),

  post: <T>(path: string, body?: unknown, options?: RequestConfig) =>
    request<T>(path, {
      ...options,
      method: "POST",
      body: body !== undefined ? JSON.stringify(body) : undefined,
    }),

  patch: <T>(path: string, body?: unknown, options?: RequestConfig) =>
    request<T>(path, {
      ...options,
      method: "PATCH",
      body: body !== undefined ? JSON.stringify(body) : undefined,
    }),

  put: <T>(path: string, body?: unknown, options?: RequestConfig) =>
    request<T>(path, {
      ...options,
      method: "PUT",
      body: body !== undefined ? JSON.stringify(body) : undefined,
    }),

  delete: <T>(path: string, options?: RequestConfig) =>
    request<T>(path, { ...options, method: "DELETE" }),

  upload: <T>(path: string, formData: FormData, options?: RequestConfig) => {
    const token = getToken("access")
    const headers: Record<string, string> = {}
    if (token) headers["Authorization"] = `Bearer ${token}`

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), options?.timeoutMs || 60000)

    return fetch(`${API_BASE_URL}${path}`, {
      ...options,
      method: "POST",
      headers,
      body: formData,
      signal: controller.signal,
    }).then(async (res) => {
      clearTimeout(timeout)

      if (res.status === 401) {
        const refreshed = await refreshAccessToken()
        if (refreshed) {
          const newToken = getToken("access")
          return fetch(`${API_BASE_URL}${path}`, {
            ...options,
            method: "POST",
            headers: { ...headers, Authorization: `Bearer ${newToken}` },
            body: formData,
          }).then(async (res2) => {
            if (!res2.ok) {
              let detail = "Upload failed"
              try {
                const body = await res2.json()
                detail = body.detail || detail
              } catch {
                // no body
              }
              throw { status: res2.status, detail } as ApiError
            }
            return res2.json() as Promise<T>
          })
        }
        removeTokens()
        throw { status: 401, detail: "Session expired" } as ApiError
      }

      if (!res.ok) {
        let detail = "Upload failed"
        try {
          const body = await res.json()
          detail = body.detail || detail
        } catch {
          // no body
        }
        throw { status: res.status, detail } as ApiError
      }
      return res.json() as Promise<T>
    })
  },

  isAuthenticated: (): boolean => {
    if (typeof window === "undefined") return false
    return !!getToken("access") && !isTokenExpired()
  },

  addInterceptor,
}

export {
  getToken,
  setToken,
  removeTokens,
  getUserData,
  setUserData,
  isTokenExpired,
  sanitizeString,
  sanitizeObject,
  API_BASE_URL,
}
