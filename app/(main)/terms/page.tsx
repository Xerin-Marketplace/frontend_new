import type { Metadata } from "next"
import { PolicyPage, type PolicySection } from "@/components/policy-page"

export const metadata: Metadata = { title: "Terms of Service — XerinMarket", description: "Terms governing the use of XerinMarket by buyers and sellers." }

const sections: PolicySection[] = [
  { title: "Using Xerin", paragraphs: ["Creating an account and using Xerin forms a binding agreement between the user and Xerin. Users must provide accurate, current information and keep their accounts and passwords secure.", "Xerin operates as an online marketplace that facilitates transactions between buyers and sellers unless expressly stated otherwise."] },
  { title: "Acceptable Use", paragraphs: ["Illegal, fraudulent or prohibited activity is not allowed. Users must not upload unlawful, misleading or intellectual-property-infringing content."], bullets: ["No fraud or impersonation", "No malware distribution or abusive behaviour", "No unlawful, misleading or infringing listings", "Xerin may remove violating content and suspend involved accounts"] },
  { title: "Seller Responsibilities", paragraphs: ["Sellers must provide accurate business information and comply with Tanzanian laws. Each seller is responsible for the quality, legality and pricing of products offered.", "Xerin may suspend or terminate sellers who breach marketplace policies. Commission structures and payment terms are provided during seller onboarding."] },
  { title: "Shipping", paragraphs: ["Products must be dispatched within the timelines agreed at sale. Delivery estimates may vary by location and logistics. Shipping costs are shown before checkout. Buyers should inspect goods upon receipt and promptly report any problem."] },
  { title: "Policy Changes and Disputes", paragraphs: ["These terms are governed by the laws of the United Republic of Tanzania. Parties should first seek an amicable solution before going to a competent court or another agreed dispute-resolution mechanism.", "Xerin may update these policies to meet legal or operational requirements. Continued use of the service means acceptance of revised policies."] },
]

export default function TermsPage() { return <PolicyPage title="Terms of Service" description="The rules that help buyers, sellers and Xerin maintain a fair, safe and reliable marketplace." sections={sections} /> }
