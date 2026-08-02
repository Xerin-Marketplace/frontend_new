import { Metadata } from "next"
import Link from "next/link"
import { Heart, Shield, Zap, Users, Globe, TrendingUp, Mail, MapPin, Phone } from "lucide-react"

export const metadata: Metadata = {
  title: "About Us — XerinMarket",
  description: "Learn about XerinMarket, the marketplace built for Africa. Our mission, values, and commitment to connecting buyers and sellers.",
}

const values = [
  {
    icon: Shield,
    title: "Trust & Safety",
    description: "Every seller is verified, every transaction is protected. We build confidence into every step of the marketplace.",
  },
  {
    icon: Zap,
    title: "Fast & Reliable",
    description: "Quick deliveries, instant payments, and responsive support. We make commerce effortless.",
  },
  {
    icon: Heart,
    title: "Customer First",
    description: "From discovery to delivery, we obsess over creating the best experience for buyers and sellers alike.",
  },
  {
    icon: Globe,
    title: "Built for Africa",
    description: "Designed with local needs in mind — mobile money, local logistics, and languages that matter.",
  },
]

const stats = [
  { label: "Active Sellers", value: "500+" },
  { label: "Products Listed", value: "10,000+" },
  { label: "Cities Served", value: "25" },
  { label: "Happy Customers", value: "50,000+" },
]

const milestones = [
  {
    year: "2024",
    title: "The Idea",
    description: "XerinMarket was born from a simple observation: African commerce needed a platform that understood local realities.",
  },
  {
    year: "2024",
    title: "Platform Launch",
    description: "We launched with a focus on verified sellers, secure payments, and fast delivery across major cities.",
  },
  {
    year: "2025",
    title: "Growth & Expansion",
    description: "Expanded to serve thousands of sellers and buyers, adding mobile money, escrow payments, and seller analytics.",
  },
  {
    year: "2026",
    title: "The Future",
    description: "Building AI-powered recommendations, expanded logistics networks, and deeper community connections.",
  },
]

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-12 md:py-20">
      {/* Hero */}
      <div className="flex flex-col items-center gap-4 text-center mb-16">
        <div className="flex size-16 items-center justify-center rounded-2xl bg-primary/10">
          <Users className="size-8 text-primary" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight md:text-5xl">About XerinMarket</h1>
        <p className="max-w-2xl text-base text-muted-foreground md:text-lg">
          We&apos;re building Africa&apos;s most trusted marketplace — where buyers shop with confidence and sellers grow their businesses.
        </p>
      </div>

      {/* Stats */}
      <div className="mb-16 grid grid-cols-2 gap-4 md:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="flex flex-col items-center gap-1 rounded-xl border bg-card p-6 text-center">
            <span className="text-2xl font-bold text-primary md:text-3xl">{stat.value}</span>
            <span className="text-xs text-muted-foreground md:text-sm">{stat.label}</span>
          </div>
        ))}
      </div>

      {/* Mission */}
      <div className="mb-16 rounded-2xl border bg-muted/30 p-8 md:p-12">
        <h2 className="mb-4 text-2xl font-bold tracking-tight">Our Mission</h2>
        <p className="text-base text-muted-foreground md:text-lg">
          To empower African entrepreneurs and shoppers with a marketplace that is safe, fast, and built for local needs.
          We believe commerce should be transparent, payments should be secure, and every product should arrive as promised.
          XerinMarket connects verified sellers with millions of buyers, providing the tools and trust needed to thrive in
          the digital economy.
        </p>
      </div>

      {/* Values */}
      <div className="mb-16">
        <h2 className="mb-8 text-center text-2xl font-bold tracking-tight">Our Values</h2>
        <div className="grid gap-5 sm:grid-cols-2">
          {values.map((value) => (
            <div key={value.title} className="flex flex-col gap-3 rounded-xl border bg-card p-6">
              <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
                <value.icon className="size-5 text-primary" />
              </div>
              <h3 className="text-lg font-semibold">{value.title}</h3>
              <p className="text-sm text-muted-foreground">{value.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Timeline */}
      <div className="mb-16">
        <h2 className="mb-8 text-center text-2xl font-bold tracking-tight">Our Journey</h2>
        <div className="relative space-y-8 before:absolute before:in-y-0 before:left-4 before:h-full before:w-px before:bg-border md:before:left-1/2">
          {milestones.map((milestone, index) => (
            <div
              key={milestone.title}
              className={`relative flex flex-col gap-2 pl-12 md:w-1/2 md:pl-0 ${
                index % 2 === 0 ? "md:ml-auto md:pl-12" : "md:mr-auto md:pr-12 md:text-right"
              }`}
            >
              <div
                className={`absolute left-0 top-1 flex size-8 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground md:${index % 2 === 0 ? "left-[-1rem]" : "right-[-1rem] left-auto"}`}
              >
                {index + 1}
              </div>
              <span className="text-sm font-medium text-primary">{milestone.year}</span>
              <h3 className="text-lg font-semibold">{milestone.title}</h3>
              <p className="text-sm text-muted-foreground">{milestone.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Contact CTA */}
      <div className="flex flex-col items-center gap-6 rounded-2xl border bg-muted/30 p-8 text-center">
        <h2 className="text-2xl font-bold tracking-tight">Get in Touch</h2>
        <p className="max-w-xl text-sm text-muted-foreground">
          Have questions, partnerships, or feedback? We&apos;d love to hear from you.
        </p>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Link
            href="/contact"
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            <Mail className="size-4" />
            Contact Us
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
