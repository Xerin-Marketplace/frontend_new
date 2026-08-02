const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://api.xerinmarketplace.com/api/v1"

type TokenType = "access" | "refresh"

function getToken(type: TokenType = "access"): string | null {
  if (typeof window === "undefined") return null
  return localStorage.getItem(`${type}_token`)
}

function setToken(type: TokenType, value: string): void {
  if (typeof window === "undefined") return
  localStorage.setItem(`${type}_token`, value)
}

function removeTokens(): void {
  if (typeof window === "undefined") return
  localStorage.removeItem("access_token")
  localStorage.removeItem("refresh_token")
  localStorage.removeItem("user_data")
}

function getUserData(): Record<string, unknown> | null {
  if (typeof window === "undefined") return null
  const raw = localStorage.getItem("user_data")
  if (!raw) return null
  try {
    return JSON.parse(raw)
  } catch {
    return null
  }
}

function setUserData(data: Record<string, unknown>): void {
  if (typeof window === "undefined") return
  localStorage.setItem("user_data", JSON.stringify(data))
}

export type ApiError = {
  status: number
  detail: string
  errors?: Record<string, string[]>
}

async function refreshAccessToken(): Promise<boolean> {
  const refreshToken = getToken("refresh")
  if (!refreshToken) return false

  try {
    const res = await fetch(`${API_BASE_URL}/auth/refresh-token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: refreshToken }),
    })
    if (!res.ok) return false
    const data = await res.json()
    setToken("access", data.access_token)
    setToken("refresh", data.refresh_token)
    if (data.user) setUserData(data.user)
    return true
  } catch {
    return false
  }
}

const AUTH_PATHS = ["/auth/login", "/auth/register", "/auth/register-seller", "/auth/forgot-password", "/auth/reset-password", "/auth/send-otp", "/auth/verify-otp"]

function isAuthPath(path: string): boolean {
  return AUTH_PATHS.some((p) => path === p || path.startsWith(p))
}

async function request<T>(
  path: string,
  options: RequestInit = {},
  retry = true
): Promise<T> {
  const token = getToken("access")
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...((options.headers as Record<string, string>) || {}),
  }
  // Don't send stale tokens on auth endpoints (login, register, etc.)
  if (token && !isAuthPath(path)) {
    headers["Authorization"] = `Bearer ${token}`
  }

  let res: Response
  try {
    res = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers,
    })
  } catch (networkErr) {
    console.error(`[API NETWORK ERROR] ${options.method || "GET"} ${path}`, {
      url: `${API_BASE_URL}${path}`,
      error: networkErr,
      message: networkErr instanceof Error ? networkErr.message : String(networkErr),
    })
    throw {
      status: 0,
      detail: `Cannot connect to API at ${API_BASE_URL}. Is the backend running?`,
    } as ApiError
  }

  if (res.status === 401 && retry) {
    // Don't attempt refresh or redirect for auth endpoints — they don't need a token
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
      return request<T>(path, options, false)
    }
    removeTokens()
    if (typeof window !== "undefined") {
      // Don't redirect if already on an auth page — just throw the error
      const onAuthPage = window.location.pathname.startsWith("/auth") || window.location.pathname.startsWith("/(auth)")
      if (!onAuthPage) {
        // Use soft redirect via state instead of hard navigation
        window.location.href = "/auth?tab=login&reason=session_expired"
      }
    }
    throw { status: 401, detail: "Session expired. Please sign in again." } as ApiError
  }

  if (!res.ok) {
    let detail = "Something went wrong"
    let errors: Record<string, string[]> | undefined
    let rawBody: unknown = null
    try {
      rawBody = await res.json()
      detail = (rawBody as { detail?: string; message?: string })?.detail || (rawBody as { message?: string })?.message || detail
      errors = (rawBody as { errors?: Record<string, string[]> })?.errors
      if (Array.isArray((rawBody as { detail?: unknown })?.detail)) {
        detail = ((rawBody as { detail: { msg: string }[] }).detail).map((e) => e.msg).join(", ")
      }
    } catch {
      // response had no body
    }
    // Log full error details to console for debugging
    console.error(`[API ERROR] ${options.method || "GET"} ${path} → ${res.status} ${res.statusText}`, {
      url: `${API_BASE_URL}${path}`,
      detail,
      errors,
      rawBody,
    })
    throw { status: res.status, detail, errors } as ApiError
  }

  if (res.status === 204) {
    return undefined as T
  }

  return res.json() as Promise<T>
}

export const api = {
  get: <T>(path: string, options?: RequestInit) =>
    request<T>(path, { ...options, method: "GET" }),

  post: <T>(path: string, body?: unknown, options?: RequestInit) =>
    request<T>(path, {
      ...options,
      method: "POST",
      body: body !== undefined ? JSON.stringify(body) : undefined,
    }),

  patch: <T>(path: string, body?: unknown, options?: RequestInit) =>
    request<T>(path, {
      ...options,
      method: "PATCH",
      body: body !== undefined ? JSON.stringify(body) : undefined,
    }),

  put: <T>(path: string, body?: unknown, options?: RequestInit) =>
    request<T>(path, {
      ...options,
      method: "PUT",
      body: body !== undefined ? JSON.stringify(body) : undefined,
    }),

  delete: <T>(path: string, options?: RequestInit) =>
    request<T>(path, { ...options, method: "DELETE" }),

  upload: <T>(path: string, formData: FormData, options?: RequestInit) => {
    const token = getToken("access")
    const headers: Record<string, string> = {}
    if (token) headers["Authorization"] = `Bearer ${token}`
    return fetch(`${API_BASE_URL}${path}`, {
      ...options,
      method: "POST",
      headers,
      body: formData,
    }).then(async (res) => {
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
}

export {
  getToken,
  setToken,
  removeTokens,
  getUserData,
  setUserData,
  API_BASE_URL,
}
