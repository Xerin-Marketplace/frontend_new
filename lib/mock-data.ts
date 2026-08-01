export type Product = {
  id: string
  name: string
  price: number
  originalPrice?: number
  image: string
  images: string[]
  category: string
  brand: string
  rating: number
  reviewCount: number
  inStock: boolean
  description: string
  seller: string
  tags: string[]
}

export type Category = {
  id: string
  name: string
  icon: string
  productCount: number
  color: string
}

export const categories: Category[] = [
  { id: "1", name: "Electronics", icon: "Smartphone", productCount: 1240, color: "bg-blue-500/10 text-blue-600" },
  { id: "2", name: "Fashion", icon: "Shirt", productCount: 3420, color: "bg-pink-500/10 text-pink-600" },
  { id: "3", name: "Home & Living", icon: "Sofa", productCount: 890, color: "bg-green-500/10 text-green-600" },
  { id: "4", name: "Beauty", icon: "Sparkles", productCount: 567, color: "bg-purple-500/10 text-purple-600" },
  { id: "5", name: "Sports", icon: "Dumbbell", productCount: 432, color: "bg-orange-500/10 text-orange-600" },
  { id: "6", name: "Books", icon: "BookOpen", productCount: 1200, color: "bg-amber-500/10 text-amber-600" },
  { id: "7", name: "Toys", icon: "Gamepad2", productCount: 345, color: "bg-red-500/10 text-red-600" },
  { id: "8", name: "Groceries", icon: "ShoppingBasket", productCount: 980, color: "bg-teal-500/10 text-teal-600" },
]

const productImages = [
  "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&q=80",
  "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&q=80",
  "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&q=80",
  "https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=600&q=80",
  "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=600&q=80",
  "https://images.unsplash.com/photo-1585386955414-39e3c01b3c50?w=600&q=80",
  "https://images.unsplash.com/photo-1526170375885-4d9982052a4e?w=600&q=80",
  "https://images.unsplash.com/photo-1546868871-7041f09a5109?w=600&q=80",
  "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=600&q=80",
  "https://images.unsplash.com/photo-1491553895911-0055eca6402d?w=600&q=80",
  "https://images.unsplash.com/photo-1591047139756-eb1a4d07b3a0?w=600&q=80",
  "https://images.unsplash.com/photo-1460353581641-37b264ab4ec1?w=600&q=80",
]

export const products: Product[] = [
  {
    id: "1",
    name: "Premium Wireless Headphones",
    price: 89999,
    originalPrice: 120000,
    image: productImages[0],
    images: [productImages[0], productImages[1], productImages[2]],
    category: "Electronics",
    brand: "SoundPro",
    rating: 4.8,
    reviewCount: 234,
    inStock: true,
    description: "Experience studio-quality sound with these premium wireless headphones. Featuring active noise cancellation, 30-hour battery life, and ultra-comfortable ear cushions.",
    seller: "TechHub Store",
    tags: ["wireless", "audio", "bluetooth", "noise-cancelling"],
  },
  {
    id: "2",
    name: "Classic Leather Watch",
    price: 45000,
    originalPrice: 65000,
    image: productImages[1],
    images: [productImages[1], productImages[3], productImages[4]],
    category: "Fashion",
    brand: "Timeless",
    rating: 4.6,
    reviewCount: 156,
    inStock: true,
    description: "Elegant leather watch with stainless steel case. Water-resistant up to 30m. Perfect for both casual and formal occasions.",
    seller: "Fashion Point",
    tags: ["watch", "leather", "accessories"],
  },
  {
    id: "3",
    name: "Running Sneakers Pro",
    price: 75000,
    image: productImages[2],
    images: [productImages[2], productImages[5], productImages[6]],
    category: "Fashion",
    brand: "RunFast",
    rating: 4.7,
    reviewCount: 412,
    inStock: true,
    description: "Lightweight running shoes with advanced cushioning technology. Breathable mesh upper for maximum comfort during long runs.",
    seller: "Sports Arena",
    tags: ["shoes", "running", "sports"],
  },
  {
    id: "4",
    name: "Designer Sunglasses",
    price: 35000,
    originalPrice: 50000,
    image: productImages[3],
    images: [productImages[3], productImages[7]],
    category: "Fashion",
    brand: "SunStyle",
    rating: 4.5,
    reviewCount: 89,
    inStock: true,
    description: "UV400 protection sunglasses with polarized lenses. Comes with premium case and cleaning cloth.",
    seller: "Fashion Point",
    tags: ["sunglasses", "accessories", "uv-protection"],
  },
  {
    id: "5",
    name: "Smartphone X Pro",
    price: 450000,
    originalPrice: 520000,
    image: productImages[4],
    images: [productImages[4], productImages[8], productImages[9]],
    category: "Electronics",
    brand: "TechMax",
    rating: 4.9,
    reviewCount: 567,
    inStock: true,
    description: "6.7-inch OLED display, triple camera system, 5G connectivity, and all-day battery life. 256GB storage.",
    seller: "TechHub Store",
    tags: ["phone", "smartphone", "5g", "camera"],
  },
  {
    id: "6",
    name: "Skincare Gift Set",
    price: 55000,
    image: productImages[5],
    images: [productImages[5], productImages[10]],
    category: "Beauty",
    brand: "GlowUp",
    rating: 4.4,
    reviewCount: 178,
    inStock: true,
    description: "Complete skincare routine in a box. Includes cleanser, toner, serum, and moisturizer. Suitable for all skin types.",
    seller: "Beauty Bar",
    tags: ["skincare", "beauty", "gift-set"],
  },
  {
    id: "7",
    name: "Wireless Speaker Mini",
    price: 65000,
    originalPrice: 85000,
    image: productImages[6],
    images: [productImages[6], productImages[11]],
    category: "Electronics",
    brand: "SoundPro",
    rating: 4.6,
    reviewCount: 298,
    inStock: true,
    description: "Portable Bluetooth speaker with 360-degree sound. Waterproof design with 20-hour playtime.",
    seller: "TechHub Store",
    tags: ["speaker", "bluetooth", "portable", "waterproof"],
  },
  {
    id: "8",
    name: "Yoga Mat Premium",
    price: 25000,
    image: productImages[7],
    images: [productImages[7], productImages[0]],
    category: "Sports",
    brand: "FlexFit",
    rating: 4.5,
    reviewCount: 145,
    inStock: true,
    description: "Eco-friendly yoga mat with non-slip surface. 6mm thickness for maximum comfort. Includes carrying strap.",
    seller: "Sports Arena",
    tags: ["yoga", "fitness", "mat"],
  },
]

export const featuredProducts = products.slice(0, 4)
export const dealsProducts = products.filter((p) => p.originalPrice).slice(0, 4)
