"use client"

import { LoginForm } from "@/components/login-form"
import { ShoppingBag, ShieldCheck, Truck, TrendingUp } from "lucide-react"

export default function LoginPage() {
  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      {/* Left - Form */}
      <div className="flex flex-col gap-4 p-6 sm:p-8 md:p-10">
        <div className="flex justify-center gap-2 md:justify-start">
          <a href="/" className="flex items-center gap-2 font-semibold">
            <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <ShoppingBag className="size-5" />
            </div>
            <span className="text-lg tracking-tight">XerinMarket</span>
          </a>
        </div>
        <div className="flex flex-1 items-center justify-center pb-10">
          <div className="w-full max-w-sm">
            <LoginForm />
          </div>
        </div>
        <div className="text-center text-xs text-muted-foreground">
          &copy; {new Date().getFullYear()} XerinMarket. All rights reserved.
        </div>
      </div>

      {/* Right - Branding */}
      <div className="relative hidden overflow-hidden lg:flex lg:flex-col lg:justify-between lg:p-12">
        <img
          src="/securepayemtbns.jpg"
          alt="Secure payments"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-black/80 via-black/60 to-black/80" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-black/40" />
        <div className="absolute inset-0 mix-blend-multiply bg-primary/20" />

        <div className="relative flex flex-col gap-2">
          <div className="flex items-center gap-2 text-white">
            <div className="flex size-10 items-center justify-center rounded-xl bg-white/10 backdrop-blur">
              <ShoppingBag className="size-6" />
            </div>
            <span className="text-xl font-semibold tracking-tight">
              XerinMarket
            </span>
          </div>
        </div>

        <div className="relative flex flex-col gap-8 text-white">
          <div className="flex flex-col gap-3">
            <h2 className="text-3xl font-bold leading-tight tracking-tight">
              The marketplace built for Africa
            </h2>
            <p className="max-w-md text-lg text-zinc-300">
              Buy and sell products with confidence. Secure payments, fast
              delivery, and trusted sellers — all in one platform.
            </p>
          </div>

          <div className="grid gap-4">
            <div className="flex items-start gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-white/10 backdrop-blur">
                <ShieldCheck className="size-5 text-white" />
              </div>
              <div>
                <p className="font-medium">Secure Payments</p>
                <p className="text-sm text-zinc-400">
                  Your transactions are protected with escrow
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-white/10 backdrop-blur">
                <Truck className="size-5 text-white" />
              </div>
              <div>
                <p className="font-medium">Fast Delivery</p>
                <p className="text-sm text-zinc-400">
                  Nationwide shipping with real-time tracking
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-white/10 backdrop-blur">
                <TrendingUp className="size-5 text-white" />
              </div>
              <div>
                <p className="font-medium">Grow Your Business</p>
                <p className="text-sm text-zinc-400">
                  Reach thousands of customers across the region
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="relative flex items-center gap-6 text-sm text-zinc-400">
          <span>10k+ Sellers</span>
          <span className="size-1 rounded-full bg-zinc-600" />
          <span>100k+ Products</span>
          <span className="size-1 rounded-full bg-zinc-600" />
          <span>1M+ Orders</span>
        </div>
      </div>
    </div>
  )
}
