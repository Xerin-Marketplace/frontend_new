import { Metadata } from "next"
import TrackOrderClient from "./track-order-client"

export const metadata: Metadata = {
  title: "Track Order — XerinMarket",
  description: "Track your XerinMarket order in real-time. Enter your order ID to see delivery status and tracking details.",
}

export default function TrackOrderPage() {
  return <TrackOrderClient />
}
