import type { Metadata } from "next"
import { PolicyPage, type PolicySection } from "@/components/policy-page"

export const metadata: Metadata = { title: "Return & Refund Policy — XerinMarket", description: "When and how customers may request returns and refunds on XerinMarket." }

const sections: PolicySection[] = [
  { title: "Return Window", paragraphs: ["Customers may request a return within 7 days of delivery for most products. The return window is communicated at the time of purchase and confirmed in your order confirmation."], bullets: ["7 days from delivery date for eligible products", "Defective or damaged goods can be reported immediately", "Some categories (e.g. perishables, personal care) may be non-returnable"] },
  { title: "When a Return May Apply", paragraphs: ["A return may be requested when goods are defective, not delivered, or materially different from their listing description."], bullets: ["Defective or damaged goods", "Non-delivery or wrong item received", "Goods materially different from the listing description"] },
  { title: "Requesting a Return", paragraphs: ["To request a return, go to your order history, select the order, and submit a return request with a clear description of the issue and photos where applicable. Include your order reference (e.g. XM-260811-00125) for faster processing."] },
  { title: "Return Shipping Responsibility", paragraphs: ["If the return is due to a seller error (defective, wrong, or damaged item), XerinMarket covers return shipping costs. If the return is due to a change of mind, the customer is responsible for return shipping costs."] },
  { title: "Inspection & Dispute Process", paragraphs: ["Once the returned item is received at our Xerin Hub, it will be inspected within 2 business days. If the return is approved, a refund will be initiated. If there is a dispute, XerinMarket's support team will mediate between buyer and seller to reach a fair resolution."] },
  { title: "Refund Processing Timeline", paragraphs: ["Approved refunds are processed back to the original payment method within 3-5 business days. Mobile money refunds may appear within 24 hours. Card refunds may take 5-10 business days depending on your bank."] },
  { title: "Refund Status Tracking", paragraphs: ["You can track your refund status in your order history. Statuses include: Return Requested → Return Approved → Item Received at Hub → Inspection Complete → Refund Initiated → Refund Completed."] },
  { title: "Non-refundable Products", paragraphs: ["Some products may be non-refundable where the seller clearly discloses this before sale and the restriction is permitted by Tanzanian consumer protection laws."] },
  { title: "Need Help?", paragraphs: ["If you need assistance with a return or refund, contact our support team through the Help Center or email support@xerin.co.tz with your order reference."] },
]

export default function ReturnsPage() { return <PolicyPage title="Return & Refund Policy" description="How Xerin handles defective, undelivered or materially misdescribed goods." sections={sections} /> }
