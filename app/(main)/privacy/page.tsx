import { Metadata } from "next"
import Link from "next/link"
import { Shield, User, Store, ArrowLeft, Lock, Eye, Database, Clock, Mail, FileText, KeyRound, Globe } from "lucide-react"

export const metadata: Metadata = {
  title: "Privacy Policy — XerinMarket",
  description: "How XerinMarket collects, uses, and protects your personal data. Privacy information for customers and sellers.",
}

const lastUpdated = "August 2026"

const tocItems = [
  { num: "1", title: "Introduction" },
  { num: "2", title: "Information We Collect" },
  { num: "3", title: "How We Use Your Information" },
  { num: "4", title: "Legal Basis for Processing" },
  { num: "5", title: "Sharing Your Information" },
  { num: "6", title: "Data Security" },
  { num: "7", title: "Data Retention" },
  { num: "8", title: "Your Rights" },
  { num: "9", title: "Cookies" },
  { num: "10", title: "Children's Privacy" },
  { num: "11", title: "International Transfers" },
  { num: "12", title: "Marketing Communications" },
  { num: "13", title: "Changes to This Policy" },
  { num: "14", title: "Contact Us" },
]

const keyPoints = [
  { icon: Lock, title: "Encrypted & Secure", desc: "bcrypt passwords, TLS/SSL, OTP verification" },
  { icon: Eye, title: "Transparent", desc: "We tell you exactly what we collect and why" },
  { icon: Shield, title: "PDPA 2022 Compliant", desc: "Aligned with Tanzania's data protection law" },
  { icon: KeyRound, title: "Your Rights", desc: "Access, correct, delete, or export your data" },
]

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-12 md:py-16">
      <Link href="/terms" className="mb-8 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> All Terms
      </Link>

      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <div className="flex size-14 items-center justify-center rounded-2xl bg-primary/10">
          <Shield className="size-7 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight md:text-4xl">Privacy Policy</h1>
          <p className="text-sm text-muted-foreground">Last updated: {lastUpdated}</p>
        </div>
      </div>

      {/* Key highlights */}
      <div className="mb-12 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {keyPoints.map((kp) => (
          <div key={kp.title} className="flex items-start gap-3 rounded-xl border bg-card p-4">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <kp.icon className="size-4.5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-semibold">{kp.title}</p>
              <p className="text-xs text-muted-foreground">{kp.desc}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-8">
        {/* Table of contents - desktop */}
        <aside className="hidden lg:block w-56 shrink-0">
          <div className="sticky top-8">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Contents</p>
            <nav className="flex flex-col gap-1">
              {tocItems.map((item) => (
                <a
                  key={item.num}
                  href={`#section-${item.num}`}
                  className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  <span className="flex size-5 shrink-0 items-center justify-center rounded bg-muted text-xs font-medium">
                    {item.num}
                  </span>
                  {item.title}
                </a>
              ))}
            </nav>
          </div>
        </aside>

        {/* Content */}
        <div className="min-w-0 flex-1">
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <h2 id="section-1">1. Introduction</h2>
            <p>
              XerinMarket ("we," "us," "our") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, store, and share your personal information when you use our Platform at xerinmarketplace.com, whether as a customer, seller, or visitor.
            </p>
            <p>
              This Policy applies to all users. For seller-specific data practices, see <Link href="/terms/seller" className="text-primary underline">Seller Terms</Link>. For customer-specific practices, see <Link href="/terms/customer" className="text-primary underline">Customer Terms</Link>.
            </p>
            <div className="not-prose my-4 rounded-lg border border-primary/20 bg-primary/5 p-4">
              <div className="flex items-start gap-2.5">
                <Shield className="size-5 shrink-0 text-primary" />
                <div>
                  <p className="text-sm font-semibold text-foreground">Legal Compliance</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    We comply with the Personal Data Protection Act, 2022 of the United Republic of Tanzania and other applicable data protection laws.
                  </p>
                </div>
              </div>
            </div>

            <h2 id="section-2">2. Information We Collect</h2>
            <h3>2.1 Information You Provide</h3>
            <ul>
              <li><strong>Account Information:</strong> First name, last name, email address, phone number, and password.</li>
              <li><strong>Profile Data:</strong> Date of birth, gender, profile picture (optional).</li>
              <li><strong>Address Information:</strong> Shipping addresses, including street, city, region, and postal code.</li>
              <li><strong>Payment Information:</strong> Payment method details (mobile money numbers, card tokens). We do not store full card numbers — payments are processed by our PCI-compliant payment partners (AzamPay).</li>
              <li><strong>Seller Information:</strong> Business name, business category, KYC documents (ID, passport, business registration, TIN), payout account details.</li>
              <li><strong>Communications:</strong> Messages between buyers and sellers, customer support requests.</li>
            </ul>
            <h3>2.2 Information We Collect Automatically</h3>
            <ul>
              <li><strong>Device and Usage Data:</strong> IP address, browser type, device information, pages visited, time spent, and click data.</li>
              <li><strong>Location Data:</strong> Approximate location based on IP address for shipping estimates and fraud prevention.</li>
              <li><strong>Cookies and Local Storage:</strong> Authentication tokens, theme preferences, cart contents, and analytics.</li>
            </ul>

            <h2 id="section-3">3. How We Use Your Information</h2>
            <h3>3.1 For Customers</h3>
            <ul>
              <li>Process and fulfill your orders, including shipping and delivery.</li>
              <li>Send order confirmations, shipping updates, and delivery notifications.</li>
              <li>Provide customer support and resolve disputes.</li>
              <li>Recommend products based on your browsing and purchase history.</li>
              <li>Send promotional offers and newsletters (only if you opt in).</li>
              <li>Verify your identity and prevent fraud.</li>
            </ul>
            <h3>3.2 For Sellers</h3>
            <ul>
              <li>Verify your identity through KYC documents.</li>
              <li>Process payouts to your registered account.</li>
              <li>Provide seller analytics, order management, and customer communication tools.</li>
              <li>Monitor seller performance and enforce platform policies.</li>
              <li>Calculate and process commission fees and tax obligations.</li>
            </ul>
            <h3>3.3 For All Users</h3>
            <ul>
              <li>Maintain platform security and prevent fraud, abuse, and unauthorized access.</li>
              <li>Comply with legal obligations and law enforcement requests.</li>
              <li>Improve our Platform, features, and user experience.</li>
              <li>Conduct analytics and research to understand user behavior.</li>
            </ul>

            <h2 id="section-4">4. Legal Basis for Processing</h2>
            <p>We process your personal data based on the following legal grounds:</p>
            <ul>
              <li><strong>Consent:</strong> When you agree to receive marketing communications or provide optional information.</li>
              <li><strong>Contract Performance:</strong> To fulfill orders, process payments, and provide seller services.</li>
              <li><strong>Legal Obligation:</strong> To comply with tax laws, KYC requirements, and law enforcement requests.</li>
              <li><strong>Legitimate Interest:</strong> To prevent fraud, ensure platform security, and improve our services.</li>
            </ul>

            <h2 id="section-5">5. Sharing Your Information</h2>
            <div className="not-prose my-4 rounded-lg border border-amber-500/20 bg-amber-500/5 p-4">
              <div className="flex items-start gap-2.5">
                <Database className="size-5 shrink-0 text-amber-600" />
                <div>
                  <p className="text-sm font-semibold text-foreground">We Never Sell Your Data</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    XerinMarket does not sell your personal data to any third party. We only share information necessary for fulfilling orders, processing payments, and complying with legal obligations.
                  </p>
                </div>
              </div>
            </div>
            <p>We share information with:</p>
            <ul>
              <li><strong>Sellers:</strong> When you place an order, the seller receives your name, shipping address, and phone number to fulfill the order.</li>
              <li><strong>Payment Partners:</strong> AzamPay and mobile money providers process your payments. They receive transaction details but not your full profile.</li>
              <li><strong>Shipping Partners:</strong> Logistics companies receive delivery address and contact information.</li>
              <li><strong>Service Providers:</strong> Cloud hosting, SMS/email gateways, and analytics providers who help us operate the Platform.</li>
              <li><strong>Law Enforcement:</strong> When required by law or to protect the rights, property, or safety of XerinMarket, our users, or others.</li>
            </ul>

            <h2 id="section-6">6. Data Security</h2>
            <div className="not-prose my-4 grid gap-2 sm:grid-cols-2">
              <div className="flex items-center gap-2.5 rounded-lg border bg-card p-3">
                <Lock className="size-4 shrink-0 text-primary" />
                <p className="text-xs text-muted-foreground">Passwords hashed with bcrypt</p>
              </div>
              <div className="flex items-center gap-2.5 rounded-lg border bg-card p-3">
                <KeyRound className="size-4 shrink-0 text-primary" />
                <p className="text-xs text-muted-foreground">OTP codes hashed, expire in 5 min</p>
              </div>
              <div className="flex items-center gap-2.5 rounded-lg border bg-card p-3">
                <Globe className="size-4 shrink-0 text-primary" />
                <p className="text-xs text-muted-foreground">All API traffic TLS/SSL encrypted</p>
              </div>
              <div className="flex items-center gap-2.5 rounded-lg border bg-card p-3">
                <Shield className="size-4 shrink-0 text-primary" />
                <p className="text-xs text-muted-foreground">PCI-compliant payment processing</p>
              </div>
            </div>
            <ul>
              <li>Access to personal data is restricted to authorized personnel only.</li>
              <li>We conduct regular security reviews and vulnerability assessments.</li>
            </ul>
            <p>
              Despite our efforts, no system is 100% secure. If a data breach occurs, we will notify affected users and relevant authorities within 72 hours as required by law.
            </p>

            <h2 id="section-7">7. Data Retention</h2>
            <div className="not-prose my-4 overflow-hidden rounded-lg border">
              <table className="w-full text-sm">
                <thead className="bg-muted">
                  <tr>
                    <th className="px-4 py-2.5 text-left font-semibold">Data Type</th>
                    <th className="px-4 py-2.5 text-left font-semibold">Retention Period</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  <tr>
                    <td className="px-4 py-2.5">Active accounts</td>
                    <td className="px-4 py-2.5">While account is active</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2.5">Closed accounts</td>
                    <td className="px-4 py-2.5">90 days, then deleted</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2.5">Transaction records</td>
                    <td className="px-4 py-2.5">7 years (tax compliance)</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2.5">KYC documents</td>
                    <td className="px-4 py-2.5">Seller activity + 5 years</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2.5">Marketing data</td>
                    <td className="px-4 py-2.5">Until unsubscribe</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <h2 id="section-8">8. Your Rights</h2>
            <p>Under the Personal Data Protection Act, 2022, you have the right to:</p>
            <ul>
              <li><strong>Access:</strong> Request a copy of your personal data.</li>
              <li><strong>Rectification:</strong> Correct inaccurate or incomplete data.</li>
              <li><strong>Erasure:</strong> Request deletion of your data (subject to legal retention requirements).</li>
              <li><strong>Restriction:</strong> Limit how we process your data.</li>
              <li><strong>Data Portability:</strong> Receive your data in a structured, machine-readable format.</li>
              <li><strong>Objection:</strong> Object to processing based on legitimate interests.</li>
              <li><strong>Withdraw Consent:</strong> Withdraw consent for marketing communications at any time.</li>
            </ul>
            <p>
              To exercise these rights, email us at{" "}
              <a href="mailto:privacy@xerinmarket.com" className="text-primary underline">privacy@xerinmarket.com</a>. We will respond within 30 days.
            </p>

            <h2 id="section-9">9. Cookies</h2>
            <p>We use the following types of cookies and local storage:</p>
            <ul>
              <li><strong>Authentication:</strong> Store access and refresh tokens so you stay logged in.</li>
              <li><strong>Functional:</strong> Remember your theme preference (light/dark), language, and cart contents.</li>
              <li><strong>Analytics:</strong> Understand how users interact with the Platform (anonymized).</li>
            </ul>
            <p>
              You can control cookies through your browser settings. Disabling authentication cookies will prevent you from logging in.
            </p>

            <h2 id="section-10">10. Children's Privacy</h2>
            <p>
              XerinMarket is not intended for children under 18. We do not knowingly collect data from minors. If you believe a child has registered on our Platform, please contact us and we will delete the account immediately.
            </p>

            <h2 id="section-11">11. International Transfers</h2>
            <p>
              Your data is primarily stored on servers located in Tanzania and the European Union (via our cloud provider). If data is transferred outside Tanzania, we ensure appropriate safeguards are in place in compliance with data protection laws.
            </p>

            <h2 id="section-12">12. Marketing Communications</h2>
            <p>
              You may receive promotional emails, SMS, or push notifications only if you have opted in. You can unsubscribe at any time by:
            </p>
            <ul>
              <li>Clicking the unsubscribe link in any marketing email.</li>
              <li>Updating your notification preferences in your dashboard settings.</li>
              <li>Replying STOP to any marketing SMS.</li>
            </ul>

            <h2 id="section-13">13. Changes to This Privacy Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. We will notify you of significant changes via email or a notice on the Platform. The "Last updated" date at the top reflects the most recent revision.
            </p>

            <h2 id="section-14">14. Contact Us</h2>
            <p>
              If you have questions, concerns, or requests regarding your personal data, please contact our Data Protection Officer:
            </p>
            <div className="not-prose my-4 rounded-lg border bg-card p-5">
              <div className="flex items-start gap-3">
                <Mail className="size-5 shrink-0 text-primary" />
                <div>
                  <p className="text-sm font-semibold text-foreground">XerinMarket Data Protection Officer</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Email: <a href="mailto:privacy@xerinmarket.com" className="text-primary underline">privacy@xerinmarket.com</a><br />
                    Dar es Salaam, Tanzania
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Related documents */}
          <div className="mt-12 flex flex-col sm:flex-row gap-4">
            <Link href="/terms/customer" className="flex flex-1 items-center gap-3 rounded-xl border bg-card p-5 transition-all hover:border-primary/50 hover:shadow-md">
              <User className="size-5 text-primary" />
              <div>
                <p className="font-semibold">Customer Terms</p>
                <p className="text-sm text-muted-foreground">Terms for buyers</p>
              </div>
            </Link>
            <Link href="/terms/seller" className="flex flex-1 items-center gap-3 rounded-xl border bg-card p-5 transition-all hover:border-primary/50 hover:shadow-md">
              <Store className="size-5 text-primary" />
              <div>
                <p className="font-semibold">Seller Terms</p>
                <p className="text-sm text-muted-foreground">Terms for merchants</p>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
