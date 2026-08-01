import { Metadata } from "next"
import Link from "next/link"
import { ArrowLeft, User, ShoppingCart, Truck, RotateCcw, ShieldCheck, AlertTriangle, Scale } from "lucide-react"

export const metadata: Metadata = {
  title: "Customer Terms of Service — XerinMarket",
  description: "Terms of Service for customers and buyers using XerinMarket marketplace.",
}

const lastUpdated = "August 2026"

const tocItems = [
  { num: "1", title: "Acceptance of Terms" },
  { num: "2", title: "Eligibility" },
  { num: "3", title: "Account Registration" },
  { num: "4", title: "Purchasing Products" },
  { num: "5", title: "Shipping and Delivery" },
  { num: "6", title: "Returns and Refunds" },
  { num: "7", title: "Prohibited Conduct" },
  { num: "8", title: "Reviews and Ratings" },
  { num: "9", title: "Intellectual Property" },
  { num: "10", title: "Disclaimers" },
  { num: "11", title: "Limitation of Liability" },
  { num: "12", title: "Account Suspension" },
  { num: "13", title: "Changes to Terms" },
  { num: "14", title: "Governing Law" },
  { num: "15", title: "Contact Us" },
]

const keyPoints = [
  { icon: ShoppingCart, title: "Secure Payments", desc: "Funds held until you confirm receipt" },
  { icon: Truck, title: "Fast Delivery", desc: "Accurate shipping estimates from sellers" },
  { icon: RotateCcw, title: "7-Day Returns", desc: "Return damaged or misdescribed items" },
  { icon: ShieldCheck, title: "Buyer Protection", desc: "Mediation for dispute resolution" },
]

export default function CustomerTermsPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-12 md:py-16">
      <Link href="/terms" className="mb-8 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> All Terms
      </Link>

      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <div className="flex size-14 items-center justify-center rounded-2xl bg-primary/10">
          <User className="size-7 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight md:text-4xl">Customer Terms of Service</h1>
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
            <h2 id="section-1">1. Acceptance of Terms</h2>
            <p>
              Welcome to XerinMarket ("we," "us," "our," or "XerinMarket"). By creating an account, browsing, or purchasing products on our platform at xerinmarketplace.com (the "Platform"), you agree to be bound by these Customer Terms of Service ("Terms"). If you do not agree to these Terms, please do not use the Platform.
            </p>
            <p>
              These Terms apply to you as a customer or buyer. If you are also a seller on XerinMarket, you must additionally review and agree to our <Link href="/terms/seller" className="text-primary underline">Seller Terms of Service</Link>.
            </p>

            <h2 id="section-2">2. Eligibility</h2>
            <p>
              You must be at least 18 years old to create an account and make purchases on XerinMarket. By registering, you confirm that you are legally capable of entering into binding contracts under the laws of the United Republic of Tanzania.
            </p>

            <h2 id="section-3">3. Account Registration</h2>
            <ul>
              <li>You must provide accurate, current, and complete information during registration.</li>
              <li>You are responsible for maintaining the confidentiality of your account credentials.</li>
              <li>You agree to notify us immediately of any unauthorized use of your account.</li>
              <li>One person may not maintain multiple accounts without our prior written consent.</li>
              <li>Phone number verification via OTP is required to activate your account.</li>
            </ul>

            <h2 id="section-4">4. Purchasing Products</h2>
            <h3>4.1 Orders</h3>
            <p>
              When you place an order on XerinMarket, you are entering into a purchase agreement with the seller of that product, not with XerinMarket directly. XerinMarket acts as an intermediary platform connecting buyers with sellers.
            </p>
            <h3>4.2 Pricing and Availability</h3>
            <p>
              All prices are listed in Tanzanian Shillings (TZS) unless otherwise stated. Prices and product availability may change without notice. We reserve the right to cancel any order if the product is unavailable, the price was listed incorrectly, or the order violates these Terms.
            </p>
            <h3>4.3 Payment</h3>
            <div className="not-prose my-4 rounded-lg border border-primary/20 bg-primary/5 p-4">
              <div className="flex items-start gap-2.5">
                <ShieldCheck className="size-5 shrink-0 text-primary" />
                <div>
                  <p className="text-sm font-semibold text-foreground">Escrow Protection</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Your payment is held securely until the seller confirms and ships your order. Funds are released to the seller only after you confirm receipt or the automatic confirmation period expires.
                  </p>
                </div>
              </div>
            </div>
            <p>
              Payments are processed through our integrated payment partners including AzamPay, mobile money (M-Pesa, Airtel Money, Halopesa, Tigo Pesa), and card payments.
            </p>

            <h2 id="section-5">5. Shipping and Delivery</h2>
            <p>
              Delivery times are estimates provided by the seller and shipping providers. XerinMarket is not liable for delays caused by sellers, shipping companies, or circumstances beyond our control. You are responsible for providing an accurate delivery address. If a package is returned due to an incorrect address, additional shipping fees may apply.
            </p>

            <h2 id="section-6">6. Returns and Refunds</h2>
            <div className="not-prose my-4 rounded-lg border border-amber-500/20 bg-amber-500/5 p-4">
              <div className="flex items-start gap-2.5">
                <RotateCcw className="size-5 shrink-0 text-amber-600" />
                <div>
                  <p className="text-sm font-semibold text-foreground">7-Day Return Window</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    You may request a return within 7 days of receiving your product if the item is damaged, defective, or significantly different from what was described.
                  </p>
                </div>
              </div>
            </div>
            <ul>
              <li>Refunds are processed to your original payment method within 5–10 business days after the return is approved.</li>
              <li>Certain product categories (e.g., perishable goods, digital products, personalized items) may not be eligible for returns.</li>
              <li>For return disputes, XerinMarket reserves the right to mediate and make a final determination.</li>
            </ul>

            <h2 id="section-7">7. Prohibited Conduct</h2>
            <p>You agree not to:</p>
            <ul>
              <li>Use the Platform for any illegal or unauthorized purpose.</li>
              <li>Submit false, misleading, or fraudulent orders.</li>
              <li>Attempt to manipulate prices, reviews, or ratings.</li>
              <li>Harass, abuse, or threaten sellers or other customers.</li>
              <li>Reverse engineer, scrape, or disrupt the Platform's infrastructure.</li>
              <li>Use bots or automated systems to make purchases without our consent.</li>
              <li>Resell products purchased on XerinMarket without seller or platform authorization where required.</li>
            </ul>

            <h2 id="section-8">8. Reviews and Ratings</h2>
            <p>
              You may leave reviews and ratings for products and sellers. Reviews must be honest and based on your genuine experience. We reserve the right to remove reviews that are abusive, fraudulent, spam, or violate our community guidelines. Posting fake reviews may result in account suspension.
            </p>

            <h2 id="section-9">9. Intellectual Property</h2>
            <p>
              All content on XerinMarket, including logos, designs, text, graphics, and software, is the property of XerinMarket or its licensors and is protected by intellectual property laws. You may not copy, reproduce, or distribute our content without written permission.
            </p>

            <h2 id="section-10">10. Disclaimers</h2>
            <p>
              XerinMarket is provided "as is" and "as available." We do not guarantee that the Platform will be uninterrupted, error-free, or secure. We are not responsible for the quality, safety, or legality of products listed by sellers. You purchase at your own risk, and any disputes about product quality should primarily be resolved with the seller.
            </p>

            <h2 id="section-11">11. Limitation of Liability</h2>
            <div className="not-prose my-4 rounded-lg border border-destructive/20 bg-destructive/5 p-4">
              <div className="flex items-start gap-2.5">
                <AlertTriangle className="size-5 shrink-0 text-destructive" />
                <div>
                  <p className="text-sm font-semibold text-foreground">Liability Cap</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Our total liability for any claim shall not exceed the amount you paid to XerinMarket in the preceding 12 months.
                  </p>
                </div>
              </div>
            </div>
            <p>
              To the maximum extent permitted by law, XerinMarket shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including loss of profits, data, or goodwill, arising from your use of the Platform.
            </p>

            <h2 id="section-12">12. Account Suspension and Termination</h2>
            <p>
              We may suspend or terminate your account at any time if you violate these Terms, engage in fraudulent activity, or harm other users. You may close your account at any time by contacting customer support. Upon termination, your right to use the Platform ceases immediately.
            </p>

            <h2 id="section-13">13. Changes to These Terms</h2>
            <p>
              We may update these Terms from time to time. We will notify you of significant changes via email or a notice on the Platform. Continued use of XerinMarket after changes take effect constitutes acceptance of the updated Terms.
            </p>

            <h2 id="section-14">14. Governing Law</h2>
            <p>
              These Terms are governed by the laws of the United Republic of Tanzania. Any disputes shall be resolved in the courts of Dar es Salaam, Tanzania, unless we agree otherwise in writing.
            </p>

            <h2 id="section-15">15. Contact Us</h2>
            <p>
              If you have questions about these Terms, please contact us at{" "}
              <a href="mailto:legal@xerinmarket.com" className="text-primary underline">legal@xerinmarket.com</a>{" "}
              or write to:
            </p>
            <p>
              XerinMarket Legal Team<br />
              Dar es Salaam, Tanzania<br />
              Email: legal@xerinmarket.com
            </p>
          </div>

          {/* Related documents */}
          <div className="mt-12 flex flex-col sm:flex-row gap-4">
            <Link href="/terms/seller" className="flex flex-1 items-center gap-3 rounded-xl border bg-card p-5 transition-all hover:border-primary/50 hover:shadow-md">
              <Scale className="size-5 text-primary" />
              <div>
                <p className="font-semibold">Seller Terms</p>
                <p className="text-sm text-muted-foreground">Selling on XerinMarket</p>
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
