import Link from "next/link"
import { ArrowRight, Truck, ShieldCheck, Headphones, CreditCard } from "lucide-react"
import { Button, buttonVariants } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ProductCard } from "@/components/product-card"
import { categories, featuredProducts, dealsProducts } from "@/lib/mock-data"
import { cn } from "@/lib/utils"
import * as Icons from "lucide-react"

export default function Home() {
  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="relative overflow-hidden border-b">
        <div className="mx-auto max-w-7xl px-4 py-10 md:py-16">
          <div className="grid items-center gap-8 lg:grid-cols-2">
            <div className="flex flex-col gap-5">
              <Badge className="w-fit gap-1.5" variant="secondary">
                <span className="size-1.5 rounded-full bg-primary" />
                New Season Collection
              </Badge>
              <h1 className="text-4xl font-bold leading-tight tracking-tight md:text-5xl lg:text-6xl">
                Shop Smart, <span className="text-primary">Live Better</span>
              </h1>
              <p className="max-w-md text-base text-muted-foreground md:text-lg">
                Discover thousands of products from trusted sellers across
                Africa. Secure payments, fast delivery, and unbeatable prices.
              </p>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/products"
                  className={cn(buttonVariants({ size: "lg" }), "gap-2")}
                >
                  Start Shopping
                  <ArrowRight className="size-4" />
                </Link>
                <Link
                  href="/seller"
                  className={cn(
                    buttonVariants({ variant: "outline", size: "lg" })
                  )}
                >
                  Become a Seller
                </Link>
              </div>
              {/* Stats */}
              <div className="flex items-center gap-6 pt-4">
                <div>
                  <p className="text-2xl font-bold">10k+</p>
                  <p className="text-xs text-muted-foreground">Sellers</p>
                </div>
                <div className="h-8 w-px bg-border" />
                <div>
                  <p className="text-2xl font-bold">100k+</p>
                  <p className="text-xs text-muted-foreground">Products</p>
                </div>
                <div className="h-8 w-px bg-border" />
                <div>
                  <p className="text-2xl font-bold">1M+</p>
                  <p className="text-xs text-muted-foreground">Orders</p>
                </div>
              </div>
            </div>

            {/* Hero image */}
            <div className="relative hidden aspect-[4/3] overflow-hidden rounded-xl lg:block">
              <img
                src="https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=800&q=80"
                alt="Shopping"
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
              <div className="absolute bottom-4 left-4 rounded-lg bg-background/90 p-4 backdrop-blur">
                <p className="text-sm font-medium">Flash Sale</p>
                <p className="text-2xl font-bold text-primary">Up to 50% Off</p>
                <Link
                  href="/deals"
                  className="mt-2 flex items-center gap-1 text-sm font-medium text-primary hover:underline"
                >
                  Shop Now <ArrowRight className="size-3" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust badges */}
      <section className="border-b">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-4 px-4 py-6 md:grid-cols-4">
          {[
            { icon: Truck, title: "Fast Delivery", desc: "Nationwide shipping" },
            { icon: ShieldCheck, title: "Secure Payments", desc: "Protected by escrow" },
            { icon: Headphones, title: "24/7 Support", desc: "Always here to help" },
            { icon: CreditCard, title: "Easy Returns", desc: "7-day return policy" },
          ].map((item) => (
            <div key={item.title} className="flex items-center gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <item.icon className="size-5" />
              </div>
              <div>
                <p className="text-sm font-medium">{item.title}</p>
                <p className="text-xs text-muted-foreground">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Categories */}
      <section className="mx-auto w-full max-w-7xl px-4 py-10">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold tracking-tight">Shop by Category</h2>
          <Link
            href="/products"
            className="flex items-center gap-1 text-sm font-medium text-primary hover:underline"
          >
            View All <ArrowRight className="size-4" />
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-8">
          {categories.map((cat) => {
            const Icon = (Icons as any)[cat.icon] || Icons.Package
            return (
              <Link
                key={cat.id}
                href={`/products?category=${cat.id}`}
                className="group flex flex-col items-center gap-3 rounded-xl border p-4 transition-all hover:border-primary hover:shadow-sm"
              >
                <div
                  className={cn(
                    "flex size-12 items-center justify-center rounded-xl transition-transform group-hover:scale-110",
                    cat.color
                  )}
                >
                  <Icon className="size-6" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium">{cat.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {cat.productCount} items
                  </p>
                </div>
              </Link>
            )
          })}
        </div>
      </section>

      {/* Featured Products */}
      <section className="mx-auto w-full max-w-7xl px-4 py-10">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">
              Featured Products
            </h2>
            <p className="text-sm text-muted-foreground">
              Handpicked products just for you
            </p>
          </div>
          <Link
            href="/products"
            className="flex items-center gap-1 text-sm font-medium text-primary hover:underline"
          >
            View All <ArrowRight className="size-4" />
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:gap-4 lg:grid-cols-4">
          {featuredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      {/* Deals Banner */}
      <section className="mx-auto w-full max-w-7xl px-4 py-10">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary to-primary/80 p-6 md:p-10">
          <div className="absolute right-0 top-0 size-40 rounded-full bg-white/10" />
          <div className="absolute -right-10 -bottom-10 size-52 rounded-full bg-white/5" />
          <div className="relative flex flex-col items-start gap-4">
            <Badge className="bg-white/20 text-white">Limited Time</Badge>
            <h2 className="text-3xl font-bold text-white md:text-4xl">
              Hot Deals of the Week
            </h2>
            <p className="max-w-md text-white/80">
              Save big on selected items. Hurry, these deals won&apos;t last
              long!
            </p>
            <Link
              href="/deals"
              className={cn(
                buttonVariants({ variant: "secondary", size: "lg" }),
                "gap-2"
              )}
            >
              Shop Deals
              <ArrowRight className="size-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Deals Products */}
      <section className="mx-auto w-full max-w-7xl px-4 pb-10">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Today&apos;s Deals</h2>
            <p className="text-sm text-muted-foreground">
              Save more with these special offers
            </p>
          </div>
          <Link
            href="/deals"
            className="flex items-center gap-1 text-sm font-medium text-primary hover:underline"
          >
            View All <ArrowRight className="size-4" />
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:gap-4 lg:grid-cols-4">
          {dealsProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      {/* Newsletter */}
      <section className="border-t bg-muted/30">
        <div className="mx-auto max-w-7xl px-4 py-12">
          <div className="flex flex-col items-center gap-4 text-center">
            <h2 className="text-2xl font-bold tracking-tight">
              Stay in the Loop
            </h2>
            <p className="max-w-md text-muted-foreground">
              Subscribe to get exclusive deals, new arrivals, and special
              offers delivered to your inbox.
            </p>
            <div className="flex w-full max-w-sm flex-col gap-2 sm:flex-row">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
              <Button size="lg">Subscribe</Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
