"use client"

import Link from "next/link"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { HelpCircle, Mail } from "lucide-react"

const questions = [
  { q: "What is XerinMarket?", a: "Xerin is an online marketplace that facilitates transactions between buyers and sellers unless explicitly stated otherwise." },
  { q: "What information must I provide?", a: "Users must provide accurate and current account information. Xerin may process names, contact details, payment information, delivery addresses and transaction records to provide its services." },
  { q: "How is my personal information protected?", a: "Xerin uses reasonable technical and organisational measures to protect personal information against unauthorised access, loss or misuse, in line with Tanzania’s Personal Data Protection Act, 2022." },
  { q: "When can I request a refund?", a: "A refund may be available where goods are defective, not delivered or materially different from their description. Submit the request within the period communicated at purchase or delivery." },
  { q: "How will an approved refund be paid?", a: "Approved refunds are processed using the original payment method. Processing time may depend on the payment provider." },
  { q: "How do shipping and delivery estimates work?", a: "Products should be dispatched within the timeline agreed at sale. Delivery estimates may vary by location and logistics, and shipping costs are shown before checkout." },
  { q: "What are sellers responsible for?", a: "Sellers must provide accurate business information, comply with Tanzanian law and take responsibility for the quality, legality and pricing of their products." },
  { q: "What content or behaviour is prohibited?", a: "Unlawful, misleading or infringing content, fraud, impersonation, malware distribution and abusive behaviour are prohibited. Xerin may remove content or suspend accounts that violate these rules." },
  { q: "How do I request account deletion?", a: "Request deletion through the application or customer support. Some records may be retained where required by law or for dispute resolution." },
]

export default function HelpPage() { return <main className="mx-auto max-w-4xl px-4 py-12 md:py-20"><header className="mb-12 flex flex-col items-center gap-4 text-center"><div className="flex size-16 items-center justify-center rounded-2xl bg-primary/10"><HelpCircle className="size-8 text-primary" /></div><h1 className="text-3xl font-bold tracking-tight md:text-5xl">Help Center</h1><p className="max-w-2xl text-muted-foreground md:text-lg">Clear guidance based on Xerin’s official marketplace policies.</p></header><section className="rounded-2xl border bg-card p-5 md:p-8"><Accordion>{questions.map((item,index)=><AccordionItem key={item.q} value={`question-${index}`}><AccordionTrigger>{item.q}</AccordionTrigger><AccordionContent><p className="leading-7 text-muted-foreground">{item.a}</p></AccordionContent></AccordionItem>)}</Accordion></section><aside className="mt-8 flex flex-col items-center rounded-2xl border bg-muted/30 p-8 text-center"><Mail className="size-7 text-primary" /><h2 className="mt-3 text-xl font-bold">Still need help?</h2><p className="mt-2 text-sm text-muted-foreground">Contact Xerin support for questions or complaints.</p><a href="mailto:support@xerin.co.tz" className="mt-4 font-semibold text-primary">support@xerin.co.tz</a><div className="mt-5 flex gap-3"><Link href="/terms" className="rounded-lg border px-4 py-2 text-sm font-medium">Terms</Link><Link href="/privacy" className="rounded-lg border px-4 py-2 text-sm font-medium">Privacy</Link><Link href="/returns" className="rounded-lg border px-4 py-2 text-sm font-medium">Returns</Link></div></aside></main> }
