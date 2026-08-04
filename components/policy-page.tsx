import Link from "next/link"
import { ArrowRight, FileText, Mail, MapPin } from "lucide-react"

export type PolicySection = {
  title: string
  paragraphs: string[]
  bullets?: string[]
}

export function PolicyPage({ title, description, sections }: { title: string; description: string; sections: PolicySection[] }) {
  return <main className="mx-auto max-w-4xl px-4 py-12 md:py-20">
    <header className="mb-12 flex flex-col items-center gap-4 text-center">
      <div className="flex size-16 items-center justify-center rounded-2xl bg-primary/10"><FileText className="size-8 text-primary" /></div>
      <h1 className="text-3xl font-bold tracking-tight md:text-5xl">{title}</h1>
      <p className="max-w-2xl text-base text-muted-foreground md:text-lg">{description}</p>
      <p className="text-xs text-muted-foreground">Governed by the laws of the United Republic of Tanzania.</p>
    </header>
    <div className="space-y-6">{sections.map((section, index) => <section key={section.title} className="rounded-2xl border bg-card p-6 md:p-8">
      <div className="mb-4 flex items-start gap-3"><span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">{index + 1}</span><h2 className="pt-0.5 text-xl font-bold">{section.title}</h2></div>
      <div className="space-y-3 text-sm leading-7 text-muted-foreground md:text-base">{section.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}{section.bullets && <ul className="space-y-2 pl-5">{section.bullets.map((bullet) => <li key={bullet} className="list-disc">{bullet}</li>)}</ul>}</div>
    </section>)}</div>
    <aside className="mt-10 rounded-2xl border bg-muted/30 p-6 md:p-8"><h2 className="text-xl font-bold">Questions or complaints?</h2><p className="mt-2 text-sm text-muted-foreground">Xerin handles concerns fairly and promptly through its designated support channels.</p><div className="mt-5 flex flex-col gap-3 sm:flex-row"><a href="mailto:support@xerin.co.tz" className="inline-flex items-center gap-2 text-sm font-medium text-primary"><Mail className="size-4" /> support@xerin.co.tz</a><span className="inline-flex items-center gap-2 text-sm text-muted-foreground"><MapPin className="size-4" /> Dar es Salaam, Tanzania</span></div><Link href="/contact" className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-primary">Contact support <ArrowRight className="size-4" /></Link></aside>
  </main>
}
