import { Metadata } from "next"
import Link from "next/link"
import { Package, RotateCcw, Shield, Clock, CheckCircle2, XCircle, ArrowRight } from "lucide-react"

export const metadata: Metadata = {
  title: "Return Policy — XerinMarket",
  description: "Understand XerinMarket's return and refund policy. How to initiate returns, eligibility, and timelines.",
}

const steps = [
  {
    icon: Package,
    title: "Request a Return",
    description: "Go to your order history, select the item, and click 'Return Item' within the return window.",
  },
  {
    icon: RotateCcw,
    title: "Pack & Ship",
    description: "Pack the item in its original packaging with all accessories. Our courier will pick it up.",
  },
  {
    icon: CheckCircle2,
    title: "Inspection",
    description: "Our team inspects the returned item within 2–3 business days of receipt.",
  },
  {
    icon: Shield,
    title: "Refund Issued",
    description: "Once approved, your refund is processed to the original payment method within 5–7 days.",
  },
]

const eligible = [
  "Item is defective or damaged on arrival",
  "Wrong item was delivered",
  "Item doesn't match the product description",
  "Item is unused and in original packaging",
  "Return requested within 7 days of delivery",
]

const notEligible = [
  "Item has been used or worn",
  "Original packaging is missing or damaged",
  "Return requested after 7 days",
  "Intimate or hygiene products (for safety reasons)",
  "Digital products or subscriptions",
  "Customized or personalized items",
]

const timelines = [
  { window: "Return Window", period: "7 days from delivery" },
  { window: "Pickup Time", period: "2–3 business days" },
  { window: "Inspection", period: "2–3 business days" },
  { window: "Refund Processing", period: "5–7 business days" },
]

export default function ReturnsPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12 md:py-20">
      {/* Hero */}
      <div className="flex flex-col items-center gap-4 text-center mb-16">
        <div className="flex size-16 items-center justify-center rounded-2xl bg-primary/10">
          <RotateCcw className="size-8 text-primary" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight md:text-5xl">Return & Refund Policy</h1>
        <p className="max-w-2xl text-base text-muted-foreground md:text-lg">
          We want you to love every purchase. If something isn&apos;t right, here&apos;s how returns work at XerinMarket.
        </p>
      </div>

      {/* Timelines */}
      <div className="mb-16 grid grid-cols-2 gap-4 md:grid-cols-4">
        {timelines.map((timeline) => (
          <div key={timeline.window} className="flex flex-col items-center gap-1 rounded-xl border bg-card p-5 text-center">
            <Clock className="mb-2 size-5 text-primary" />
            <span className="text-xs font-medium text-muted-foreground">{timeline.window}</span>
            <span className="text-sm font-semibold">{timeline.period}</span>
          </div>
        ))}
      </div>

      {/* How to Return */}
      <div className="mb-16">
        <h2 className="mb-8 text-center text-2xl font-bold tracking-tight">How to Return an Item</h2>
        <div className="grid gap-5 md:grid-cols-4">
          {steps.map((step, index) => (
            <div key={step.title} className="relative flex flex-col gap-3 rounded-xl border bg-card p-5">
              <div className="absolute -top-3 -left-1 flex size-7 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                {index + 1}
              </div>
              <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
                <step.icon className="size-5 text-primary" />
              </div>
              <h3 className="text-sm font-semibold">{step.title}</h3>
              <p className="text-xs text-muted-foreground">{step.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Eligibility */}
      <div className="mb-16 grid gap-6 md:grid-cols-2">
        <div className="rounded-2xl border bg-card p-6">
          <div className="mb-4 flex items-center gap-2">
            <CheckCircle2 className="size-5 text-green-600" />
            <h2 className="text-lg font-bold">Eligible for Return</h2>
          </div>
          <ul className="flex flex-col gap-2.5">
            {eligible.map((item) => (
              <li key={item} className="flex items-start gap-2 text-sm text-muted-foreground">
                <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-green-600" />
                {item}
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-2xl border bg-card p-6">
          <div className="mb-4 flex items-center gap-2">
            <XCircle className="size-5 text-red-600" />
            <h2 className="text-lg font-bold">Not Eligible</h2>
          </div>
          <ul className="flex flex-col gap-2.5">
            {notEligible.map((item) => (
              <li key={item} className="flex items-start gap-2 text-sm text-muted-foreground">
                <XCircle className="mt-0.5 size-4 shrink-0 text-red-600" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Refund Methods */}
      <div className="mb-16 rounded-2xl border bg-muted/30 p-8">
        <h2 className="mb-4 text-xl font-bold">Refund Methods</h2>
        <p className="mb-4 text-sm text-muted-foreground">
          Refunds are issued to your original payment method:
        </p>
        <ul className="flex flex-col gap-2 text-sm">
          <li className="flex items-center gap-2">
            <div className="size-1.5 rounded-full bg-primary" />
            <span><strong>Mobile Money:</strong> Refund credited within 1–3 business days</span>
          </li>
          <li className="flex items-center gap-2">
            <div className="size-1.5 rounded-full bg-primary" />
            <span><strong>Bank Transfer:</strong> Refund credited within 3–5 business days</span>
          </li>
          <li className="flex items-center gap-2">
            <div className="size-1.5 rounded-full bg-primary" />
            <span><strong>Card Payment:</strong> Refund credited within 5–7 business days</span>
          </li>
          <li className="flex items-center gap-2">
            <div className="size-1.5 rounded-full bg-primary" />
            <span><strong>XerinWallet:</strong> Instant refund to your wallet balance</span>
          </li>
        </ul>
      </div>

      {/* CTA */}
      <div className="flex flex-col items-center gap-4 rounded-2xl border bg-muted/30 p-8 text-center">
        <h2 className="text-xl font-bold">Need Help with a Return?</h2>
        <p className="max-w-lg text-sm text-muted-foreground">
          Our support team is ready to assist you with any return or refund questions.
        </p>
        <div className="flex gap-3">
          <Link
            href="/contact"
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Contact Support
            <ArrowRight className="size-4" />
          </Link>
          <Link
            href="/help"
            className="inline-flex items-center justify-center gap-2 rounded-lg border px-6 py-3 text-sm font-medium hover:bg-muted"
          >
            Help Center
          </Link>
        </div>
      </div>
    </div>
  )
}
