import Link from "next/link";
import { categories } from "@/lib/mock-data";

function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  );
}

function TwitterIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
    </svg>
  );
}

function YoutubeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    </svg>
  );
}

export function Footer() {
  return (
    <footer className="border-t bg-muted/30">
      {/* Main footer */}
      <div className="mx-auto max-w-7xl px-4 py-12">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div className="flex flex-col gap-4">
            <Link href="/" className="flex items-center gap-2">
              <img
                src="/apple-touch-icon.png"
                alt="XerinMarket"
                className="size-9 rounded-lg object-cover"
              />
              <span className="text-lg font-bold tracking-tight">
                Xerin<span className="text-primary">Market</span>
              </span>
            </Link>
            <p className="text-sm text-muted-foreground">
              Tanzania's Trusted Online Marketplace. Shop local, connect globally —
              buy and sell with confidence, secure payments, and fast delivery.
            </p>
            <div className="flex items-center gap-2">
              <Link
                href="#"
                className="flex size-9 items-center justify-center rounded-lg bg-background text-muted-foreground hover:text-primary"
              >
                <FacebookIcon className="size-4" />
              </Link>
              <Link
                href="#"
                className="flex size-9 items-center justify-center rounded-lg bg-background text-muted-foreground hover:text-primary"
              >
                <TwitterIcon className="size-4" />
              </Link>
              <Link
                href="#"
                className="flex size-9 items-center justify-center rounded-lg bg-background text-muted-foreground hover:text-primary"
              >
                <InstagramIcon className="size-4" />
              </Link>
              <Link
                href="#"
                className="flex size-9 items-center justify-center rounded-lg bg-background text-muted-foreground hover:text-primary"
              >
                <YoutubeIcon className="size-4" />
              </Link>
            </div>
          </div>

          {/* Categories */}
          <div>
            <h3 className="mb-4 text-sm font-semibold">Categories</h3>
            <ul className="flex flex-col gap-2.5 text-sm text-muted-foreground">
              {categories.slice(0, 6).map((cat) => (
                <li key={cat.id}>
                  <Link
                    href={`/products?category=${cat.id}`}
                    className="hover:text-primary"
                  >
                    {cat.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="mb-4 text-sm font-semibold">Quick Links</h3>
            <ul className="flex flex-col gap-2.5 text-sm text-muted-foreground">
              <li>
                <Link href="/products" className="hover:text-primary">
                  All Products
                </Link>
              </li>
              <li>
                <Link href="/deals" className="hover:text-primary">
                  Hot Deals
                </Link>
              </li>
              <li>
                <Link href="/auth?tab=seller" className="hover:text-primary">
                  Become a Seller
                </Link>
              </li>
              <li>
                <Link href="/track-order" className="hover:text-primary">
                  Track Order
                </Link>
              </li>
              <li>
                <Link href="/help" className="hover:text-primary">
                  Help Center
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="mb-4 text-sm font-semibold">Customer Support</h3>
            <ul className="flex flex-col gap-2.5 text-sm text-muted-foreground">
              <li>
                <Link href="/about" className="hover:text-primary">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-primary">
                  Contact Us
                </Link>
              </li>
              <li>
                <a href="tel:+255222000000" className="hover:text-primary">
                  +255 22 200 0000
                </a>
              </li>
              <li>
                <a href="https://wa.me/255222000000" target="_blank" rel="noopener noreferrer" className="hover:text-primary">
                  WhatsApp Support
                </a>
              </li>
              <li>
                <a href="mailto:support@xerin.co.tz" className="hover:text-primary">
                  support@xerin.co.tz
                </a>
              </li>
              <li>
                <Link href="/returns" className="hover:text-primary">
                  Return Policy
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Mobile App Download */}
        <div className="mt-10 flex flex-col items-center justify-between gap-4 rounded-2xl border bg-background/50 p-6 sm:flex-row">
          <div className="text-center sm:text-left">
            <h3 className="text-base font-bold">Get the XerinMarket App</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Shop anywhere, anytime. Download our mobile app for the best experience.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <a
              href="https://play.google.com/store/apps/details?id=com.xerinmarket.com&pcampaignid=web_share"
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center gap-3 rounded-xl bg-black px-5 py-3 transition-all hover:scale-[1.03] hover:shadow-lg"
            >
              <svg className="size-7" viewBox="0 0 24 24" fill="none">
                <path d="M3.609 1.814L13.792 12 3.61 22.186a.996.996 0 0 1-.61-.92V2.734a1 1 0 0 1 .609-.92z" fill="#34A853"/>
                <path d="M14.539 11.193L17.16 8.572l3.873 2.197a1 1 0 0 1 0 1.462l-3.873 2.197-2.621-2.621a.5.5 0 0 1 0-.707z" fill="#FBBC04"/>
                <path d="M17.16 8.572L4.32 1.297a.97.97 0 0 0-.71-.07L13.792 12 3.61 22.186a.97.97 0 0 0 .71-.07L17.16 15.428 13.792 12l3.368-3.428z" fill="#EA4335"/>
                <path d="M3.61 22.186a.97.97 0 0 1-.71-.07L4.32 1.297a.97.97 0 0 1 .71.07l12.13 7.275L13.792 12 3.61 22.186z" fill="#4285F4"/>
              </svg>
              <div className="flex flex-col leading-tight">
                <span className="text-[10px] text-white/70">GET IT ON</span>
                <span className="text-sm font-bold text-white">Google Play</span>
              </div>
            </a>
            <div
              className="group flex cursor-not-allowed items-center gap-3 rounded-xl border-2 border-dashed border-muted-foreground/30 bg-muted/20 px-5 py-3 opacity-80"
              title="Coming Soon"
            >
              <svg className="size-7 text-muted-foreground" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.08 1.85-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.08zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
              </svg>
              <div className="flex flex-col leading-tight">
                <span className="text-[10px] text-muted-foreground">DOWNLOAD ON THE</span>
                <span className="text-sm font-bold text-muted-foreground">App Store · Soon</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-4 py-4 text-xs text-muted-foreground sm:flex-row">
          <p>
            &copy; {new Date().getFullYear()} XerinMarket. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <span>Secure Payments</span>
            <span>Fast Delivery</span>
            <span>Trusted Sellers</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
