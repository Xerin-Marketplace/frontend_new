import { Metadata } from "next"
import Link from "next/link"
import { ArrowLeft, Store, Wallet, Package, TrendingUp, FileCheck, AlertTriangle, ShieldCheck, Ban, User } from "lucide-react"

export const metadata: Metadata = {
  title: "Seller Terms of Service — XerinMarket",
  description: "Terms of Service for sellers and merchants selling on XerinMarket marketplace.",
}

const lastUpdated = "August 2026"

const tocItems = [
  { num: "1", title: "Acceptance of Seller Terms" },
  { num: "2", title: "Seller Eligibility" },
  { num: "3", title: "Seller Account" },
  { num: "4", title: "Product Listings" },
  { num: "5", title: "Commissions and Fees" },
  { num: "6", title: "Order Fulfillment" },
  { num: "7", title: "Payouts" },
  { num: "8", title: "Returns and Refunds" },
  { num: "9", title: "Performance Standards" },
  { num: "10", title: "KYC and Compliance" },
  { num: "11", title: "Store and Branding" },
  { num: "12", title: "Prohibited Conduct" },
  { num: "13", title: "Intellectual Property" },
  { num: "14", title: "Account Suspension" },
  { num: "15", title: "Disclaimers & Liability" },
  { num: "16", title: "Governing Law" },
  { num: "17", title: "Contact" },
]

const keyPoints = [
  { icon: Wallet, title: "Commission-Based", desc: "Pay only when you sell — rates per category" },
  { icon: Package, title: "48hr Fulfillment", desc: "Confirm & ship orders within 48 hours" },
  { icon: FileCheck, title: "KYC Required", desc: "Verify identity before receiving payouts" },
  { icon: TrendingUp, title: "Performance Metrics", desc: "Maintain standards to stay visible" },
]

export default function SellerTermsPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-12 md:py-16">
      <Link href="/terms" className="mb-8 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> All Terms
      </Link>

      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <div className="flex size-14 items-center justify-center rounded-2xl bg-primary/10">
          <Store className="size-7 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight md:text-4xl">Seller Terms of Service</h1>
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
            <h2 id="section-1">1. Acceptance of Seller Terms</h2>
            <p>
              These Seller Terms of Service ("Seller Terms") govern your use of XerinMarket as a seller, merchant, or business entity. By registering as a seller, listing products, or using seller tools, you agree to these Seller Terms in addition to our <Link href="/terms/customer" className="text-primary underline">Customer Terms of Service</Link> and <Link href="/privacy" className="text-primary underline">Privacy Policy</Link>.
            </p>
            <p>
              XerinMarket ("we," "us," "our") reserves the right to update these Seller Terms at any time. Continued use of the seller platform after changes constitutes acceptance.
            </p>

            <h2 id="section-2">2. Seller Eligibility</h2>
            <ul>
              <li>You must be at least 18 years old and legally authorized to do business in the United Republic of Tanzania.</li>
              <li>You must provide a valid business name, business category, and contact information during registration.</li>
              <li>You must complete KYC (Know Your Customer) verification by submitting required identification and business documents.</li>
              <li>Sole proprietors, partnerships, and registered companies are all eligible to sell on XerinMarket.</li>
            </ul>

            <h2 id="section-3">3. Seller Account</h2>
            <ul>
              <li>Phone number verification via OTP is mandatory before listing products.</li>
              <li>You must keep your business information, contact details, and payout account information up to date.</li>
              <li>You are responsible for all activity under your seller account and must not share your credentials with unauthorized parties.</li>
              <li>You may not transfer or sell your seller account to another party without our written consent.</li>
            </ul>

            <h2 id="section-4">4. Product Listings</h2>
            <h3>4.1 General Requirements</h3>
            <ul>
              <li>All product listings must be accurate, including title, description, price, images, and specifications.</li>
              <li>Images must be your own or properly licensed. Stock images that misrepresent the product are prohibited.</li>
              <li>You must hold sufficient stock for listed products or clearly mark items as pre-order with estimated delivery times.</li>
              <li>Prices must be listed in Tanzanian Shillings (TZS) unless otherwise permitted.</li>
            </ul>
            <h3>4.2 Prohibited Products</h3>
            <div className="not-prose my-4 rounded-lg border border-destructive/20 bg-destructive/5 p-4">
              <div className="flex items-start gap-2.5">
                <Ban className="size-5 shrink-0 text-destructive" />
                <div>
                  <p className="text-sm font-semibold text-foreground">Strictly Prohibited</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Listing illegal goods, counterfeits, weapons, drugs, live animals, IP-infringing products, or any product prohibited under Tanzanian law will result in immediate removal and potential account suspension.
                  </p>
                </div>
              </div>
            </div>
            <ul>
              <li>Illegal goods, counterfeit products, or pirated materials.</li>
              <li>Weapons, firearms, ammunition, or explosives.</li>
              <li>Drugs, narcotics, or controlled substances.</li>
              <li>Live animals or protected wildlife products.</li>
              <li>Products that violate intellectual property rights (trademark, copyright, patent).</li>
              <li>Products that pose a health or safety hazard.</li>
              <li>Adult content or services.</li>
              <li>Any product prohibited under Tanzanian law.</li>
            </ul>
            <h3>4.3 Product Approval</h3>
            <p>
              XerinMarket reserves the right to review, approve, reject, or remove any product listing at our discretion. Products that violate these Seller Terms will be removed, and repeated violations may result in account suspension.
            </p>

            <h2 id="section-5">5. Commissions and Fees</h2>
            <div className="not-prose my-4 rounded-lg border border-primary/20 bg-primary/5 p-4">
              <div className="flex items-start gap-2.5">
                <Wallet className="size-5 shrink-0 text-primary" />
                <div>
                  <p className="text-sm font-semibold text-foreground">How Commissions Work</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Commission is deducted automatically from your payout before funds are transferred. Rates are per category and visible in your seller dashboard. We may update rates with 30 days' notice.
                  </p>
                </div>
              </div>
            </div>
            <ul>
              <li>XerinMarket charges a commission on each completed sale. The commission rate is determined per category and is displayed in your seller dashboard.</li>
              <li>Additional fees may apply for premium features, promoted listings, or shipping services.</li>
            </ul>

            <h2 id="section-6">6. Order Fulfillment</h2>
            <div className="not-prose my-4 rounded-lg border border-amber-500/20 bg-amber-500/5 p-4">
              <div className="flex items-start gap-2.5">
                <Package className="size-5 shrink-0 text-amber-600" />
                <div>
                  <p className="text-sm font-semibold text-foreground">48-Hour Shipping Requirement</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    You must confirm and ship orders within 48 hours of receiving them. Late shipments and repeated cancellations may reduce your visibility or result in penalties.
                  </p>
                </div>
              </div>
            </div>
            <ul>
              <li>You must provide accurate tracking information once an order is shipped.</li>
              <li>If you cannot fulfill an order, you must cancel it promptly and notify the customer with a valid reason.</li>
              <li>You are responsible for packaging products adequately to prevent damage during transit.</li>
            </ul>

            <h2 id="section-7">7. Payouts</h2>
            <ul>
              <li>Funds from completed sales are held in your XerinMarket wallet and released according to our payout schedule.</li>
              <li>Standard payout processing time is 3–5 business days after the buyer confirms receipt or the auto-confirmation period expires.</li>
              <li>You must maintain a valid payout account (bank account or mobile money) to receive funds.</li>
              <li>A minimum payout threshold may apply. Current thresholds are displayed in your wallet dashboard.</li>
              <li>XerinMarket is not liable for payouts to incorrect accounts if you fail to update your payout information.</li>
            </ul>

            <h2 id="section-8">8. Returns and Refunds</h2>
            <ul>
              <li>You must honor return requests for damaged, defective, or misdescribed products within 7 days of buyer receipt.</li>
              <li>If you disagree with a return request, XerinMarket will mediate and may make a binding decision.</li>
              <li>Refunds must be processed within 5 business days of return approval.</li>
              <li>Excessive return rates may result in a review of your seller status.</li>
            </ul>

            <h2 id="section-9">9. Seller Performance Standards</h2>
            <p>XerinMarket monitors seller performance based on the following metrics:</p>
            <div className="not-prose my-4 overflow-hidden rounded-lg border">
              <table className="w-full text-sm">
                <thead className="bg-muted">
                  <tr>
                    <th className="px-4 py-2.5 text-left font-semibold">Metric</th>
                    <th className="px-4 py-2.5 text-left font-semibold">Minimum Standard</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  <tr>
                    <td className="px-4 py-2.5">Order Cancellation Rate</td>
                    <td className="px-4 py-2.5 font-medium text-primary">Below 5%</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2.5">Late Shipment Rate</td>
                    <td className="px-4 py-2.5 font-medium text-primary">Below 10%</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2.5">Customer Rating</td>
                    <td className="px-4 py-2.5 font-medium text-primary">3.5+ stars avg</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2.5">Response Time</td>
                    <td className="px-4 py-2.5 font-medium text-primary">Within 24 hours</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p>
              Failure to meet these standards may result in warnings, reduced visibility, temporary suspension, or permanent removal from the platform.
            </p>

            <h2 id="section-10">10. KYC and Compliance</h2>
            <ul>
              <li>You must complete KYC verification before receiving payouts.</li>
              <li>Required documents include: national ID or passport, business registration certificate (if applicable), and tax identification number (TIN).</li>
              <li>You are responsible for complying with all applicable tax laws, including VAT and income tax obligations.</li>
              <li>XerinMarket may report seller earnings to tax authorities as required by law.</li>
            </ul>

            <h2 id="section-11">11. Store and Branding</h2>
            <ul>
              <li>You may customize your store with a name, logo, description, and policies within our guidelines.</li>
              <li>Your store name and branding must not infringe on trademarks or impersonate other businesses.</li>
              <li>XerinMarket retains the right to request changes to store branding that violates our policies.</li>
            </ul>

            <h2 id="section-12">12. Prohibited Conduct</h2>
            <p>As a seller, you must not:</p>
            <ul>
              <li>Manipulate reviews, ratings, or sales data.</li>
              <li>Engage in shill bidding or fake purchases.</li>
              <li>List products at misleading prices or with false availability.</li>
              <li>Direct customers to complete transactions outside XerinMarket.</li>
              <li>Use customer data obtained through the Platform for marketing outside XerinMarket without consent.</li>
              <li>Discriminate against buyers based on race, gender, religion, or other protected characteristics.</li>
            </ul>

            <h2 id="section-13">13. Intellectual Property</h2>
            <p>
              You retain ownership of your product images, descriptions, and store branding. By listing on XerinMarket, you grant us a non-exclusive license to display your content on the Platform for the purpose of facilitating sales. You must not list products that infringe on the intellectual property rights of others. We will remove listings and cooperate with rights holders in cases of infringement.
            </p>

            <h2 id="section-14">14. Account Suspension and Termination</h2>
            <p>
              We may suspend or terminate your seller account for violations of these Seller Terms, fraudulent activity, poor performance, or legal compliance issues. You may close your seller account at any time, provided all pending orders are fulfilled and outstanding fees are paid. Upon termination, any remaining funds (minus outstanding fees) will be paid to your registered payout account within 30 days.
            </p>

            <h2 id="section-15">15. Disclaimers and Limitation of Liability</h2>
            <div className="not-prose my-4 rounded-lg border border-destructive/20 bg-destructive/5 p-4">
              <div className="flex items-start gap-2.5">
                <AlertTriangle className="size-5 shrink-0 text-destructive" />
                <div>
                  <p className="text-sm font-semibold text-foreground">Liability Cap</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Our total liability to you shall not exceed the total commission fees you paid to XerinMarket in the preceding 6 months.
                  </p>
                </div>
              </div>
            </div>
            <p>
              XerinMarket provides the Platform on an "as is" basis. We are not liable for loss of sales due to Platform downtime, technical issues, or force majeure events.
            </p>

            <h2 id="section-16">16. Governing Law</h2>
            <p>
              These Seller Terms are governed by the laws of the United Republic of Tanzania. Disputes shall be resolved in the courts of Dar es Salaam, Tanzania.
            </p>

            <h2 id="section-17">17. Contact</h2>
            <p>
              For questions about these Seller Terms, contact us at{" "}
              <a href="mailto:sellers@xerinmarket.com" className="text-primary underline">sellers@xerinmarket.com</a>{" "}
              or write to:
            </p>
            <p>
              XerinMarket Seller Support<br />
              Dar es Salaam, Tanzania<br />
              Email: sellers@xerinmarket.com
            </p>
          </div>

          {/* Related documents */}
          <div className="mt-12 flex flex-col sm:flex-row gap-4">
            <Link href="/terms/customer" className="flex flex-1 items-center gap-3 rounded-xl border bg-card p-5 transition-all hover:border-primary/50 hover:shadow-md">
              <User className="size-5 text-primary" />
              <div>
                <p className="font-semibold">Customer Terms</p>
                <p className="text-sm text-muted-foreground">For buyers on XerinMarket</p>
              </div>
            </Link>
            <Link href="/privacy" className="flex flex-1 items-center gap-3 rounded-xl border bg-card p-5 transition-all hover:border-primary/50 hover:shadow-md">
              <ShieldCheck className="size-5 text-primary" />
              <div>
                <p className="font-semibold">Privacy Policy</p>
                <p className="text-sm text-muted-foreground">How we handle your data</p>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
