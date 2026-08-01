import { Metadata } from "next"
import Link from "next/link"
import { ChevronRight, FileText, Shield, Store, User, Scale, Lock, AlertCircle } from "lucide-react"

export const metadata: Metadata = {
  title: "Terms of Service — XerinMarket",
  description: "Read the Terms of Service for XerinMarket marketplace. Choose the terms that apply to you as a customer or seller.",
}

const sections = [
  {
    icon: User,
    title: "Customer Terms of Service",
    description: "Terms for buyers and shoppers using XerinMarket to purchase products.",
    href: "/terms/customer",
    points: ["Orders & Payment", "Shipping & Returns", "Buyer Protection"],
  },
  {
    icon: Store,
    title: "Seller Terms of Service",
    description: "Terms for merchants and businesses selling on XerinMarket platform.",
    href: "/terms/seller",
    points: ["Commissions & Payouts", "Product Guidelines", "KYC Requirements"],
  },
  {
    icon: Shield,
    title: "Privacy Policy",
    description: "How we collect, use, and protect your personal data.",
    href: "/privacy",
    points: ["Data Protection", "Your Rights", "PDPA 2022 Compliant"],
  },
]

const highlights = [
  {
    icon: Scale,
    title: "Fair & Transparent",
    description: "Separate agreements for buyers and sellers, ensuring clarity for everyone.",
  },
  {
    icon: Lock,
    title: "Secure by Design",
    description: "Encrypted payments, hashed passwords, and OTP verification protect your account.",
  },
  {
    icon: AlertCircle,
    title: "Clear Dispute Resolution",
    description: "Structured mediation and refund processes for when things don't go as planned.",
  },
]

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-12 md:py-20">
      {/* Hero */}
      <div className="flex flex-col items-center gap-4 text-center mb-16">
        <div className="flex size-16 items-center justify-center rounded-2xl bg-primary/10">
          <FileText className="size-8 text-primary" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight md:text-5xl">Terms & Policies</h1>
        <p className="max-w-2xl text-base text-muted-foreground md:text-lg">
          XerinMarket operates separate agreements for customers and sellers to ensure clarity and fairness. Select the document that applies to you.
        </p>
      </div>

      {/* Highlights */}
      <div className="mb-16 grid gap-4 sm:grid-cols-3">
        {highlights.map((h) => (
          <div key={h.title} className="flex flex-col gap-2 rounded-xl border bg-card p-5">
            <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10">
              <h.icon className="size-4.5 text-primary" />
            </div>
            <h3 className="text-sm font-semibold">{h.title}</h3>
            <p className="text-sm text-muted-foreground">{h.description}</p>
          </div>
        ))}
      </div>

      {/* Document cards */}
      <div className="grid gap-5 md:grid-cols-3">
        {sections.map((section) => (
          <Link
            key={section.href}
            href={section.href}
            className="group flex flex-col gap-4 rounded-2xl border bg-card p-6 transition-all hover:border-primary/50 hover:shadow-lg"
          >
            <div className="flex size-12 items-center justify-center rounded-xl bg-primary/10">
              <section.icon className="size-6 text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-semibold tracking-tight">{section.title}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground">{section.description}</p>
            </div>
            <ul className="flex flex-wrap gap-1.5">
              {section.points.map((point) => (
                <li key={point} className="rounded-md bg-muted px-2 py-1 text-xs font-medium text-muted-foreground">
                  {point}
                </li>
              ))}
            </ul>
            <div className="mt-auto flex items-center gap-1 text-sm font-medium text-primary">
              Read full document
              <ChevronRight className="size-4 transition-transform group-hover:translate-x-1" />
            </div>
          </Link>
        ))}
      </div>

      {/* Contact bar */}
      <div className="mt-16 flex flex-col items-center gap-3 rounded-2xl border bg-muted/30 p-8 text-center">
        <p className="text-sm text-muted-foreground">
          Last updated: {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
        </p>
        <p className="text-sm text-muted-foreground">
          Questions about our terms? Contact us at{" "}
          <a href="mailto:legal@xerinmarket.com" className="font-medium text-primary underline underline-offset-4">
            legal@xerinmarket.com
          </a>
        </p>
      </div>
    </div>
  )
}
