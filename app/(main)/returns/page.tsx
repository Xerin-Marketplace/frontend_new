import type { Metadata } from "next"
import { PolicyPage, type PolicySection } from "@/components/policy-page"

export const metadata: Metadata = { title: "Return & Refund Policy — XerinMarket", description: "When and how customers may request returns and refunds on XerinMarket." }

const sections: PolicySection[] = [
  { title: "When a Refund May Apply", paragraphs: ["A refund may be available when goods are defective, are not delivered or are materially different from their description."], bullets: ["Defective goods", "Non-delivery", "Goods materially different from the listing description"] },
  { title: "Requesting a Refund", paragraphs: ["A refund request must be submitted within the period shown to the customer at the time of purchase or delivery. Provide order information and a clear explanation so the request can be reviewed."] },
  { title: "Approved Refunds", paragraphs: ["An approved refund is processed using the original payment method. Processing time may depend on the payment provider."] },
  { title: "Non-refundable Products", paragraphs: ["Some products may be non-refundable where the seller clearly discloses this before sale and the restriction is permitted by Tanzanian consumer protection laws."] },
  { title: "Fair Review", paragraphs: ["Xerin aims to handle refund concerns transparently and fairly. Customers who need assistance can contact the support team through the designated support channels."] },
]

export default function ReturnsPage() { return <PolicyPage title="Return & Refund Policy" description="How Xerin handles defective, undelivered or materially misdescribed goods." sections={sections} /> }
