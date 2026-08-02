import { Metadata } from "next"
import { Mail, MapPin, Phone, Clock, MessageSquare, Send } from "lucide-react"

export const metadata: Metadata = {
  title: "Contact Us — XerinMarket",
  description: "Get in touch with XerinMarket. We're here to help with any questions about buying, selling, or your account.",
}

const contactMethods = [
  {
    icon: Mail,
    title: "Email Us",
    description: "We'll respond within 24 hours",
    value: "support@xerinmarket.com",
    href: "mailto:support@xerinmarket.com",
  },
  {
    icon: Phone,
    title: "Call Us",
    description: "Mon–Fri, 9am–6pm EAT",
    value: "+255 123 456 789",
    href: "tel:+255123456789",
  },
  {
    icon: MessageSquare,
    title: "Live Chat",
    description: "Available in the app",
    value: "Chat with support",
    href: "/help",
  },
]

const offices = [
  {
    city: "Dar es Salaam",
    address: "Plot 123, Mlimani Tower, Sam Nujoma Road",
    country: "Tanzania",
  },
  {
    city: "Nairobi",
    address: "Westlands, 4th Floor, Office 402",
    country: "Kenya",
  },
  {
    city: "Kampala",
    address: "Kololo Hill Drive, Suite 15",
    country: "Uganda",
  },
]

const faqs = [
  {
    question: "How do I track my order?",
    answer: "Go to 'Track Order' in the menu and enter your order number to see real-time delivery status.",
  },
  {
    question: "How do I become a seller?",
    answer: "Click 'Become a Seller' and complete the registration. Our team reviews and approves verified sellers within 48 hours.",
  },
  {
    question: "What payment methods are supported?",
    answer: "We support mobile money (M-Pesa, Tigo Pesa, Airtel Money), bank transfers, and major credit/debit cards.",
  },
  {
    question: "How do refunds work?",
    answer: "If your order qualifies for a refund, the amount is credited back to your original payment method within 5–7 business days.",
  },
]

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-12 md:py-20">
      {/* Hero */}
      <div className="flex flex-col items-center gap-4 text-center mb-16">
        <div className="flex size-16 items-center justify-center rounded-2xl bg-primary/10">
          <Mail className="size-8 text-primary" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight md:text-5xl">Contact Us</h1>
        <p className="max-w-2xl text-base text-muted-foreground md:text-lg">
          Questions, feedback, or need help? We&apos;re here for you. Reach out through any of the channels below.
        </p>
      </div>

      {/* Contact Methods */}
      <div className="mb-16 grid gap-5 md:grid-cols-3">
        {contactMethods.map((method) => (
          <a
            key={method.title}
            href={method.href}
            className="group flex flex-col items-center gap-3 rounded-2xl border bg-card p-6 text-center transition-all hover:border-primary/50 hover:shadow-lg"
          >
            <div className="flex size-12 items-center justify-center rounded-xl bg-primary/10 transition-colors group-hover:bg-primary/20">
              <method.icon className="size-6 text-primary" />
            </div>
            <h3 className="text-lg font-semibold">{method.title}</h3>
            <p className="text-sm text-muted-foreground">{method.description}</p>
            <span className="text-sm font-medium text-primary">{method.value}</span>
          </a>
        ))}
      </div>

      {/* Contact Form + Info */}
      <div className="mb-16 grid gap-8 md:grid-cols-2">
        {/* Form */}
        <div className="rounded-2xl border bg-card p-6 md:p-8">
          <h2 className="mb-6 text-xl font-bold">Send us a message</h2>
          <form className="flex flex-col gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium">First Name</label>
                <input
                  type="text"
                  placeholder="John"
                  className="rounded-lg border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium">Last Name</label>
                <input
                  type="text"
                  placeholder="Doe"
                  className="rounded-lg border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium">Email</label>
              <input
                type="email"
                placeholder="john@example.com"
                className="rounded-lg border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium">Subject</label>
              <select className="rounded-lg border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary">
                <option>General Inquiry</option>
                <option>Order Support</option>
                <option>Seller Account</option>
                <option>Technical Issue</option>
                <option>Partnership</option>
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium">Message</label>
              <textarea
                rows={5}
                placeholder="Tell us how we can help..."
                className="resize-none rounded-lg border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              />
            </div>
            <button
              type="submit"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              <Send className="size-4" />
              Send Message
            </button>
          </form>
        </div>

        {/* Info */}
        <div className="flex flex-col gap-6">
          {/* Offices */}
          <div className="rounded-2xl border bg-card p-6">
            <div className="mb-4 flex items-center gap-2">
              <MapPin className="size-5 text-primary" />
              <h2 className="text-xl font-bold">Our Offices</h2>
            </div>
            <div className="flex flex-col gap-4">
              {offices.map((office) => (
                <div key={office.city} className="flex flex-col gap-1 border-b pb-3 last:border-0 last:pb-0">
                  <span className="font-medium">{office.city}, {office.country}</span>
                  <span className="text-sm text-muted-foreground">{office.address}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Hours */}
          <div className="rounded-2xl border bg-card p-6">
            <div className="mb-4 flex items-center gap-2">
              <Clock className="size-5 text-primary" />
              <h2 className="text-xl font-bold">Business Hours</h2>
            </div>
            <div className="flex flex-col gap-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Monday – Friday</span>
                <span className="font-medium">9:00 AM – 6:00 PM</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Saturday</span>
                <span className="font-medium">10:00 AM – 4:00 PM</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Sunday</span>
                <span className="font-medium">Closed</span>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">All times are in East Africa Time (EAT, UTC+3)</p>
            </div>
          </div>
        </div>
      </div>

      {/* FAQ */}
      <div className="mb-16">
        <h2 className="mb-8 text-center text-2xl font-bold tracking-tight">Frequently Asked Questions</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {faqs.map((faq) => (
            <div key={faq.question} className="rounded-xl border bg-card p-5">
              <h3 className="mb-2 font-semibold">{faq.question}</h3>
              <p className="text-sm text-muted-foreground">{faq.answer}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
