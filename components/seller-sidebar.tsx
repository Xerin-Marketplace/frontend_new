"use client"

import * as React from "react"
import {
  Store,
  LayoutDashboard,
  Package,
  ShoppingBag,
  BarChart3,
  Wallet,
  Tag,
  Truck,
  MessageSquare,
  Settings,
  TrendingUp,
} from "lucide-react"

import { NavMain } from "@/components/nav-main"
import { NavProjects } from "@/components/nav-projects"
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
        { title: "Sales", url: "/dashboard/seller/analytics" },
        { title: "Revenue", url: "/dashboard/seller/revenue" },
      ],
    },
    {
      title: "Catalog",
      url: "/dashboard/seller/products",
      icon: Package,
      items: [
        { title: "All Products", url: "/dashboard/seller/products" },
        { title: "Add Product", url: "/dashboard/seller/products/new" },
        { title: "Categories", url: "/dashboard/seller/products/categories" },
        { title: "Inventory", url: "/dashboard/seller/products/inventory" },
      ],
    },
    {
      title: "Orders",
      url: "/dashboard/seller/orders",
      icon: ShoppingBag,
      items: [
        { title: "All Orders", url: "/dashboard/seller/orders" },
        { title: "Pending", url: "/dashboard/seller/orders?status=pending" },
        { title: "Completed", url: "/dashboard/seller/orders?status=completed" },
        { title: "Returns", url: "/dashboard/seller/orders/returns" },
      ],
    },
    {
      title: "Marketing",
      url: "/dashboard/seller/promotions",
      icon: Tag,
      items: [
        { title: "Promotions", url: "/dashboard/seller/promotions" },
        { title: "Coupons", url: "/dashboard/seller/promotions/coupons" },
        { title: "Campaigns", url: "/dashboard/seller/promotions/campaigns" },
      ],
    },
    {
      title: "Settings",
      url: "/dashboard/seller/settings",
      icon: Settings,
      items: [
        { title: "Store Profile", url: "/dashboard/seller/settings" },
        { title: "Payments", url: "/dashboard/seller/settings/payments" },
        { title: "Shipping", url: "/dashboard/seller/shipping" },
        { title: "Notifications", url: "/dashboard/seller/settings/notifications" },
      ],
    },
  ],
  projects: [
    {
      name: "Wallet",
      url: "/dashboard/seller/wallet",
      icon: Wallet,
    },
    {
      name: "Analytics",
      url: "/dashboard/seller/analytics",
      icon: BarChart3,
    },
    {
      name: "Messages",
      url: "/dashboard/seller/messages",
      icon: MessageSquare,
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
        <NavProjects projects={sellerData.projects} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={sellerData.user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
