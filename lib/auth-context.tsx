"use client"

import * as React from "react"
import {
  getToken,
  setToken,
  removeTokens,
  getUserData,
  setUserData,
  isTokenExpired,
  api,
  type ApiError,
} from "@/lib/api"

export type AuthUser = {
  id: string
  first_name: string
  last_name: string
  email: string
  phone: string
  is_verified: boolean
  status: string | null
  account_type: "customer" | "seller" | "admin" | "super_admin"
  is_seller: boolean
  seller_status: string | null
  roles: string[]
  permissions: string[]
}

type AuthContextValue = {
  user: AuthUser | null
  loading: boolean
  isAuthenticated: boolean
  isSeller: boolean
  isAdmin: boolean
  isSuperAdmin: boolean
  hasPermission: (permission: string) => boolean
  hasRole: (role: string) => boolean
  login: (email: string, password: string) => Promise<AuthUser>
  register: (data: {
    first_name: string
    last_name: string
    email: string
    phone: string
    password: string
  }) => Promise<void>
  registerSeller: (data: Record<string, unknown>) => Promise<void>
  applyToBecomeSeller: (data: {
    business_name: string
    business_category_ids: string[]
    business_description?: string
    business_country?: string
    business_region?: string
    business_city?: string
    business_address?: string
    product_description?: string
    years_in_business?: string
    website_url?: string
    contact_email?: string
    contact_phone?: string
    agreement_accepted: boolean
  }) => Promise<void>
  getSellerApplicationStatus: () => Promise<{
    has_application: boolean
    seller_id?: string
    status?: string
    business_name?: string
    can_access_seller_dashboard?: boolean
    can_upload_kyc?: boolean
    submitted_at?: string
    approved_at?: string
  }>
  sendOtp: (phone: string) => Promise<void>
  verifyOtp: (phone: string, otpCode: string) => Promise<void>
  forgotPassword: (email: string) => Promise<void>
  resetPassword: (email: string, otpCode: string, newPassword: string) => Promise<void>
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = React.createContext<AuthContextValue | null>(null)

// Session check interval (check token expiry every 60 seconds)
const SESSION_CHECK_INTERVAL = 60000

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<AuthUser | null>(null)
  const [loading, setLoading] = React.useState(true)

  // Initialize from stored data
  React.useEffect(() => {
    const stored = getUserData()
    const token = getToken("access")
    if (stored && token && !isTokenExpired()) {
      setUser(stored as AuthUser)
    } else if (token && isTokenExpired()) {
      // Try to refresh on mount if token is expired
      removeTokens()
    }
    setLoading(false)
  }, [])

  // Proactive session check — detect expired tokens and refresh
  React.useEffect(() => {
    if (!user) return

    const checkSession = () => {
      const token = getToken("access")
      if (!token) {
        setUser(null)
        return
      }
      if (isTokenExpired()) {
        // Token expired — will be refreshed on next API call
        // But if no refresh token, clear session
        if (!getToken("refresh")) {
          removeTokens()
          setUser(null)
        }
      }
    }

    const interval = setInterval(checkSession, SESSION_CHECK_INTERVAL)

    // Also check on window focus (user returning to tab)
    const onFocus = () => checkSession()
    window.addEventListener("focus", onFocus)

    return () => {
      clearInterval(interval)
      window.removeEventListener("focus", onFocus)
    }
  }, [user])

  // Cross-tab sync — logout in one tab logs out everywhere
  React.useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === "access_token" && !e.newValue) {
        setUser(null)
      }
      if (e.key === "user_data" && e.newValue) {
        try {
          const data = JSON.parse(e.newValue)
          setUser(data as AuthUser)
        } catch {
          // ignore
        }
      }
    }
    window.addEventListener("storage", onStorage)
    return () => window.removeEventListener("storage", onStorage)
  }, [])

  const login = React.useCallback(async (email: string, password: string) => {
    // Clear any stale tokens before attempting login
    removeTokens()
    try {
      const res = await api.post<{
        access_token: string
        refresh_token: string
        token_type: string
        user: AuthUser
      }>("/auth/login", { email, password })

      setToken("access", res.access_token)
      setToken("refresh", res.refresh_token)
      if (res.user) {
        setUserData(res.user as Record<string, unknown>)
        setUser(res.user)
        return res.user
      }
      // If backend doesn't return user in token response, fetch it
      const me = await api.get<AuthUser>("/users/me")
      setUserData(me as Record<string, unknown>)
      setUser(me)
      return me
    } catch (err) {
      const apiErr = err as ApiError
      // Clear any partial state on login failure
      removeTokens()
      setUser(null)
      throw apiErr
    }
  }, [])

  const register = React.useCallback(
    async (data: {
      first_name: string
      last_name: string
      email: string
      phone: string
      password: string
    }) => {
      await api.post("/auth/register", data)
    },
    []
  )

  const registerSeller = React.useCallback(
    async (data: Record<string, unknown>) => {
      let lastErr: unknown = null
      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          await api.post("/auth/register-seller", data)
          return
        } catch (err) {
          lastErr = err
          const apiErr = err as ApiError
          if (apiErr?.status !== 500 && apiErr?.status !== 0) throw err
          if (attempt < 2) {
            await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)))
            continue
          }
        }
      }
      throw lastErr
    },
    []
  )

  const applyToBecomeSeller = React.useCallback(
    async (data: {
      business_name: string
      business_category_ids: string[]
      business_description?: string
      business_country?: string
      business_region?: string
      business_city?: string
      business_address?: string
      product_description?: string
      years_in_business?: string
      website_url?: string
      contact_email?: string
      contact_phone?: string
      agreement_accepted: boolean
    }) => {
      await api.post("/sellers/apply", data)
    },
    []
  )

  const getSellerApplicationStatus = React.useCallback(async () => {
    return await api.get<{
      has_application: boolean
      seller_id?: string
      status?: string
      business_name?: string
      can_access_seller_dashboard?: boolean
      can_upload_kyc?: boolean
      submitted_at?: string
      approved_at?: string
    }>("/sellers/application-status")
  }, [])

  const sendOtp = React.useCallback(async (phone: string) => {
    await api.post("/auth/send-otp", { phone })
  }, [])

  const verifyOtp = React.useCallback(
    async (phone: string, otpCode: string) => {
      await api.post("/auth/verify-otp", { phone, otp_code: otpCode })
    },
    []
  )

  const forgotPassword = React.useCallback(async (email: string) => {
    await api.post("/auth/forgot-password", { email })
  }, [])

  const resetPassword = React.useCallback(
    async (email: string, otpCode: string, newPassword: string) => {
      await api.post("/auth/reset-password", {
        email,
        otp_code: otpCode,
        new_password: newPassword,
      })
    },
    []
  )

  const logout = React.useCallback(async () => {
    const refreshToken = getToken("refresh")
    if (refreshToken) {
      try {
        await api.post("/auth/logout", { refresh_token: refreshToken })
      } catch {
        // ignore — we're clearing local state anyway
      }
    }
    removeTokens()
    setUser(null)
  }, [])

  const refreshUser = React.useCallback(async () => {
    try {
      const me = await api.get<AuthUser>("/users/me")
      setUserData(me as Record<string, unknown>)
      setUser(me)
    } catch (err) {
      const apiErr = err as ApiError
      if (apiErr.status === 401) {
        // Session is invalid — clear everything
        removeTokens()
        setUser(null)
      }
      // For other errors, keep existing user data
    }
  }, [])

  // Derived role checks
  const isAdmin = React.useMemo(
    () => user?.account_type === "admin" || user?.account_type === "super_admin",
    [user]
  )
  const isSuperAdmin = React.useMemo(
    () => user?.account_type === "super_admin",
    [user]
  )
  const isSeller = React.useMemo(
    () => user?.account_type === "seller" || user?.is_seller === true,
    [user]
  )

  const hasPermission = React.useCallback(
    (permission: string): boolean => {
      if (!user?.permissions) return false
      return user.permissions.includes(permission)
    },
    [user]
  )

  const hasRole = React.useCallback(
    (role: string): boolean => {
      if (!user?.roles) return false
      return user.roles.includes(role)
    },
    [user]
  )

  const value = React.useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      isAuthenticated: !!user,
      isSeller,
      isAdmin,
      isSuperAdmin,
      hasPermission,
      hasRole,
      login,
      register,
      registerSeller,
      applyToBecomeSeller,
      getSellerApplicationStatus,
      sendOtp,
      verifyOtp,
      forgotPassword,
      resetPassword,
      logout,
      refreshUser,
    }),
    [user, loading, isSeller, isAdmin, isSuperAdmin, hasPermission, hasRole, login, register, registerSeller, applyToBecomeSeller, getSellerApplicationStatus, sendOtp, verifyOtp, forgotPassword, resetPassword, logout, refreshUser]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = React.useContext(AuthContext)
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider")
  }
  return ctx
}

export { type ApiError }
