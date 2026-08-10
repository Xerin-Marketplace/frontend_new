import type { Metadata } from "next"
import Link from "next/link"
import { ArrowRight, Gavel, HeartHandshake, ShieldCheck, Store, Users } from "lucide-react"

export const metadata: Metadata = { title: "About Us — XerinMarket", description: "Tanzania's Trusted Online Marketplace. Learn how Xerin connects buyers and sellers through a safe and responsible platform." }

const commitments = [
  { icon: ShieldCheck, title: "Privacy and safety", text: "We protect personal information with reasonable technical and organisational safeguards." },
  { icon: Store, title: "Responsible selling", text: "Sellers are responsible for accurate information and the quality, legality and pricing of their products." },
  { icon: HeartHandshake, title: "Fair resolutions", text: "We provide support channels for questions, complaints and marketplace disputes." },
  { icon: Gavel, title: "Tanzanian law", text: "Our marketplace policies are governed by the laws of the United Republic of Tanzania." },
]

export default function AboutPage() { return <main className="mx-auto max-w-5xl px-4 py-12 md:py-20">
  <header className="mb-14 flex flex-col items-center gap-4 text-center"><div className="flex size-16 items-center justify-center rounded-2xl bg-primary/10"><Users className="size-8 text-primary" /></div><h1 className="text-3xl font-bold tracking-tight md:text-5xl">About XerinMarket</h1><p className="text-sm font-medium text-primary md:text-base">Tanzania's Trusted Online Marketplace — Shop Local. Connect Globally.</p><p className="max-w-2xl text-base leading-8 text-muted-foreground md:text-lg">Xerin is an online marketplace that facilitates transactions between buyers and sellers. We work to make digital trade transparent, secure and accessible while respecting the laws of Tanzania.</p></header>
  <section className="mb-14 rounded-2xl border bg-muted/30 p-8 md:p-12"><h2 className="text-2xl font-bold">A marketplace built on responsibility</h2><p className="mt-4 leading-8 text-muted-foreground">Buyers rely on clear product information, visible shipping costs and fair support. Sellers are expected to provide accurate business information and lawful products. Xerin provides the platform, safeguards and policies that help both sides trade with greater confidence.</p></section>
  <section><h2 className="mb-8 text-center text-2xl font-bold">Our commitments</h2><div className="grid gap-5 sm:grid-cols-2">{commitments.map((item)=><article key={item.title} className="rounded-xl border bg-card p-6"><div className="mb-4 flex size-11 items-center justify-center rounded-xl bg-primary/10"><item.icon className="size-5 text-primary" /></div><h3 className="font-semibold">{item.title}</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">{item.text}</p></article>)}</div></section>
  <section className="mt-14 flex flex-col items-center rounded-2xl border bg-muted/30 p-8 text-center"><h2 className="text-xl font-bold">Learn before you trade</h2><p className="mt-2 max-w-xl text-sm text-muted-foreground">Read our marketplace terms and policies to understand your rights and responsibilities.</p><div className="mt-5 flex flex-wrap justify-center gap-3"><Link href="/terms" className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground">Terms of Service <ArrowRight className="size-4" /></Link><Link href="/contact" className="rounded-lg border px-5 py-2.5 text-sm font-medium">Contact Us</Link></div></section>
  </main> }
