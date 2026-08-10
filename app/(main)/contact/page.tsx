import type { Metadata } from "next"
import Link from "next/link"
import { HelpCircle, Mail, MapPin, MessageSquare, Phone, MessageCircle, Ticket } from "lucide-react"

export const metadata: Metadata = { title: "Contact Us — XerinMarket", description: "Contact Xerin support for marketplace questions and complaints. Phone, WhatsApp, email, and Help Center available." }

export default function ContactPage() { return <main className="mx-auto max-w-4xl px-4 py-12 md:py-20">
  <header className="mb-12 flex flex-col items-center gap-4 text-center"><div className="flex size-16 items-center justify-center rounded-2xl bg-primary/10"><MessageSquare className="size-8 text-primary" /></div><h1 className="text-3xl font-bold tracking-tight md:text-5xl">Contact Us</h1><p className="max-w-2xl text-muted-foreground md:text-lg">We're here to help. Reach out through any of our support channels below — we aim to respond within 24 hours.</p></header>
  <div className="grid gap-6 md:grid-cols-2">
    <a href="tel:+255222000000" className="group rounded-2xl border bg-card p-8 transition hover:border-primary/50">
      <div className="flex size-12 items-center justify-center rounded-xl bg-primary/10"><Phone className="size-6 text-primary" /></div>
      <h2 className="mt-5 text-xl font-bold">Phone Support</h2>
      <p className="mt-2 text-sm text-muted-foreground">Mon–Fri, 8:00 AM – 6:00 PM (EAT)</p>
      <p className="mt-4 font-semibold text-primary">+255 22 200 0000</p>
    </a>
    <a href="https://wa.me/255222000000" target="_blank" rel="noopener noreferrer" className="group rounded-2xl border bg-card p-8 transition hover:border-primary/50">
      <div className="flex size-12 items-center justify-center rounded-xl bg-green-500/10"><MessageCircle className="size-6 text-green-600" /></div>
      <h2 className="mt-5 text-xl font-bold">WhatsApp</h2>
      <p className="mt-2 text-sm text-muted-foreground">Quick answers on the go. Chat with our support team.</p>
      <p className="mt-4 font-semibold text-green-600">+255 22 200 0000</p>
    </a>
    <a href="mailto:support@xerin.co.tz" className="group rounded-2xl border bg-card p-8 transition hover:border-primary/50">
      <div className="flex size-12 items-center justify-center rounded-xl bg-primary/10"><Mail className="size-6 text-primary" /></div>
      <h2 className="mt-5 text-xl font-bold">Email Support</h2>
      <p className="mt-2 text-sm text-muted-foreground">Send order, account, seller or policy questions to:</p>
      <p className="mt-4 font-semibold text-primary">support@xerin.co.tz</p>
    </a>
    <div className="rounded-2xl border bg-card p-8">
      <div className="flex size-12 items-center justify-center rounded-xl bg-primary/10"><MapPin className="size-6 text-primary" /></div>
      <h2 className="mt-5 text-xl font-bold">Registered Office</h2>
      <p className="mt-2 text-sm text-muted-foreground">Xerin's registered office is located in:</p>
      <p className="mt-4 font-semibold">Dar es Salaam, Tanzania</p>
    </div>
  </div>
  <div className="mt-8 rounded-2xl border bg-primary/5 p-6">
    <div className="flex items-start gap-4">
      <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary/10"><Ticket className="size-6 text-primary" /></div>
      <div className="flex-1">
        <h2 className="font-bold">Support Ticket Reference</h2>
        <p className="mt-1 text-sm text-muted-foreground">When you contact support, you'll receive a ticket reference number (e.g. XM-SUP-00123). Use this reference to track the status of your inquiry. Always include your order reference (e.g. XM-260811-00125) when contacting us about a specific order for faster resolution.</p>
      </div>
    </div>
  </div>
  <aside className="mt-8 flex flex-col items-start gap-4 rounded-2xl border bg-muted/30 p-6 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="flex items-center gap-2 font-bold"><HelpCircle className="size-5 text-primary" /> Need a quick answer?</h2><p className="mt-1 text-sm text-muted-foreground">Visit the Help Center for guidance about accounts, orders, shipping, returns and refunds.</p></div><Link href="/help" className="shrink-0 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground">Open Help Center</Link></aside>
</main> }
