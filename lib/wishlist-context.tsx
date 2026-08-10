"use client"

import * as React from "react"
import { api, type ApiError } from "@/lib/api"
import { useAuth } from "@/lib/auth-context"
import { type ApiProduct } from "@/lib/store-types"

export type WishlistItem = {
  id: string
  product_id: string
  product: ApiProduct
  created_at: string
}

type GuestWishlistItem = {
  product_id: string
  product: ApiProduct
}

const GUEST_WISHLIST_KEY = "xerin_guest_wishlist"

function getGuestWishlist(): GuestWishlistItem[] {
  if (typeof window === "undefined") return []
  try {
    const raw = localStorage.getItem(GUEST_WISHLIST_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function setGuestWishlist(items: GuestWishlistItem[]) {
  if (typeof window === "undefined") return
  localStorage.setItem(GUEST_WISHLIST_KEY, JSON.stringify(items))
  window.dispatchEvent(new Event("xerin-wishlist-update"))
}

type WishlistContextValue = {
  items: WishlistItem[]
  count: number
  loading: boolean
  isWishlisted: (productId: string) => boolean
  toggleWishlist: (product: ApiProduct) => Promise<void>
  removeItem: (productId: string) => Promise<void>
  refresh: () => void
}

const WishlistContext = React.createContext<WishlistContextValue | null>(null)

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth()
  const [serverItems, setServerItems] = React.useState<WishlistItem[]>([])
  const [guestItems, setGuestItems] = React.useState<GuestWishlistItem[]>([])
  const [loading, setLoading] = React.useState(true)

  const fetchServerWishlist = React.useCallback(async () => {
    setLoading(true)
    try {
      // Assuming GET /wishlist returns an array of items or an object with items array
      const data = await api.get<WishlistItem[] | { items: WishlistItem[] }>("/wishlist")
      const items = Array.isArray(data) ? data : data.items || []
      setServerItems(items)
    } catch {
      setServerItems([])
    } finally {
      setLoading(false)
    }
  }, [])

  // Load guest wishlist on mount
  React.useEffect(() => {
    if (!isAuthenticated) {
      setGuestItems(getGuestWishlist())
      setLoading(false)
    }
  }, [isAuthenticated])

  // Fetch server wishlist when authenticated
  React.useEffect(() => {
    if (isAuthenticated) {
      fetchServerWishlist()
    } else {
      setServerItems([])
      setGuestItems(getGuestWishlist())
      setLoading(false)
    }
  }, [isAuthenticated, fetchServerWishlist])

  // Listen for guest wishlist updates
  React.useEffect(() => {
    const handler = () => {
      if (!isAuthenticated) {
        setGuestItems(getGuestWishlist())
      }
    }
    window.addEventListener("xerin-wishlist-update", handler)
    window.addEventListener("storage", handler)
    return () => {
      window.removeEventListener("xerin-wishlist-update", handler)
      window.removeEventListener("storage", handler)
    }
  }, [isAuthenticated])

  const items = React.useMemo(() => {
    if (isAuthenticated) {
      return serverItems
    }
    return guestItems.map((gi, idx) => ({
      id: `guest-${idx}`,
      product_id: gi.product_id,
      product: gi.product,
      created_at: new Date().toISOString(),
    }))
  }, [isAuthenticated, serverItems, guestItems])

  const isWishlisted = React.useCallback(
    (productId: string) => {
      return items.some((i) => i.product_id === productId)
    },
    [items]
  )

  const toggleWishlist = React.useCallback(
    async (product: ApiProduct) => {
      if (isAuthenticated) {
        if (isWishlisted(product.id)) {
          // Assuming DELETE /wishlist/{product_id}
          await api.delete(`/wishlist/${product.id}`)
        } else {
          // Assuming POST /wishlist with product_id
          await api.post("/wishlist", { product_id: product.id })
        }
        await fetchServerWishlist()
      } else {
        const current = getGuestWishlist()
        const idx = current.findIndex((i) => i.product_id === product.id)
        if (idx > -1) {
          current.splice(idx, 1)
        } else {
          current.push({ product_id: product.id, product })
        }
        setGuestWishlist(current)
        setGuestItems(current)
      }
    },
    [isAuthenticated, isWishlisted, fetchServerWishlist]
  )

  const removeItem = React.useCallback(
    async (productId: string) => {
      if (isAuthenticated) {
        await api.delete(`/wishlist/${productId}`)
        await fetchServerWishlist()
      } else {
        const current = getGuestWishlist()
        const idx = current.findIndex((i) => i.product_id === productId)
        if (idx > -1) {
          current.splice(idx, 1)
          setGuestWishlist(current)
          setGuestItems(current)
        }
      }
    },
    [isAuthenticated, fetchServerWishlist]
  )

  const refresh = React.useCallback(() => {
    if (isAuthenticated) {
      fetchServerWishlist()
    } else {
      setGuestItems(getGuestWishlist())
    }
  }, [isAuthenticated, fetchServerWishlist])

  const value = React.useMemo(
    () => ({
      items,
      count: items.length,
      loading,
      isWishlisted,
      toggleWishlist,
      removeItem,
      refresh,
    }),
    [items, loading, isWishlisted, toggleWishlist, removeItem, refresh]
  )

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>
}

export function useWishlist() {
  const ctx = React.useContext(WishlistContext)
  if (!ctx) {
    throw new Error("useWishlist must be used within WishlistProvider")
  }
  return ctx
}
