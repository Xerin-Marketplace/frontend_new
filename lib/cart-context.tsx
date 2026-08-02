"use client"

import * as React from "react"
import { api, type ApiError } from "@/lib/api"
import { useAuth } from "@/lib/auth-context"
import { type ApiProduct, getDisplayPrice } from "@/lib/store-types"

export type CartItem = {
  id: string
  product_id: string
  quantity: number
  product: ApiProduct
  unit_price: number
  total_price: number
}

export type CartResponse = {
  id: string
  items: CartItem[]
  subtotal: number
  discount: number
  shipping_cost: number
  total: number
  coupon_code: string | null
}

type GuestCartItem = {
  product_id: string
  quantity: number
  product: ApiProduct
}

const GUEST_CART_KEY = "xerin_guest_cart"

function getGuestCart(): GuestCartItem[] {
  if (typeof window === "undefined") return []
  try {
    const raw = localStorage.getItem(GUEST_CART_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function setGuestCart(items: GuestCartItem[]) {
  if (typeof window === "undefined") return
  localStorage.setItem(GUEST_CART_KEY, JSON.stringify(items))
  window.dispatchEvent(new Event("xerin-cart-update"))
}

type CartContextValue = {
  items: CartItem[]
  count: number
  subtotal: number
  discount: number
  shippingCost: number
  total: number
  couponCode: string | null
  loading: boolean
  isGuest: boolean
  addToCart: (product: ApiProduct, quantity?: number) => Promise<void>
  updateQuantity: (itemId: string, quantity: number) => Promise<void>
  removeItem: (itemId: string) => Promise<void>
  applyCoupon: (code: string) => Promise<void>
  removeCoupon: () => Promise<void>
  mergeGuestCart: () => Promise<void>
  refresh: () => void
}

const CartContext = React.createContext<CartContextValue | null>(null)

function getApiError(err: unknown): string {
  const e = err as ApiError
  return e?.detail || "Something went wrong"
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth()
  const [serverCart, setServerCart] = React.useState<CartResponse | null>(null)
  const [guestItems, setGuestItems] = React.useState<GuestCartItem[]>([])
  const [loading, setLoading] = React.useState(true)

  const fetchServerCart = React.useCallback(async () => {
    setLoading(true)
    try {
      const cart = await api.get<CartResponse>("/cart")
      setServerCart(cart)
    } catch {
      setServerCart(null)
    } finally {
      setLoading(false)
    }
  }, [])

  // Load guest cart from localStorage on mount
  React.useEffect(() => {
    if (!isAuthenticated) {
      setGuestItems(getGuestCart())
      setLoading(false)
    }
  }, [isAuthenticated])

  // Fetch server cart when authenticated
  React.useEffect(() => {
    if (isAuthenticated) {
      fetchServerCart()
    } else {
      setServerCart(null)
      setGuestItems(getGuestCart())
      setLoading(false)
    }
  }, [isAuthenticated, fetchServerCart])

  // Listen for guest cart updates from other tabs/components
  React.useEffect(() => {
    const handler = () => {
      if (!isAuthenticated) {
        setGuestItems(getGuestCart())
      }
    }
    window.addEventListener("xerin-cart-update", handler)
    window.addEventListener("storage", handler)
    return () => {
      window.removeEventListener("xerin-cart-update", handler)
      window.removeEventListener("storage", handler)
    }
  }, [isAuthenticated])

  const isGuest = !isAuthenticated

  // Compute unified cart state
  const cartState = React.useMemo(() => {
    if (isAuthenticated && serverCart) {
      return {
        items: serverCart.items,
        count: serverCart.items.reduce((s, i) => s + i.quantity, 0),
        subtotal: Number(serverCart.subtotal),
        discount: Number(serverCart.discount ?? 0),
        shippingCost: Number(serverCart.shipping_cost ?? 0),
        total: Number(serverCart.total),
        couponCode: serverCart.coupon_code,
      }
    }

    // Guest cart
    const items: CartItem[] = guestItems.map((gi, idx) => {
      const { price } = getDisplayPrice(gi.product)
      return {
        id: `guest-${idx}`,
        product_id: gi.product_id,
        quantity: gi.quantity,
        product: gi.product,
        unit_price: price,
        total_price: price * gi.quantity,
      }
    })
    const subtotal = items.reduce((s, i) => s + i.total_price, 0)
    return {
      items,
      count: items.reduce((s, i) => s + i.quantity, 0),
      subtotal,
      discount: 0,
      shippingCost: 0,
      total: subtotal,
      couponCode: null,
    }
  }, [isAuthenticated, serverCart, guestItems])

  const addToCart = React.useCallback(async (product: ApiProduct, quantity = 1) => {
    if (isAuthenticated) {
      await api.post("/cart/items", { product_id: product.id, quantity })
      await fetchServerCart()
    } else {
      const current = getGuestCart()
      const existing = current.find((i) => i.product_id === product.id)
      if (existing) {
        existing.quantity += quantity
      } else {
        current.push({ product_id: product.id, quantity, product })
      }
      setGuestCart(current)
      setGuestItems(current)
    }
  }, [isAuthenticated, fetchServerCart])

  const updateQuantity = React.useCallback(async (itemId: string, quantity: number) => {
    if (isAuthenticated) {
      await api.patch(`/cart/items/${itemId}`, { quantity })
      await fetchServerCart()
    } else {
      const current = getGuestCart()
      const idx = parseInt(itemId.replace("guest-", ""))
      if (current[idx]) {
        current[idx].quantity = Math.max(1, quantity)
        setGuestCart(current)
        setGuestItems(current)
      }
    }
  }, [isAuthenticated, fetchServerCart])

  const removeItem = React.useCallback(async (itemId: string) => {
    if (isAuthenticated) {
      await api.delete(`/cart/items/${itemId}`)
      await fetchServerCart()
    } else {
      const current = getGuestCart()
      const idx = parseInt(itemId.replace("guest-", ""))
      current.splice(idx, 1)
      setGuestCart(current)
      setGuestItems(current)
    }
  }, [isAuthenticated, fetchServerCart])

  const applyCoupon = React.useCallback(async (code: string) => {
    if (isAuthenticated) {
      await api.post("/cart/apply-coupon", { coupon_code: code })
      await fetchServerCart()
    }
  }, [isAuthenticated, fetchServerCart])

  const removeCoupon = React.useCallback(async () => {
    if (isAuthenticated) {
      await api.delete("/cart/coupon")
      await fetchServerCart()
    }
  }, [isAuthenticated, fetchServerCart])

  const mergeGuestCart = React.useCallback(async () => {
    const guest = getGuestCart()
    if (guest.length === 0) return
    for (const item of guest) {
      try {
        await api.post("/cart/items", { product_id: item.product_id, quantity: item.quantity })
      } catch {
        // skip items that fail (e.g. out of stock)
      }
    }
    localStorage.removeItem(GUEST_CART_KEY)
    setGuestItems([])
    await fetchServerCart()
  }, [fetchServerCart])

  const refresh = React.useCallback(() => {
    if (isAuthenticated) {
      fetchServerCart()
    } else {
      setGuestItems(getGuestCart())
    }
  }, [isAuthenticated, fetchServerCart])

  const value = React.useMemo<CartContextValue>(() => ({
    items: cartState.items,
    count: cartState.count,
    subtotal: cartState.subtotal,
    discount: cartState.discount,
    shippingCost: cartState.shippingCost,
    total: cartState.total,
    couponCode: cartState.couponCode,
    loading,
    isGuest,
    addToCart,
    updateQuantity,
    removeItem,
    applyCoupon,
    removeCoupon,
    mergeGuestCart,
    refresh,
  }), [cartState, loading, isGuest, addToCart, updateQuantity, removeItem, applyCoupon, removeCoupon, mergeGuestCart, refresh])

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  const ctx = React.useContext(CartContext)
  if (!ctx) {
    throw new Error("useCart must be used within CartProvider")
  }
  return ctx
}
