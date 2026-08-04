import type { Metadata } from "next"
import { PolicyPage, type PolicySection } from "@/components/policy-page"

export const metadata: Metadata = { title: "Privacy Policy — XerinMarket", description: "How XerinMarket collects, uses, protects and retains personal information." }

const sections: PolicySection[] = [
  { title: "Information We Process", paragraphs: ["Xerin collects and processes personal information needed to operate the marketplace. This may include names, contact details, payment information, delivery addresses and transaction records."], bullets: ["Provide marketplace services", "Verify user accounts", "Process payments and orders", "Improve platform security", "Meet legal and regulatory obligations"] },
  { title: "Your Data Rights", paragraphs: ["Users may request access to their personal data, correction of inaccurate information or deletion of their information. Some information may still be retained where Xerin has a legal obligation or needs it for dispute resolution." ] },
  { title: "How We Protect Information", paragraphs: ["Xerin uses reasonable technical and organisational measures to protect personal information against unauthorised access, loss or misuse. Our privacy practices are guided by Tanzania’s Personal Data Protection Act, 2022 and other applicable laws."] },
  { title: "Cookies", paragraphs: ["Xerin uses cookies to understand website interactions, analyse traffic, improve services and provide a more useful browsing experience. Users can manage cookie preferences through their browser settings."] },
  { title: "Data Retention", paragraphs: ["Personal data is retained only as long as required for business purposes, legal requirements and regulatory obligations. When it is no longer needed, it is securely deleted or anonymised."] },
  { title: "Account Deletion", paragraphs: ["Users may request account deletion through the application or customer support. Certain records may be retained where required by law or for dispute resolution."] },
]

export default function PrivacyPage() { return <PolicyPage title="Privacy Policy" description="Your privacy matters. This policy explains how Xerin handles personal information in line with Tanzanian law." sections={sections} /> }
