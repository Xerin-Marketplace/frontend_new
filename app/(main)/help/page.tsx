"use client"

import * as React from "react"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Button, buttonVariants } from "@/components/ui/button"
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion"
import { cn } from "@/lib/utils"
import {
  Search,
  HelpCircle,
  ShoppingBag,
  Truck,
  RotateCcw,
  CreditCard,
  Store,
  User,
  Shield,
  Mail,
  Phone,
  MessageSquare,
  Clock,
  Package,
  Wallet,
  ChevronRight,
  ArrowRight,
  LifeBuoy,
} from "lucide-react"

type FAQItem = {
  q: string
  a: string
}

type FAQCategory = {
  id: string
  title: string
  icon: React.ElementType
  description: string
  items: FAQItem[]
}

const faqCategories: FAQCategory[] = [
  {
    id: "orders",
    title: "Orders & Purchases",
    icon: ShoppingBag,
    description: "Placing orders, tracking, and delivery",
    items: [
      {
        q: "How do I place an order on XerinMarket?",
        a: "Browse products, add items to your cart, and proceed to checkout. You'll need to provide a shipping address and select a payment method. Once payment is confirmed, the seller will be notified to ship your order.",
      },
      {
        q: "Can I cancel my order after placing it?",
        a: "You can cancel an order before the seller confirms and ships it. Once shipped, you'll need to request a return instead. Go to your order history, find the order, and click 'Cancel Order' if the option is available.",
      },
      {
        q: "How do I track my order?",
        a: "Go to 'My Orders' in your dashboard or use the 'Track Order' page with your order number. You'll see real-time status updates including confirmation, shipping, and delivery.",
      },
      {
        q: "What if my order arrives late?",
        a: "Delivery times are estimates provided by sellers and shipping providers. If your order is significantly delayed, contact the seller through the platform or reach out to our support team. We'll help mediate the situation.",
      },
      {
        q: "Can I order from multiple sellers at once?",
        a: "Yes! You can add products from different sellers to your cart. Each seller's items will be shipped separately, and you'll receive individual tracking numbers for each shipment.",
      },
    ],
  },
  {
    id: "shipping",
    title: "Shipping & Delivery",
    icon: Truck,
    description: "Delivery times, regions, and tracking",
    items: [
      {
        q: "Which regions does XerinMarket deliver to?",
        a: "We currently deliver across all regions in Tanzania. Some sellers may offer international shipping — check the product listing or seller's store for delivery options.",
      },
      {
        q: "How long does delivery take?",
        a: "Delivery within Dar es Salaam typically takes 1–3 business days. Other regions may take 3–7 business days. Remote areas may take longer. Check each product for estimated delivery times.",
      },
      {
        q: "How much does shipping cost?",
        a: "Shipping costs vary by seller, product size, weight, and delivery location. The exact shipping fee is calculated at checkout before you confirm your order.",
      },
      {
        q: "What if I'm not home when my package arrives?",
        a: "The delivery agent will contact you via phone. You can arrange a convenient delivery time or authorize someone else to receive the package on your behalf.",
      },
      {
        q: "Do you offer same-day delivery?",
        a: "Some sellers in Dar es Salaam may offer same-day or next-day delivery for certain products. Look for the 'Express Delivery' badge on product listings.",
      },
    ],
  },
  {
    id: "returns",
    title: "Returns & Refunds",
    icon: RotateCcw,
    description: "Return policy and refund process",
    items: [
      {
        q: "What is your return policy?",
        a: "You may request a return within 7 days of receiving your product if the item is damaged, defective, or significantly different from what was described. Certain categories like perishable goods and personalized items may not be eligible.",
      },
      {
        q: "How do I request a return?",
        a: "Go to 'My Orders', find the order, and click 'Request Return'. Select the reason and provide details/photos. The seller will review your request within 48 hours.",
      },
      {
        q: "How long does a refund take?",
        a: "Refunds are processed to your original payment method within 5–10 business days after the return is approved. Mobile money refunds may appear faster.",
      },
      {
        q: "What if the seller refuses my return request?",
        a: "If you disagree with the seller's decision, XerinMarket will mediate. Our support team reviews the evidence from both sides and makes a binding determination.",
      },
      {
        q: "Do I pay for return shipping?",
        a: "If the item is damaged, defective, or misdescribed, the seller covers return shipping. If you're returning for personal reasons (e.g., changed your mind), you may be responsible for return shipping costs.",
      },
    ],
  },
  {
    id: "payments",
    title: "Payments & Wallet",
    icon: CreditCard,
    description: "Payment methods and transactions",
    items: [
      {
        q: "What payment methods are supported?",
        a: "We support mobile money (M-Pesa, Airtel Money, Halopesa, Tigo Pesa), card payments (Visa, Mastercard), and AzamPay. All payments are processed securely through our payment partners.",
      },
      {
        q: "Is my payment information safe?",
        a: "Yes. We do not store your full card numbers. Payments are processed by PCI-compliant partners. Your payment is held securely until the seller ships your order, and funds are released only after you confirm receipt.",
      },
      {
        q: "When is the seller paid?",
        a: "Funds are released to the seller's wallet after you confirm receipt of your order or the auto-confirmation period expires (typically 7 days after delivery). Sellers can then request payouts to their bank or mobile money account.",
      },
      {
        q: "What is the XerinMarket wallet?",
        a: "Sellers have a wallet that holds their earnings from completed sales. Funds can be used for platform fees or withdrawn to a registered payout account (bank or mobile money).",
      },
      {
        q: "Can I get a refund to a different account?",
        a: "Refunds are processed to your original payment method for security reasons. If your original method is no longer valid, contact support to arrange an alternative.",
      },
    ],
  },
  {
    id: "seller",
    title: "Selling on XerinMarket",
    icon: Store,
    description: "Becoming a seller and managing your store",
    items: [
      {
        q: "How do I become a seller?",
        a: "Click 'Become a Seller' on the homepage or go to the auth page and select the seller registration tab. You'll need to provide your business name, category, and contact information. Phone verification via OTP is required.",
      },
      {
        q: "What is KYC and why is it required?",
        a: "KYC (Know Your Customer) is a verification process where you submit identification documents (national ID or passport, business registration, TIN). It's required before you can receive payouts to ensure compliance with Tanzanian law.",
      },
      {
        q: "How much commission does XerinMarket charge?",
        a: "Commission rates vary by product category and are displayed in your seller dashboard. Commission is automatically deducted from your payout. We may update rates with 30 days' notice.",
      },
      {
        q: "How long do payouts take?",
        a: "Standard payout processing time is 3–5 business days after the buyer confirms receipt or the auto-confirmation period expires. You must have a valid payout account registered.",
      },
      {
        q: "What products am I not allowed to sell?",
        a: "Prohibited items include illegal goods, counterfeits, weapons, drugs, live animals, IP-infringing products, and any product banned under Tanzanian law. See our Seller Terms of Service for the full list.",
      },
      {
        q: "What are the seller performance standards?",
        a: "Sellers must maintain: cancellation rate below 5%, late shipment rate below 10%, average rating of 3.5+ stars, and response time within 24 hours. Falling below these may result in reduced visibility or suspension.",
      },
    ],
  },
  {
    id: "account",
    title: "Account & Security",
    icon: Shield,
    description: "Login, password, and account management",
    items: [
      {
        q: "How do I reset my password?",
        a: "Click 'Forgot Password' on the login page. Enter your registered email or phone number, and we'll send you a reset link. Follow the link to set a new password (minimum 8 characters with 1 uppercase and 1 number).",
      },
      {
        q: "Why do I need OTP verification?",
        a: "OTP (One-Time Password) verification via phone number helps protect your account from unauthorized access and ensures that we can reach you for order updates. It's required during registration and for sensitive actions.",
      },
      {
        q: "How do I change my phone number?",
        a: "Go to Settings in your dashboard, update your phone number, and verify the new number via OTP. If you've lost access to your current number, contact support for assistance.",
      },
      {
        q: "Is my personal data safe?",
        a: "Yes. We comply with Tanzania's Personal Data Protection Act, 2022. Passwords are hashed with bcrypt, all traffic is encrypted, and we never sell your data. See our Privacy Policy for full details.",
      },
      {
        q: "How do I delete my account?",
        a: "Contact customer support to request account deletion. We'll verify your identity and process the request. Your data is retained for 90 days for dispute resolution, then permanently deleted unless legally required to keep longer.",
      },
    ],
  },
]

const contactOptions = [
  {
    icon: MessageSquare,
    title: "Live Chat",
    description: "Chat with our support team",
    detail: "Available 8AM – 10PM",
    href: "#",
    action: "Start Chat",
    color: "bg-primary/10 text-primary",
  },
  {
    icon: Mail,
    title: "Email Support",
    description: "Send us a detailed message",
    detail: "support@xerinmarket.com",
    href: "mailto:support@xerinmarket.com",
    action: "Send Email",
    color: "bg-blue-500/10 text-blue-600",
  },
  {
    icon: Phone,
    title: "Call Us",
    description: "Speak to a representative",
    detail: "+255 700 000 000",
    href: "tel:+255700000000",
    action: "Call Now",
    color: "bg-green-500/10 text-green-600",
  },
]

const quickLinks = [
  { icon: Package, title: "Track Your Order", href: "/track-order", description: "Check real-time delivery status" },
  { icon: RotateCcw, title: "Request a Return", href: "/dashboard/user/orders", description: "Start a return or refund" },
  { icon: Store, title: "Become a Seller", href: "/auth?tab=seller", description: "Start selling on XerinMarket" },
  { icon: Wallet, title: "Seller Dashboard", href: "/dashboard/seller", description: "Manage your store and orders" },
]

export default function HelpPage() {
  const [search, setSearch] = React.useState("")
  const [activeCategory, setActiveCategory] = React.useState<string>("all")

  const filteredCategories = React.useMemo(() => {
    if (!search.trim()) {
      return activeCategory === "all"
        ? faqCategories
        : faqCategories.filter((c) => c.id === activeCategory)
    }
    const term = search.toLowerCase()
    return faqCategories
      .map((cat) => ({
        ...cat,
        items: cat.items.filter(
          (item) =>
            item.q.toLowerCase().includes(term) ||
            item.a.toLowerCase().includes(term) ||
            cat.title.toLowerCase().includes(term)
        ),
      }))
      .filter((cat) => cat.items.length > 0)
  }, [search, activeCategory])

  const totalFAQs = faqCategories.reduce((sum, c) => sum + c.items.length, 0)

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 md:py-12">
      {/* Hero */}
      <div className="mb-12 flex flex-col items-center gap-4 text-center">
        <div className="flex size-16 items-center justify-center rounded-2xl bg-primary/10">
          <LifeBuoy className="size-8 text-primary" />
        </div>
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight md:text-4xl">Help Center</h1>
          <p className="max-w-2xl text-muted-foreground">
            Find answers to common questions, get help with orders, and contact our support team.
          </p>
        </div>

        {/* Search bar */}
        <div className="relative w-full max-w-xl">
          <Search className="absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search for help... (e.g., 'how to refund', 'seller payout')"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-12 pl-12 text-base"
          />
        </div>
        <p className="text-xs text-muted-foreground">{totalFAQs} articles across {faqCategories.length} topics</p>
      </div>

      {/* Quick links */}
      <div className="mb-12 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {quickLinks.map((link) => (
          <Link
            key={link.title}
            href={link.href}
            className="group flex items-center gap-3 rounded-xl border bg-card p-4 transition-all hover:border-primary/50 hover:shadow-md"
          >
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <link.icon className="size-5 text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold">{link.title}</p>
              <p className="truncate text-xs text-muted-foreground">{link.description}</p>
            </div>
            <ChevronRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
          </Link>
        ))}
      </div>

      {/* Contact options */}
      <div className="mb-12">
        <h2 className="mb-4 text-lg font-semibold">Get in Touch</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          {contactOptions.map((option) => (
            <Card key={option.title} className="transition-all hover:shadow-md">
              <CardContent className="flex flex-col items-center gap-3 p-6 text-center">
                <div className={cn("flex size-12 items-center justify-center rounded-xl", option.color)}>
                  <option.icon className="size-6" />
                </div>
                <div>
                  <h3 className="font-semibold">{option.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{option.description}</p>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Clock className="size-3.5" />
                  {option.detail}
                </div>
                <Link
                  href={option.href}
                  className={cn(buttonVariants({ variant: "outline", size: "sm" }), "mt-1 w-full gap-1.5")}
                >
                  {option.action}
                  <ArrowRight className="size-3.5" />
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* FAQ section */}
      <div className="mb-4 flex items-center gap-2">
        <HelpCircle className="size-5 text-primary" />
        <h2 className="text-lg font-semibold">Frequently Asked Questions</h2>
      </div>

      {/* Category filter chips */}
      {!search && (
        <div className="mb-8 flex flex-wrap gap-2">
          <button
            onClick={() => setActiveCategory("all")}
            className={cn(
              "rounded-full border px-4 py-1.5 text-sm font-medium transition-colors",
              activeCategory === "all"
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-card text-muted-foreground hover:text-foreground"
            )}
          >
            All Topics
          </button>
          {faqCategories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={cn(
                "flex items-center gap-1.5 rounded-full border px-4 py-1.5 text-sm font-medium transition-colors",
                activeCategory === cat.id
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card text-muted-foreground hover:text-foreground"
              )}
            >
              <cat.icon className="size-3.5" />
              {cat.title}
            </button>
          ))}
        </div>
      )}

      {/* FAQ content */}
      {filteredCategories.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
            <Search className="size-10 text-muted-foreground" />
            <p className="text-sm font-medium">No results found</p>
            <p className="text-sm text-muted-foreground">
              Try different keywords or{" "}
              <Link href="mailto:support@xerinmarket.com" className="text-primary underline underline-offset-4">
                contact our support team
              </Link>
              .
            </p>
            {search && (
              <Button variant="outline" size="sm" onClick={() => setSearch("")} className="mt-2">
                Clear search
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          {filteredCategories.map((category) => (
            <div key={category.id}>
              {/* Category header */}
              <div className="mb-4 flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10">
                  <category.icon className="size-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold tracking-tight">{category.title}</h3>
                  <p className="text-xs text-muted-foreground">{category.description}</p>
                </div>
                <Badge variant="secondary" className="ml-auto">
                  {category.items.length} {category.items.length === 1 ? "question" : "questions"}
                </Badge>
              </div>

              {/* Accordion */}
              <Card>
                <CardContent className="p-0">
                  <Accordion>
                    {category.items.map((item, idx) => (
                      <AccordionItem
                        key={idx}
                        value={`${category.id}-${idx}`}
                        className="border-b last:border-b-0 px-4"
                      >
                        <AccordionTrigger className="text-sm font-medium hover:no-underline">
                          {item.q}
                        </AccordionTrigger>
                        <AccordionContent className="text-sm text-muted-foreground">
                          {item.a}
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      )}

      {/* Still need help banner */}
      <div className="mt-12 flex flex-col items-center gap-4 rounded-2xl border bg-muted/30 p-8 text-center">
        <div className="flex size-12 items-center justify-center rounded-xl bg-primary/10">
          <HelpCircle className="size-6 text-primary" />
        </div>
        <div>
          <h3 className="font-semibold">Still need help?</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Our support team is available every day from 8AM to 10PM EAT.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Link href="mailto:support@xerinmarket.com" className={cn(buttonVariants({ variant: "default" }), "gap-2")}>
            <Mail className="size-4" />
            Email Support
          </Link>
          <Link href="/terms" className={cn(buttonVariants({ variant: "outline" }), "gap-2")}>
            <Shield className="size-4" />
            View Terms & Policies
          </Link>
        </div>
      </div>
    </div>
  )
}
