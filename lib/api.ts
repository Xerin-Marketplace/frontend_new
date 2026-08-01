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
  if (token) {
    headers["Authorization"] = `Bearer ${token}`
  }

  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  })

  if (res.status === 401 && retry) {
    const refreshed = await refreshAccessToken()
    if (refreshed) {
      return request<T>(path, options, false)
    }
    removeTokens()
    if (typeof window !== "undefined") {
      window.location.href = "/auth?tab=login"
    }
    throw { status: 401, detail: "Session expired" } as ApiError
  }

  if (!res.ok) {
    let detail = "Something went wrong"
    let errors: Record<string, string[]> | undefined
    try {
      const body = await res.json()
      detail = body.detail || body.message || detail
      errors = body.errors
      if (Array.isArray(body.detail)) {
        detail = body.detail.map((e: { msg: string }) => e.msg).join(", ")
      }
    } catch {
      // response had no body
    }
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
