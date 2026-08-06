"use client"

import * as React from "react"
import {
  Store,
  LayoutDashboard,
  Package,
  ShoppingBag,
  Wallet,
  Truck,
  Settings,
  FileCheck,
  Boxes,
  type LucideIcon,
} from "lucide-react"

import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import { TeamSwitcher } from "@/components/team-switcher"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"
import { api } from "@/lib/api"
import { useAuth } from "@/lib/auth-context"

const sellerData = {
  user: {
    name: "Loading...",
    email: "",
    avatar: "/panda.png",
  },
  teams: [
    {
      name: "Loading...",
      logo: Store,
      plan: "Seller",
    },
  ],
  navMain: [
    {
      title: "Dashboard",
      url: "/dashboard/seller",
      icon: LayoutDashboard,
      isActive: true,
      items: [
        { title: "Overview", url: "/dashboard/seller" },
        { title: "Sales Analytics", url: "/dashboard/seller/analytics" },
        { title: "Revenue", url: "/dashboard/seller/revenue" },
      ],
    },
    {
      title: "Catalog",
      url: "/dashboard/seller/products",
      icon: Package,
      items: [
        { title: "All Products", url: "/dashboard/seller/products" },
        { title: "Brands", url: "/dashboard/seller/products/brands" },
      ],
    },
    {
      title: "Inventory",
      url: "/dashboard/seller/inventory",
      icon: Boxes,
      items: [
        { title: "Stock Overview", url: "/dashboard/seller/inventory" },
        { title: "Low Stock Alerts", url: "/dashboard/seller/inventory/low-stock" },
        { title: "Restock History", url: "/dashboard/seller/inventory/restocks" },
        { title: "Settings", url: "/dashboard/seller/inventory/settings" },
      ],
    },
    {
      title: "Orders",
      url: "/dashboard/seller/orders",
      icon: ShoppingBag,
      items: [
        { title: "All Orders", url: "/dashboard/seller/orders" },
        { title: "New Orders", url: "/dashboard/seller/orders?status=new" },
        { title: "Processing", url: "/dashboard/seller/orders?status=processing" },
        { title: "Shipped", url: "/dashboard/seller/orders?status=shipped" },
        { title: "Delivered", url: "/dashboard/seller/orders?status=delivered" },
        { title: "Cancellations", url: "/dashboard/seller/orders/cancellations" },
      ],
    },
    {
      title: "KYC & Verification",
      url: "/dashboard/seller/kyc",
      icon: FileCheck,
    },
    {
      title: "Wallet & Payouts",
      url: "/dashboard/seller/wallet",
      icon: Wallet,
      items: [
        { title: "Balance", url: "/dashboard/seller/wallet" },
        { title: "Transactions", url: "/dashboard/seller/wallet/transactions" },
        { title: "Request Payout", url: "/dashboard/seller/wallet/payouts/new" },
        { title: "Payout History", url: "/dashboard/seller/wallet/payouts" },
        { title: "Payout Accounts", url: "/dashboard/seller/wallet/accounts" },
      ],
    },
    {
      title: "Store Profile",
      url: "/dashboard/seller/store",
      icon: Store,
    },
    {
      title: "Shipping",
      url: "/dashboard/seller/shipping",
      icon: Truck,
      items: [
        { title: "Zones", url: "/dashboard/seller/shipping/zones" },
        { title: "Methods", url: "/dashboard/seller/shipping/methods" },
        { title: "Rates", url: "/dashboard/seller/shipping/rates" },
        { title: "Shipments", url: "/dashboard/seller/shipping/shipments" },
      ],
    },
    {
      title: "Settings",
      url: "/dashboard/seller/settings",
      icon: Settings,
      items: [
        { title: "Account", url: "/dashboard/seller/settings" },
        { title: "Notifications", url: "/dashboard/seller/settings/notifications" },
        { title: "Security", url: "/dashboard/seller/settings/security" },
      ],
    },
  ],
}

export function SellerSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user: authUser } = useAuth()
  const [sellerInfo, setSellerInfo] = React.useState<{ businessName: string; status: string } | null>(null)

  React.useEffect(() => {
    api.get<{ business_name: string; status: string }>("/sellers/me")
      .then((data) => {
        setSellerInfo({ businessName: data.business_name, status: data.status })
      })
      .catch(() => {
        setSellerInfo({ businessName: "My Store", status: "approved" })
      })
  }, [])

  const userName = authUser
    ? `${authUser.first_name} ${authUser.last_name}`.trim() || authUser.email
    : "Loading..."
  const userEmail = authUser?.email ?? ""

  const teams = [{
    name: sellerInfo?.businessName ?? "Loading...",
    logo: Store,
    plan: sellerInfo?.status === "approved" ? "Verified Seller" : sellerInfo?.status === "pending" ? "Pending Review" : "Seller",
  }]

  const user = {
    name: userName,
    email: userEmail,
    avatar: "/panda.png",
  }

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={teams} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={sellerData.navMain} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
