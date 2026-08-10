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

type WishlistProductServerItem = {
  wishlist_id: string
  product_id: string
  name: string
  slug: string
  sku: string
  price: number
  sale_price: number | null
  currency: string
  primary_image_url: string | null
  store_name: string | null
  store_slug: string | null
  is_available: boolean
  is_in_stock: boolean
  created_at: string
}

type WishlistProductListResponse = {
  total: number
  page: number
  page_size: number
  results: WishlistProductServerItem[]
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
  const [serverItems, setServerItems] = React.useState<WishlistProductServerItem[]>([])
  const [guestItems, setGuestItems] = React.useState<GuestWishlistItem[]>([])
  const [loading, setLoading] = React.useState(true)

  const fetchServerWishlist = React.useCallback(async () => {
    setLoading(true)
    try {
      const data = await api.get<WishlistProductListResponse>("/wishlist/products")
      setServerItems(data.results || [])
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
      return serverItems.map((si) => ({
        id: si.wishlist_id,
        product_id: si.product_id,
        created_at: si.created_at,
        product: {
          id: si.product_id,
          name: si.name,
          slug: si.slug,
          sku: si.sku,
          price: si.price,
          sale_price: si.sale_price,
          currency: si.currency,
          is_active: si.is_available,
          images: si.primary_image_url ? [{
            id: 'primary',
            product_id: si.product_id,
            image_url: si.primary_image_url,
            thumbnail_url: si.primary_image_url,
            is_primary: true,
            display_order: 0,
            alt_text: si.name
          }] : [],
          description: null,
          seller_id: '',
          category_id: '',
          brand_id: null,
          weight: null,
          status: 'approved',
          created_at: si.created_at
        } as ApiProduct
      }))
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
          await api.delete(`/wishlist/products/${product.id}`)
        } else {
          await api.post(`/wishlist/products/${product.id}`)
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
        await api.delete(`/wishlist/products/${productId}`)
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
