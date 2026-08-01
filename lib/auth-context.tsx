"use client"

import * as React from "react"
import {
  getToken,
  setToken,
  removeTokens,
  getUserData,
  setUserData,
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
  login: (email: string, password: string) => Promise<AuthUser>
  register: (data: {
    first_name: string
    last_name: string
    email: string
    phone: string
    password: string
  }) => Promise<void>
  registerSeller: (data: Record<string, unknown>) => Promise<void>
  sendOtp: (phone: string, purpose?: string) => Promise<void>
  verifyOtp: (phone: string, otpCode: string, purpose?: string) => Promise<void>
  forgotPassword: (email: string) => Promise<void>
  resetPassword: (email: string, otpCode: string, newPassword: string) => Promise<void>
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = React.createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<AuthUser | null>(null)
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    const stored = getUserData()
    const token = getToken("access")
    if (stored && token) {
      setUser(stored as AuthUser)
    }
    setLoading(false)
  }, [])

  const login = React.useCallback(async (email: string, password: string) => {
    const res = await api.post<{
      access_token: string
      refresh_token: string
      token_type: string
      user: AuthUser
    }>("/auth/login", { email, password })

    setToken("access", res.access_token)
    setToken("refresh", res.refresh_token)
    setUserData(res.user as Record<string, unknown>)
    setUser(res.user)
    return res.user
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
      await api.post("/auth/register-seller", data)
    },
    []
  )

  const sendOtp = React.useCallback(
    async (phone: string, purpose?: string) => {
      await api.post("/auth/send-otp", { phone, purpose })
    },
    []
  )

  const verifyOtp = React.useCallback(
    async (phone: string, otpCode: string, purpose?: string) => {
      await api.post("/auth/verify-otp", { phone, otp_code: otpCode, purpose })
    },
    []
  )

  const forgotPassword = React.useCallback(
    async (email: string) => {
      await api.post("/auth/forgot-password", { email })
    },
    []
  )

  const resetPassword = React.useCallback(
    async (email: string, otpCode: string, newPassword: string) => {
      await api.post("/auth/reset-password", { email, otp_code: otpCode, new_password: newPassword })
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
    } catch {
      // keep existing user data
    }
  }, [])

  const value = React.useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      isAuthenticated: !!user,
      isSeller: user?.account_type === "seller" || user?.is_seller === true,
      login,
      register,
      registerSeller,
      sendOtp,
      verifyOtp,
      forgotPassword,
      resetPassword,
      logout,
      refreshUser,
    }),
    [user, loading, login, register, registerSeller, sendOtp, verifyOtp, forgotPassword, resetPassword, logout, refreshUser]
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
