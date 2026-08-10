export type ApiProduct = {
  id: string
  seller_id: string
  category_id: string
  brand_id: string | null
  sku: string
  name: string
  slug: string
  description: string | null
  price: number
  sale_price: number | null
  currency: string
  weight: number | null
  status: string
  is_active: boolean
  images: {
    id: string
    product_id: string
    image_url: string
    thumbnail_url: string | null
    alt_text: string | null
    is_primary: boolean
    display_order: number
  }[]
  created_at: string
}

export type ApiCategory = {
  id: string
  parent_id: string | null
  name: string
  slug: string
  image_url: string | null
  thumbnail_url: string | null
  created_at: string
}

export type ApiBrand = {
  id: string
  name: string
  slug: string
}

export function formatPrice(price: number): string {
  const n = Number(price)
  if (isNaN(n) || !isFinite(n)) return "TSh 0"
  return `TSh ${n.toLocaleString()}`
}

export function getPrimaryImage(product: ApiProduct): string | null {
  const primary = product.images.find((img) => img.is_primary)
  if (primary) return primary.image_url
  return product.images[0]?.image_url ?? null
}

export function getDisplayPrice(product: ApiProduct): { price: number; originalPrice?: number; discount?: number } {
  if (product.sale_price && Number(product.sale_price) < Number(product.price)) {
    const discount = Math.round(((Number(product.price) - Number(product.sale_price)) / Number(product.price)) * 100)
    return { price: Number(product.sale_price), originalPrice: Number(product.price), discount }
  }
  return { price: Number(product.price) }
}

export function formatOrderRef(id: string, createdAt?: string | null): string {
  const date = createdAt ? new Date(createdAt) : new Date()
  const yy = String(date.getFullYear()).slice(2)
  const mm = String(date.getMonth() + 1).padStart(2, "0")
  const dd = String(date.getDate()).padStart(2, "0")
  const uuidNum = id.replace(/-/g, "")
  let hash = 0
  for (let i = 0; i < uuidNum.length; i++) {
    hash = ((hash << 5) - hash + uuidNum.charCodeAt(i)) | 0
  }
  const seq = String(Math.abs(hash) % 100000).padStart(5, "0")
  return `XM-${yy}${mm}${dd}-${seq}`
}
