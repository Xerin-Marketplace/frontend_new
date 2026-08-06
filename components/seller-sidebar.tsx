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

const sellerData = {
  user: {
    name: "Acme Trading",
    email: "business@example.com",
    avatar: "/panda.png",
  },
  teams: [
    {
      name: "Acme Trading Co.",
      logo: Store,
      plan: "Premium Seller",
    },
    {
      name: "Electronics Hub",
      logo: Package,
      plan: "Standard",
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
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={sellerData.teams} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={sellerData.navMain} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={sellerData.user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
