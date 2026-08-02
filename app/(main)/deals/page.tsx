import { Metadata } from "next"
import Link from "next/link"
import { Flame, Tag, Clock, ArrowRight, Zap, TrendingDown } from "lucide-react"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export const metadata: Metadata = {
  title: "Hot Deals — XerinMarket",
  description: "Shop the hottest deals and biggest discounts on XerinMarket. Limited-time offers on electronics, fashion, home goods, and more.",
}

const dealCategories = [
  { name: "Electronics", slug: "electronics", discount: "Up to 40% off", emoji: "📱" },
  { name: "Fashion", slug: "fashion", discount: "Up to 60% off", emoji: "👕" },
  { name: "Home & Kitchen", slug: "home", discount: "Up to 35% off", emoji: "🏠" },
  { name: "Beauty", slug: "beauty", discount: "Up to 50% off", emoji: "💄" },
  { name: "Sports & Fitness", slug: "sports", discount: "Up to 45% off", emoji: "⚽" },
  { name: "Gaming", slug: "gaming", discount: "Up to 30% off", emoji: "🎮" },
]

const flashDeals = [
  { name: "Wireless Earbuds Pro", originalPrice: 85000, salePrice: 49000, image: "https://picsum.photos/seed/deal1/400/400", sold: 73 },
  { name: "Smart Watch Series 6", originalPrice: 120000, salePrice: 79000, image: "https://picsum.photos/seed/deal2/400/400", sold: 58 },
  { name: "Bluetooth Speaker", originalPrice: 65000, salePrice: 39000, image: "https://picsum.photos/seed/deal3/400/400", sold: 89 },
  { name: "Power Bank 20000mAh", originalPrice: 45000, salePrice: 29000, image: "https://picsum.photos/seed/deal4/400/400", sold: 92 },
]

const featuredDeals = [
  { name: "Samsung Galaxy A54", originalPrice: 650000, salePrice: 499000, image: "https://picsum.photos/seed/feat1/500/500", rating: 4.5, reviews: 128 },
  { name: "Nike Air Max 270", originalPrice: 180000, salePrice: 129000, image: "https://picsum.photos/seed/feat2/500/500", rating: 4.8, reviews: 342 },
  { name: "Sony WH-1000XM5", originalPrice: 450000, salePrice: 349000, image: "https://picsum.photos/seed/feat3/500/500", rating: 4.9, reviews: 89 },
  { name: "IKEA Office Chair", originalPrice: 250000, salePrice: 179000, image: "https://picsum.photos/seed/feat4/500/500", rating: 4.3, reviews: 56 },
  { name: "Canon EOS R10", originalPrice: 1200000, salePrice: 949000, image: "https://picsum.photos/seed/feat5/500/500", rating: 4.7, reviews: 23 },
  { name: "Adidas Ultraboost", originalPrice: 220000, salePrice: 159000, image: "https://picsum.photos/seed/feat6/500/500", rating: 4.6, reviews: 201 },
  { name: "LG 4K Monitor 27\"", originalPrice: 380000, salePrice: 289000, image: "https://picsum.photos/seed/feat7/500/500", rating: 4.4, reviews: 67 },
  { name: "Bose SoundLink Flex", originalPrice: 130000, salePrice: 89000, image: "https://picsum.photos/seed/feat8/500/500", rating: 4.8, reviews: 145 },
]

function formatPrice(price: number) {
  return new Intl.NumberFormat("en-TZ", { style: "decimal" }).format(price) + " TZS"
}

function discountPercent(original: number, sale: number) {
  return Math.round(((original - sale) / original) * 100)
}

export default function DealsPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 md:py-12">
      {/* Hero Banner */}
      <div className="relative mb-12 overflow-hidden rounded-2xl bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 p-8 md:p-12">
        <div className="absolute right-0 top-0 size-48 rounded-full bg-white/10" />
        <div className="absolute -right-12 -bottom-12 size-64 rounded-full bg-white/5" />
        <div className="relative flex flex-col items-start gap-4">
          <div className="flex items-center gap-2 rounded-full bg-white/20 px-4 py-1.5">
            <Flame className="size-4 text-white" />
            <span className="text-sm font-medium text-white">Limited Time Only</span>
          </div>
          <h1 className="text-3xl font-bold text-white md:text-5xl">🔥 Hot Deals</h1>
          <p className="max-w-lg text-base text-white/90 md:text-lg">
            Save big on top brands and products. New deals added daily — grab them before they&apos;re gone!
          </p>
          <div className="flex flex-wrap gap-3">
            <Link href="/products?deals=true" className={cn(buttonVariants({ variant: "secondary", size: "lg" }), "gap-2")}>
              Shop All Deals
              <ArrowRight className="size-4" />
            </Link>
          </div>
        </div>
      </div>

      {/* Deal Categories */}
      <div className="mb-12">
        <h2 className="mb-6 text-xl font-bold tracking-tight">Shop by Category</h2>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
          {dealCategories.map((cat) => (
            <Link
              key={cat.slug}
              href={`/products?category=${cat.slug}&deals=true`}
              className="group flex flex-col items-center gap-2 rounded-xl border bg-card p-5 transition-all hover:border-primary/50 hover:shadow-lg"
            >
              <span className="text-3xl">{cat.emoji}</span>
              <span className="text-sm font-semibold">{cat.name}</span>
              <span className="text-xs font-medium text-primary">{cat.discount}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Flash Deals */}
      <div className="mb-12">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="size-5 text-orange-500" />
            <h2 className="text-xl font-bold tracking-tight">Flash Deals</h2>
            <span className="rounded-md bg-orange-500/10 px-2 py-0.5 text-xs font-medium text-orange-600">
              Ending Soon
            </span>
          </div>
          <Link href="/products?deals=true" className="flex items-center gap-1 text-sm font-medium text-primary hover:underline">
            View All <ArrowRight className="size-4" />
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {flashDeals.map((deal) => {
            const percent = discountPercent(deal.originalPrice, deal.salePrice)
            return (
              <Link
                key={deal.name}
                href="/products?deals=true"
                className="group flex flex-col gap-3 rounded-xl border bg-card p-4 transition-all hover:border-primary/50 hover:shadow-lg"
              >
                <div className="relative aspect-square overflow-hidden rounded-lg bg-muted">
                  <img
                    src={deal.image}
                    alt={deal.name}
                    className="size-full object-cover transition-transform group-hover:scale-105"
                  />
                  <span className="absolute left-2 top-2 rounded-md bg-red-500 px-2 py-1 text-xs font-bold text-white">
                    -{percent}%
                  </span>
                </div>
                <h3 className="line-clamp-1 text-sm font-semibold">{deal.name}</h3>
                <div className="flex items-baseline gap-2">
                  <span className="text-sm font-bold text-primary">{formatPrice(deal.salePrice)}</span>
                  <span className="text-xs text-muted-foreground line-through">{formatPrice(deal.originalPrice)}</span>
                </div>
                {/* Progress bar */}
                <div className="flex items-center gap-2">
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-orange-500"
                      style={{ width: `${deal.sold}%` }}
                    />
                  </div>
                  <span className="text-xs text-muted-foreground">{deal.sold}% sold</span>
                </div>
              </Link>
            )
          })}
        </div>
      </div>

      {/* Featured Deals */}
      <div className="mb-12">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingDown className="size-5 text-primary" />
            <h2 className="text-xl font-bold tracking-tight">Featured Deals</h2>
          </div>
          <Link href="/products?deals=true" className="flex items-center gap-1 text-sm font-medium text-primary hover:underline">
            View All <ArrowRight className="size-4" />
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {featuredDeals.map((deal) => {
            const percent = discountPercent(deal.originalPrice, deal.salePrice)
            return (
              <Link
                key={deal.name}
                href="/products?deals=true"
                className="group flex flex-col gap-3 rounded-xl border bg-card p-4 transition-all hover:border-primary/50 hover:shadow-lg"
              >
                <div className="relative aspect-square overflow-hidden rounded-lg bg-muted">
                  <img
                    src={deal.image}
                    alt={deal.name}
                    className="size-full object-cover transition-transform group-hover:scale-105"
                  />
                  <span className="absolute left-2 top-2 rounded-md bg-red-500 px-2 py-1 text-xs font-bold text-white">
                    -{percent}%
                  </span>
                </div>
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-1">
                    <span className="text-xs font-medium text-yellow-500">★</span>
                    <span className="text-xs text-muted-foreground">{deal.rating} ({deal.reviews})</span>
                  </div>
                  <h3 className="line-clamp-1 text-sm font-semibold">{deal.name}</h3>
                  <div className="flex items-baseline gap-2">
                    <span className="text-sm font-bold text-primary">{formatPrice(deal.salePrice)}</span>
                    <span className="text-xs text-muted-foreground line-through">{formatPrice(deal.originalPrice)}</span>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      </div>

      {/* Newsletter / CTA */}
      <div className="flex flex-col items-center gap-4 rounded-2xl border bg-muted/30 p-8 text-center">
        <Tag className="size-8 text-primary" />
        <h2 className="text-xl font-bold">Never Miss a Deal</h2>
        <p className="max-w-md text-sm text-muted-foreground">
          Get notified about the best deals and exclusive discounts before anyone else.
        </p>
        <Link
          href="/auth?tab=register"
          className={cn(buttonVariants({ size: "lg" }), "gap-2")}
        >
          Sign Up for Deal Alerts
          <ArrowRight className="size-4" />
        </Link>
      </div>
    </div>
  )
}
